"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Tooltip, App, ConfigProvider, theme as antdTheme } from "antd";
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
  Loader2,
  Filter,
  ListChecks,
  Split,
} from "lucide-react";
import { useBulkConvertBugsToTickets, useBulkMapBugsToTicket } from "@/hooks/useBugList";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { useUserProjects, useProjectMembers } from "@/hooks/useGlobalData";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import type { BugListItem } from "@/services/bugListService";
import TicketService, { Ticket } from "@/services/ticketService";
import {
  ZukvoLogo,
  LinearMark,
  TicketFlowHeader,
  TicketFlowCard,
} from "./ticket-flow";

type Mode = null | "manual" | "map";
type GroupKey = "none" | "severity" | "type" | "module";

interface Props {
  open: boolean;
  bugs: BugListItem[];
  onClose: () => void;
  onPickAi: () => void;
  prefilledProjectId?: string;
  /** Render as a wizard step body — no Modal of its own. */
  embedded?: boolean;
  /** When embedded, the wizard owns method selection and passes it in. */
  forcedMode?: "manual" | "map";
  /** Step back to the method picker (embedded only). */
  onBack?: () => void;
}

const SEVERITY_RANK: Record<string, number> = {
  blocker: 0,
  critical: 1,
  major: 2,
  minor: 3,
};

export default function BulkTicketModal({ open, bugs, onClose, onPickAi, prefilledProjectId, embedded, forcedMode, onBack }: Props) {
  const { user } = useAuth();
  const hasPrime = !user?.subscriptionFeatures ? true : user.subscriptionFeatures.includes('work_qa_space_bug_list_prime');
  const hasGrid = !user?.subscriptionFeatures ? true : user.subscriptionFeatures.includes('work_qa_space_bug_list_grid');
  const { theme } = useTheme();
  const convert = useBulkConvertBugsToTickets();
  const { data: projects } = useUserProjects();

  const { message } = App.useApp();

  const [mode, setMode] = useState<Mode>(forcedMode ?? null);
  const [pool, setPool] = useState<BugListItem[]>([]);

  const bulkMap = useBulkMapBugsToTicket();
  const [existingTickets, setExistingTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>();
  const [searchingTickets, setSearchingTickets] = useState(false);
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");

  const searchExistingTickets = async (query: string) => {
    setTicketSearchQuery(query);
    setSearchingTickets(true);
    try {
      const res = await TicketService.getTickets({ search: query || undefined, limit: 30 });
      setExistingTickets(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingTickets(false);
    }
  };

  useEffect(() => {
    if (mode === "map") {
      searchExistingTickets("");
      setSelectedTicketId(undefined);
    }
  }, [mode]);

  const handleMapBugs = async () => {
    if (!selectedTicketId) {
      message.warning("Please select a ticket to link");
      return;
    }
    try {
      await bulkMap.mutateAsync({
        ticketId: selectedTicketId,
        bugIds: pool.map((b) => b.id),
      });
      onClose();
    } catch {
      // handled by hook
    }
  };
  const [staged, setStaged] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupKey>("none");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>();
  // `members` will only populate once projectId is selected.
  const { data: members = [] } = useProjectMembers(projectId);
  
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [isAssigneeManuallyChanged, setIsAssigneeManuallyChanged] = useState(false);

  const [createdCount, setCreatedCount] = useState(0);

  // Snapshot the bug pool ONCE per open-session. Re-syncing on every `bugs`
  // prop change would clobber local pool mutations (e.g., consuming bugs after
  // a successful create), because the parent's selectedBugs refreshes after
  // the bulk-convert query invalidation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    setMode(forcedMode ?? null);
    setPool(bugs);
    setStaged(new Set());
    setGroupBy("none");
    setSearch("");
    setCollapsed(new Set());
    setTitle("");
    setProjectId(prefilledProjectId);

    // Pre-fill assignee if all bugs have the same assignee (including unassigned state)
    const allSameAssignee = bugs.length > 0 &&
      bugs.every(bug => bug.assigneeId === bugs[0].assigneeId);
    setAssigneeId(allSameAssignee ? (bugs[0].assigneeId || undefined) : undefined);
    setIsAssigneeManuallyChanged(false);

    setCreatedCount(0);
  }, [open, prefilledProjectId, forcedMode]); // Remove 'bugs' to prevent mode reset during ticket creation

  const stagedBugs = useMemo(
    () => pool.filter((b) => staged.has(b.id)),
    [pool, staged],
  );

  const handleAssigneeChange = (value: string | undefined) => {
    setAssigneeId(value);
    setIsAssigneeManuallyChanged(true);
  };

  useEffect(() => {
    if (stagedBugs.length === 0) {
      setIsAssigneeManuallyChanged(false);
      setAssigneeId(undefined);
      return;
    }

    if (!isAssigneeManuallyChanged) {
      const firstAssignee = stagedBugs[0].assigneeId;
      const allSame = stagedBugs.every((b) => b.assigneeId === firstAssignee);
      if (allSame) {
        setAssigneeId(firstAssignee || undefined);
      } else {
        setAssigneeId(undefined);
      }
    }
  }, [stagedBugs, isAssigneeManuallyChanged]);

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
        assigneeId: assigneeId || b.assigneeId || undefined,
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

  const body = (
      <ConfigProvider
        theme={{
          algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorBgContainer: theme === 'dark' ? '#0a0f1c' : '#ffffff',
            colorText: theme === 'dark' ? '#e6e8ee' : '#111827',
          }
        }}
      >
        {!embedded && mode === null && (
          <ModePicker
            count={pool.length}
            createdCount={createdCount}
            onClose={onClose}
            onManual={() => setMode("manual")}
            onAi={onPickAi}
            onMap={() => setMode("map")}
            hasPrime={hasPrime}
            hasGrid={hasGrid}
          />
        )}

        <div className={`hb-btm ${embedded ? "hb-btm-flat" : ""}`} style={{ display: mode === null ? "none" : undefined }}>
          {mode === "manual" && (
            <ManualWorkspace
              onBack={embedded ? onBack : () => setMode(null)}
              hideClose={embedded}
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
              onAssigneeId={handleAssigneeChange}
              projects={projects || []}
              members={members}
              converting={convert.isPending}
              onCreateSingle={handleCreateSingle}
              onCreateSplit={handleCreateSplit}
              onClose={onClose}
              theme={theme}
            />
          )}

          {mode === "map" && (
            <MapWorkspace
              onBack={embedded ? onBack : () => setMode(null)}
              hideClose={embedded}
              bugs={pool}
              ticketId={selectedTicketId}
              onTicketId={setSelectedTicketId}
              tickets={existingTickets}
              onSearchTickets={searchExistingTickets}
              searchingTickets={searchingTickets}
              searchQuery={ticketSearchQuery}
              onSubmit={handleMapBugs}
              onClose={onClose}
              theme={theme}
              loading={bulkMap.isPending}
            />
          )}
        </div>
      </ConfigProvider>
  );

  if (embedded) return body;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      destroyOnHidden
      width={mode === "manual" || mode === "map" ? 1080 : 1040}
      centered
      maskClosable={false}
      wrapClassName={`hb-btm-wrap ${theme === "dark" ? "hb-btm-dark" : "hb-btm-light"}`}
      styles={{
        mask: { backdropFilter: "blur(10px)", background: "rgba(11,15,26,0.62)" },
        content: { padding: 0, borderRadius: 20, overflow: "hidden", background: "transparent", boxShadow: "0 40px 100px rgba(8,12,24,0.5)" },
        body: { padding: 0 },
      }}
    >
      {body}
    </Modal>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// ───────────────────────────────────────────────────────────────────────────
// Mode picker
// ───────────────────────────────────────────────────────────────────────────

export function ModePicker({
  count,
  createdCount,
  onClose,
  onManual,
  onAi,
  onMap,
  hasPrime,
  hasGrid,
  hideMap,
  brand = "zukvo",
}: {
  count: number;
  createdCount: number;
  onClose: () => void;
  onManual: () => void;
  onAi: () => void;
  onMap?: () => void;
  hasPrime?: boolean;
  hasGrid?: boolean;
  hideMap?: boolean;
  /** Which destination this batch is headed to — drives the logo and copy. */
  brand?: "zukvo" | "linear" | "jira";
}) {
  const isLinear = brand === "linear";

  const showManual = hasGrid !== false;
  const showAi = hasPrime !== false;
  const showMap = !hideMap && hasGrid !== false;
  const cols = [showManual, showAi, showMap].filter(Boolean).length || 1;

  const bugLabel = `${count} bug${count === 1 ? "" : "s"}`;

  return (
    <>
      <TicketFlowHeader
        mark={isLinear ? <LinearMark size={22} /> : <ZukvoLogo size={22} />}
        title={
          count === 0
            ? "Every bug has been bundled"
            : `How should ${count === 1 ? "this bug" : `these ${count} bugs`} become tickets?`
        }
        eyebrow={`Step 2 · ${isLinear ? "Linear" : "Zukvo"} method`}
        chips={[
          {
            icon: <ListChecks size={12} />,
            label: count === 0 ? "Nothing left in the queue" : `${bugLabel} in the queue`,
            tone: count === 0 ? "default" : "accent",
          },
          ...(createdCount > 0
            ? [
                {
                  icon: <CheckCircle2 size={12} />,
                  label: `${createdCount} ticket${createdCount === 1 ? "" : "s"} created`,
                  tone: "ok" as const,
                },
              ]
            : []),
          {
            icon: <Split size={12} />,
            label: "Mix & match across batches",
          },
        ]}
      />

      <div className="tf-body">
        <div className="tf-section">
          Methods
          <span className="tf-section-count">{cols}</span>
          <span className="tf-section-hint">Switch method any time</span>
        </div>

        <div className="tf-grid" style={{ ["--tf-cols" as string]: cols }}>
          {showManual && (
            <TicketFlowCard
              mark={<Hand size={20} />}
              tone="blue"
              badge={{ label: "Full control", tone: "accent" }}
              name="Hand-pick"
              sub="Stage a few bugs, write the ticket, repeat — with group-by helpers and a per-ticket assignee."
              feats={[
                "Decide exactly what lands together",
                "Select 5 of 20, then 5 more…",
                "Group by severity, type or module",
              ]}
              cta="Continue manually"
              onClick={onManual}
            />
          )}

          {showAi && (
            <TicketFlowCard
              mark={<Wand2 size={20} />}
              tone="blue"
              badge={{ label: "Recommended", tone: "ok", dot: true }}
              name="AI assist"
              sub="Auto-cluster the bugs by context and polish every description before anything is created."
              feats={[
                "Smart grouping by feature area",
                "Cleaned titles + repro steps",
                "Review and edit before you ship",
              ]}
              cta="Continue with AI"
              onClick={onAi}
            />
          )}

          {showMap && (
            <TicketFlowCard
              mark={<LinkIcon size={20} />}
              tone="green"
              badge={{ label: "Link", tone: "muted" }}
              name="Map to existing"
              sub="Attach these bugs to a ticket that already exists in your workspace instead of creating a new one."
              feats={[
                "Search by ticket number or title",
                "One-click quick link",
                "Bugs flip to converted automatically",
              ]}
              cta="Continue mapping"
              onClick={onMap ?? (() => {})}
            />
          )}
        </div>

        <div className="tf-quick">
          <div className="tf-quick-label">
            <Sparkles size={13} />
            {createdCount > 0
              ? `${createdCount} ticket${createdCount === 1 ? "" : "s"} created so far — pick a method for the next batch.`
              : "Not sure? AI assist groups the batch for you and you still approve every ticket."}
          </div>
          {showAi && createdCount === 0 && (
            <div className="tf-quick-actions">
              <button className="tf-quick-btn" onClick={onAi}>
                <Wand2 size={13} />
                Let AI group them
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="tf-foot">
        <span className="tf-foot-note">
          {count === 0
            ? "Close when you're done, or keep bundling."
            : `${bugLabel} waiting · nothing is created until you confirm`}
        </span>
        <div className="tf-foot-right">
          <button className="tf-secondary" onClick={onClose}>
            {count === 0 ? "Done" : "Cancel"}
          </button>
        </div>
      </footer>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Manual workspace — two pane
// ───────────────────────────────────────────────────────────────────────────

interface ManualWorkspaceProps {
  onBack?: () => void;
  hideClose?: boolean;
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

  return (
    <>
      <div className="hb-btm-hero hb-btm-hero-compact">
        <div className="hb-btm-hero-bg" />
        <div className="hb-btm-hero-row">
          {p.onBack && (
            <button className="hb-btm-back" onClick={p.onBack} aria-label="Back to method picker" title="Back to method picker">
              <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
            </button>
          )}
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
          {!p.hideClose && (
            <button className="hb-btm-close" onClick={p.onClose} aria-label="Close">
              <X size={16} />
            </button>
          )}
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
                <Filter size={12} className="hb-btm-groupby-icon" />
                <SearchableDropdown
                  value={p.groupBy}
                  onChange={(v) => p.onGroupBy((v || "none") as GroupKey)}
                  options={[
                    { value: "none", label: "No grouping" },
                    { value: "severity", label: "Group by severity" },
                    { value: "type", label: "Group by type" },
                    { value: "module", label: "Group by module" },
                  ]}
                  placeholder="No grouping"
                  itemNoun="options"
                  hideAvatar
                  allowClear={false}
                  width={200}
                  searchPlaceholder="Search grouping…"
                  className="hb-btm-groupby-sd"
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
                    <SearchableDropdown
                      placeholder="Pick a project"
                      value={p.projectId}
                      onChange={(v) => p.onProjectId(v)}
                      options={p.projects.map((pr) => ({
                        value: pr.value,
                        label: pr.code ? `${pr.code} · ${pr.label}` : pr.label,
                      }))}
                      itemNoun="projects"
                      hideAvatar
                      className="sc-filters__field"
                    />
                  </Field>
                  <Field label="Assignee" optional>
                    <SearchableDropdown
                      placeholder="Unassigned"
                      value={p.assigneeId}
                      onChange={(v) => p.onAssigneeId(v)}
                      options={p.members}
                      itemNoun="members"
                      showSelectedAvatar
                      className="sc-filters__field"
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

/**
 * Converts plain-text content (which may contain newlines) into an HTML
 * paragraph block suitable for the Tiptap / dangerouslySetInnerHTML viewer.
 */
function plainTextToHtml(text: string): string {
  if (!text || !text.trim()) return "";
  
  // If it already contains HTML tags, return as is to avoid double-escaping.
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }

  // Escape basic HTML special chars to avoid XSS / rendering glitches.
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Preserve paragraph breaks (double newlines) and single line breaks.
  const paragraphs = escaped.split(/\n{2,}/);
  return paragraphs
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function buildSingleBugDescription(b: BugListItem): string {
  // Single-bug split ticket: render the bug's plain-text description as HTML.
  return plainTextToHtml(b.description || "");
}

function buildDescription(bugs: BugListItem[]): string {
  // Multi-bug single ticket: each bug gets its own labelled section with an
  // <hr> separator so the reader can identify which content came from which bug.
  const sections = bugs
    .filter((b) => (b.description || "").trim().length > 0)
    .map((b, index) => {
      const label = b.bugNumber
        ? b.bugNumber
        : `Bug ${index + 1}`;
      const titleLine = b.title ? ` — ${b.title}` : "";
      const headerHtml = bugs.length > 1
        ? `<p><strong>${label}${titleLine}</strong></p>`
        : "";
      return `${headerHtml}${plainTextToHtml(b.description || "")}`;
    });

  if (sections.length === 0) return "";
  // Join sections with a visible horizontal rule.
  return sections.join("<hr>");
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

function MapWorkspace({
  onBack,
  hideClose,
  bugs,
  ticketId,
  onTicketId,
  tickets,
  onSearchTickets,
  searchingTickets,
  searchQuery,
  onSubmit,
  onClose,
  theme,
  loading,
}: {
  onBack?: () => void;
  hideClose?: boolean;
  bugs: BugListItem[];
  ticketId: string | undefined;
  onTicketId: (id: string | undefined) => void;
  tickets: Ticket[];
  onSearchTickets: (q: string) => void;
  searchingTickets: boolean;
  searchQuery: string;
  onSubmit: () => void;
  onClose: () => void;
  theme: string;
  loading: boolean;
}) {
  return (
    <>
      <div className="hb-btm-hero hb-btm-hero-compact">
        <div className="hb-btm-hero-bg" />
        <div className="hb-btm-hero-row">
          {onBack && (
            <button className="hb-btm-back" onClick={onBack} aria-label="Back to method picker" title="Back to method picker">
              <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
            </button>
          )}
          <div className="hb-btm-hero-orb" style={{
            background: 'linear-gradient(135deg, var(--btm-success) 0%, #10b981 100%)',
            boxShadow: '0 6px 18px color-mix(in oklab, var(--btm-success) 35%, transparent)'
          }}>
            <LinkIcon size={20} />
          </div>
          <div className="hb-btm-hero-text">
            <div className="hb-btm-eyebrow" style={{
              background: 'color-mix(in oklab, var(--btm-success) 18%, transparent)',
              color: 'var(--btm-success)',
              border: '1px solid color-mix(in oklab, var(--btm-success) 35%, transparent)'
            }}>
              <LinkIcon size={11} />
              Mapping mode
            </div>
            <div className="hb-btm-title">
              Map {bugs.length} bug{bugs.length === 1 ? "" : "s"} to an existing ticket
            </div>
            <div className="hb-btm-sub">
              Search and select a ticket from your workspace to link these bugs.
            </div>
          </div>
          {!hideClose && (
            <button className="hb-btm-close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="hb-btm-grid hb-btm-mapgrid">
        {/* Left pane: Bug List summary */}
        <div className="hb-btm-pane hb-btm-pane-pool">
          <div className="hb-btm-poolhead">
            <div className="hb-btm-drafthead-title">Bugs to link</div>
          </div>
          <div className="hb-btm-pool" style={{ padding: '16px' }}>
            <div className="hb-btm-staged-chips" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bugs.map((b) => (
                <div key={b.id} className="hb-btm-chip" style={{ display: 'flex', width: '100%', padding: '8px 12px', borderRadius: '8px' }}>
                  <span className="hb-btm-chip-num" style={{ minWidth: '70px' }}>
                    {b.bugNumber || b.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="hb-btm-chip-title" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.title || b.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right pane: Ticket Search & Selection */}
        <div className="hb-btm-pane hb-btm-pane-draft">
          <div className="hb-btm-drafthead">
            <div className="hb-btm-search" style={{ width: '100%', background: 'var(--btm-bg-soft)', border: '1px solid var(--btm-border)', borderRadius: '10px', padding: '6px 12px' }}>
              <Search size={14} style={{ color: 'var(--btm-text-soft)' }} />
              <input
                className="hb-btm-search-input"
                placeholder="Search tickets by number or title…"
                value={searchQuery}
                onChange={(e) => onSearchTickets(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--btm-text)', width: '100%', outline: 'none', marginLeft: '8px' }}
              />
              {searchingTickets && <Loader2 size={14} className="hb-btm-spin" style={{ color: 'var(--btm-text-soft)', marginLeft: '8px' }} />}
            </div>
          </div>

          <div className="hb-btm-ticket-list" style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tickets.length === 0 ? (
              <div className="hb-btm-empty" style={{ padding: '40px 0' }}>
                <LinkIcon size={24} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <div style={{ color: 'var(--btm-text-muted)' }}>No tickets found. Type above to search.</div>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = ticketId === t.id;
                const projectCode = typeof t.project === "object" ? t.project?.code : t.project;
                return (
                  <button
                    key={t.id}
                    className={`hb-btm-ticket-item ${isSelected ? "active" : ""}`}
                    onClick={() => onTicketId(isSelected ? undefined : t.id)}
                    type="button"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isSelected ? 'var(--btm-bg-hover)' : 'var(--btm-bg-row)',
                      border: isSelected ? '1px solid var(--btm-accent)' : '1px solid var(--btm-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isSelected ? 'var(--btm-accent)' : 'var(--btm-text-soft)',
                          background: 'rgba(91, 155, 255, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {t.ticketNumber}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--btm-text-muted)',
                        }}>
                          {projectCode}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--btm-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {t.title}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--btm-border)',
                        color: 'var(--btm-text-soft)'
                      }}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="hb-btm-draftfoot">
            <button className="hb-btm-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              className="hb-btm-primary"
              disabled={loading || !ticketId}
              onClick={onSubmit}
              style={{
                background: ticketId ? 'linear-gradient(135deg, var(--btm-success) 0%, #10b981 100%)' : 'var(--btm-bg-soft)',
                color: ticketId ? '#ffffff' : 'var(--btm-text-muted)',
                borderColor: ticketId ? '#10b981' : 'var(--btm-border)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="hb-btm-spin" />
                  Linking…
                </>
              ) : (
                <>
                  <LinkIcon size={14} />
                  Link to Ticket
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
