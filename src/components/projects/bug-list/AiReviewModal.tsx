"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Input, Select, Skeleton, Tooltip, App, ConfigProvider, theme as antdTheme } from "antd";
import {
  Sparkles,
  Wand2,
  Layers,
  CheckCircle2,
  X,
  Bug as BugIcon,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  AlertCircle,
} from "lucide-react";
import {
  useAiReviewBugs,
  useAiSuggestGroups,
  useBulkConvertBugsToTickets,
} from "@/hooks/useBugList";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useMembersSelect } from "@/hooks/useMembersSelect";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useTicketDrawer } from "@/context/TicketDrawerContext";
import type {
  AiGroupSuggestion,
  AiReviewResult,
  BugListItem,
  ConvertedTicket,
} from "@/services/bugListService";
import { LinearService } from "@/services/linearService";

type Step = "review" | "group" | "done";

interface Props {
  /** Step back to the method picker without discarding the selection. */
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  /** Render as a wizard step body — no Modal of its own. */
  embedded?: boolean;
  bugs: BugListItem[];
  integration?: "zukvo" | "linear" | "jira";
}

interface EditableGroup {
  groupKey: string;
  title: string;
  module?: string;
  reason: string;
  bugIds: string[];
  description: string;
  acceptanceCriteria: string;
  projectId?: string;
  assigneeId?: string;
  teamId?: string;
  labelIds?: string[];
}

export default function AiReviewModal({ open, onClose, onBack, embedded, bugs, integration = "zukvo" }: Props) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const hasPrime = !user?.subscriptionFeatures ? true : user.subscriptionFeatures.includes('work_qa_space_bug_list_prime');
  
  const { message } = App.useApp();
  const [step, setStep] = useState<Step>("review");
  const [reviewResults, setReviewResults] = useState<AiReviewResult[]>([]);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [groups, setGroups] = useState<EditableGroup[]>([]);
  const [createdTickets, setCreatedTickets] = useState<ConvertedTicket[]>([]);

  // Linear Metadata
  const [linearTeams, setLinearTeams] = useState<{ id: string; name: string, projects: { nodes: { id: string; name: string }[] } }[]>([]);
  const [linearUsers, setLinearUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [linearLabels, setLinearLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [fetchingLinear, setFetchingLinear] = useState(false);

  const review = useAiReviewBugs();
  const suggest = useAiSuggestGroups();
  const convert = useBulkConvertBugsToTickets();

  const { data: projects } = useUserProjects();
  const { users: members } = useMembersSelect();

  const bugsById = useMemo(() => {
    const m = new Map<string, BugListItem>();
    bugs.forEach((b) => m.set(b.id, b));
    return m;
  }, [bugs]);

  const reviewByBugId = useMemo(() => {
    const m = new Map<string, AiReviewResult>();
    reviewResults.forEach((r) => m.set(r.bugId, r));
    return m;
  }, [reviewResults]);

  useEffect(() => {
    if (!open) {
      setStep("review");
      setReviewStarted(false);
      setReviewResults([]);
      setGroups([]);
      setCreatedTickets([]);
    } else if (integration === "linear") {
      fetchLinearData();
    }
  }, [open, integration]);

  const fetchLinearData = async () => {
    setFetchingLinear(true);
    try {
      const [teamsData, usersData, labelsData] = await Promise.all([
        LinearService.getTeams(),
        LinearService.getUsers(),
        LinearService.getLabels(),
      ]);
      setLinearTeams(teamsData || []);
      setLinearUsers(usersData || []);
      setLinearLabels(labelsData || []);
    } catch (error: any) {
      console.error("Failed to load Linear data", error);
    } finally {
      setFetchingLinear(false);
    }
  };

  const startReview = async () => {
    if (bugs.length === 0) return;
    setReviewStarted(true);
    try {
      const data = await review.mutateAsync(bugs.map((b) => b.id));
      setReviewResults(data);
    } catch {
      // hook surfaces the error toast
    }
  };

  const goToGrouping = async () => {
    try {
      const result = await suggest.mutateAsync(bugs.map((b) => b.id));
      const seeded: EditableGroup[] = result.map((g) =>
        seedGroup(g, bugsById, reviewByBugId),
      );
      setGroups(seeded);
      setStep("group");
    } catch {
      // hook surfaces the error toast
    }
  };

  const handleConvert = async () => {
    if (groups.length === 0) {
      message.warning("Nothing to convert");
      return;
    }
    
    // Add validation for Linear
    if (integration === "linear") {
      const missingTeam = groups.find(g => !g.teamId);
      if (missingTeam) {
        message.error(`Please select a Team for group: ${missingTeam.title}`);
        return;
      }
    }
    
    try {
      if (integration === "linear") {
        const linearCreated: ConvertedTicket[] = [];
        for (const g of groups) {
          const groupBugs = g.bugIds
            .map((id) => bugsById.get(id))
            .filter((b): b is BugListItem => !!b);
          
          let description = g.description;
          if (g.acceptanceCriteria) {
            description += `\n\n## Acceptance Criteria\n${g.acceptanceCriteria}`;
          }
          
          description += `\n\n### Linked Bugs\n`;
          groupBugs.forEach(b => {
            description += `- ${b.bugNumber || b.id.slice(-6)}: ${b.title || b.description}\n`;
          });
          
          const issue = await LinearService.createIssue({
            title: g.title,
            description,
            teamId: g.teamId!,
            projectId: g.projectId,
            assigneeId: g.assigneeId,
            labelIds: g.labelIds,
            bugIds: g.bugIds,
          });
          
          linearCreated.push({
            ticketId: issue.id,
            ticketNumber: issue.identifier,
            status: 'todo',
            timestamp: new Date().toISOString(),
            bugIds: g.bugIds,
            url: issue.url, // Ensure we can pass this to DoneStep
          } as any);
        }
        setCreatedTickets(linearCreated);
      } else {
        const created = await convert.mutateAsync(
          groups.map((g) => {
            const groupBugs = g.bugIds
              .map((id) => bugsById.get(id))
              .filter((b): b is BugListItem => !!b);
            const allAttachments = groupBugs.flatMap((b) => b.attachments || []);
            const allExternalLinks = groupBugs.flatMap((b) => b.externalLinks || []);

            return {
              title: g.title,
              description: g.description,
              acceptanceCriteria: g.acceptanceCriteria || undefined,
              bugIds: g.bugIds,
              projectId: g.projectId,
              assigneeId: g.assigneeId,
              attachments: allAttachments,
              externalLinks: allExternalLinks,
            };
          }),
        );
        setCreatedTickets(created);
      }
      setStep("done");
    } catch {
      // hook surfaces the error toast, or catch LinearService errors
    }
  };

  const updateGroup = (idx: number, patch: Partial<EditableGroup>) =>
    setGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));

  const removeGroup = (idx: number) =>
    setGroups((prev) => prev.filter((_, i) => i !== idx));

  const reviewing = review.isPending;
  const grouping = suggest.isPending;
  const converting = convert.isPending;

  if (!hasPrime) return null;

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
        <div className={`hb-aim ${embedded ? "hb-aim-flat" : ""}`}>
        <ModalHeader
          step={step}
          bugCount={bugs.length}
          ticketCount={createdTickets.length}
          onClose={embedded ? undefined : onClose}
          onBack={embedded ? undefined : onBack}
        />

        <Stepper step={step} />

        <div className="hb-aim-body">
          {step === "review" && (
            <ReviewStep
              bugs={bugs}
              loading={reviewing}
              started={reviewStarted}
              results={reviewResults}
              onStart={startReview}
            />
          )}
          {step === "group" && (
            <GroupStep
              groups={groups}
              bugsById={bugsById}
              reviewByBugId={reviewByBugId}
              projects={projects}
              members={members}
              onUpdate={updateGroup}
              onRemove={removeGroup}
              integration={integration}
              linearTeams={linearTeams}
              linearUsers={linearUsers}
              linearLabels={linearLabels}
            />
          )}
          {step === "done" && (
            <DoneStep tickets={createdTickets} bugs={bugs} onClose={onClose} />
          )}
        </div>

        <ModalFooter
          step={step}
          bugCount={bugs.length}
          groupCount={groups.length}
          reviewing={reviewing}
          grouping={grouping}
          converting={converting}
          reviewReady={reviewResults.length > 0}
          onBack={() => setStep("review")}
          onContinueToGroup={goToGrouping}
          onConvert={handleConvert}
          onClose={onClose}
        />
      </div>
      </ConfigProvider>
  );

  if (embedded) return body;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={960}
      destroyOnHidden
      closable={false}
      className={`hb-aimodal ${theme === "dark" ? "hb-aimodal-dark" : "hb-aimodal-light"}`}
      maskClosable={false}
    >
      {body}
    </Modal>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Header + Stepper
// ───────────────────────────────────────────────────────────────────────────

function ModalHeader({
  step,
  bugCount,
  ticketCount,
  onClose,
  onBack,
}: {
  step: Step;
  bugCount: number;
  ticketCount: number;
  onClose?: () => void;
  onBack?: () => void;
}) {
  const titleByStep: Record<Step, { title: string; sub: string }> = {
    review: {
      title: "AI Review",
      sub: `Polish ${bugCount} captured bug${bugCount === 1 ? "" : "s"} into developer-ready data.`,
    },
    group: {
      title: "Smart Grouping",
      sub: "Bugs grouped by module and context. Edit, reassign, then ship as tickets.",
    },
    done: {
      title: "All set",
      sub: `${ticketCount} ticket${ticketCount === 1 ? "" : "s"} created and linked back to bugs.`,
    },
  };
  const meta = titleByStep[step];
  return (
    <div className="hb-aim-header">
      <div className="hb-aim-titleblock">
        <div className="hb-aim-title">{meta.title}</div>
        <div className="hb-aim-sub">{meta.sub}</div>
      </div>
      {(onBack || onClose) && (
      <div className="hb-aim-headactions">
        {onBack && step !== "done" && (
          <button
            className="hb-aim-back"
            aria-label="Back to method picker"
            title="Back to method picker"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
          </button>
        )}
        {onClose && (
          <button className="hb-aim-close" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        )}
      </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: "review", label: "Review", icon: <Wand2 size={13} /> },
    { id: "group", label: "Group & refine", icon: <Layers size={13} /> },
    { id: "done", label: "Done", icon: <CheckCircle2 size={13} /> },
  ];
  const order = steps.findIndex((s) => s.id === step);
  return (
    <div className="hb-aim-stepper">
      {steps.map((s, i) => {
        const state = i < order ? "done" : i === order ? "active" : "todo";
        return (
          <React.Fragment key={s.id}>
            <div className={`hb-aim-step hb-aim-step-${state}`}>
              <div className="hb-aim-step-icon">{s.icon}</div>
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`hb-aim-step-rail ${
                  i < order ? "hb-aim-step-rail-done" : ""
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 1: Review
// ───────────────────────────────────────────────────────────────────────────

function ReviewStep({
  bugs,
  loading,
  started,
  results,
  onStart,
}: {
  bugs: BugListItem[];
  loading: boolean;
  started: boolean;
  results: AiReviewResult[];
  onStart: () => void;
}) {
  const resultByBugId = useMemo(() => {
    const m = new Map<string, AiReviewResult>();
    results.forEach((r) => m.set(r.bugId, r));
    return m;
  }, [results]);

  if (bugs.length === 0) {
    return (
      <div className="hb-aim-empty">
        <BugIcon size={28} />
        <div>Select bugs to review.</div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="hb-aim-hero">
        <div className="hb-aim-hero-icon">
          <Wand2 size={22} />
        </div>
        <div className="hb-aim-hero-title">
          Run AI review on {bugs.length} bug{bugs.length === 1 ? "" : "s"}
        </div>
        <div className="hb-aim-hero-sub">
          Each bug will be cleaned, structured into steps + expected/actual
          behaviour, and gaps will be flagged. You can review each before grouping.
        </div>
        <ul className="hb-aim-checklist">
          <li><CheckCircle2 size={13} /> Polished title and description</li>
          <li><CheckCircle2 size={13} /> Steps to reproduce</li>
          <li><CheckCircle2 size={13} /> Expected vs actual behaviour</li>
          <li><CheckCircle2 size={13} /> Missing-detail callouts</li>
        </ul>
        <button className="hb-aim-primary" onClick={onStart}>
          <Sparkles size={14} />
          Start review
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="hb-aim-cards">
        {bugs.slice(0, 3).map((b) => (
          <div className="hb-aim-card" key={b.id}>
            <Skeleton active title paragraph={{ rows: 4 }} />
          </div>
        ))}
        <div className="hb-aim-running">
          <Sparkles size={14} className="hb-aim-spin" />
          Reviewing {bugs.length} bug{bugs.length === 1 ? "" : "s"}…
        </div>
      </div>
    );
  }

  return (
    <div className="hb-aim-cards">
      {bugs.map((bug) => {
        const r = resultByBugId.get(bug.id);
        return (
          <div className="hb-aim-card" key={bug.id}>
            <div className="hb-aim-card-head">
              <span className="hb-aim-bugnum">
                {bug.bugNumber || bug.id.slice(-6).toUpperCase()}
              </span>
              <span className="hb-aim-card-title">
                {r?.suggestedTitle || bug.title || bug.description}
              </span>
              {bug.severity && (
                <span className={`hb-aim-pill hb-aim-pill-${bug.severity}`}>
                  {bug.severity}
                </span>
              )}
            </div>
            {r ? (
              <div className="hb-aim-card-grid">
                <Section label="Description">{r.cleanedDescription}</Section>
                {r.stepsToReproduce?.length > 0 && (
                  <Section label="Steps to reproduce">
                    <ol className="hb-aim-steps">
                      {r.stepsToReproduce.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </Section>
                )}
                <div className="hb-aim-twocol">
                  <Section label="Expected">{r.expectedBehavior || "—"}</Section>
                  <Section label="Actual">{r.actualBehavior || "—"}</Section>
                </div>
                {r.missingDetails?.length > 0 && (
                  <div className="hb-aim-missing">
                    <AlertCircle size={13} />
                    <div>
                      <div className="hb-aim-missing-title">
                        Could be sharper
                      </div>
                      <ul>
                        {r.missingDetails.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hb-aim-skip">
                <span>Original</span>
                <p>{bug.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 2: Group & refine
// ───────────────────────────────────────────────────────────────────────────

function GroupStep({
  groups,
  bugsById,
  reviewByBugId,
  projects,
  members,
  onUpdate,
  onRemove,
  integration,
  linearTeams,
  linearUsers,
  linearLabels,
}: {
  groups: EditableGroup[];
  bugsById: Map<string, BugListItem>;
  reviewByBugId: Map<string, AiReviewResult>;
  projects: { value: string; label: string; code?: string }[] | undefined;
  members: { value: string; label: string }[];
  onUpdate: (idx: number, p: Partial<EditableGroup>) => void;
  onRemove: (idx: number) => void;
  integration?: "zukvo" | "linear" | "jira";
  linearTeams?: { id: string; name: string, projects: { nodes: { id: string; name: string }[] } }[];
  linearUsers?: { id: string; name: string; email: string }[];
  linearLabels?: { id: string; name: string; color: string }[];
}) {
  if (groups.length === 0) {
    return (
      <div className="hb-aim-empty">
        <Layers size={28} />
        <div>No groups suggested.</div>
      </div>
    );
  }
  return (
    <div className="hb-aim-groups">
      {groups.map((g, idx) => (
        <GroupCard
          key={g.groupKey}
          index={idx}
          group={g}
          bugs={g.bugIds
            .map((id) => bugsById.get(id))
            .filter((b): b is BugListItem => !!b)}
          reviewByBugId={reviewByBugId}
          projects={projects || []}
          members={members}
          onUpdate={(patch) => onUpdate(idx, patch)}
          onRemove={() => onRemove(idx)}
          integration={integration}
          linearTeams={linearTeams}
          linearUsers={linearUsers}
          linearLabels={linearLabels}
        />
      ))}
    </div>
  );
}

function GroupCard({
  index,
  group,
  bugs,
  reviewByBugId,
  projects,
  members,
  onUpdate,
  onRemove,
  integration,
  linearTeams,
  linearUsers,
  linearLabels,
}: {
  index: number;
  group: EditableGroup;
  bugs: BugListItem[];
  reviewByBugId: Map<string, AiReviewResult>;
  projects: { value: string; label: string; code?: string }[];
  members: { value: string; label: string }[];
  onUpdate: (patch: Partial<EditableGroup>) => void;
  onRemove: () => void;
  integration?: "zukvo" | "linear" | "jira";
  linearTeams?: { id: string; name: string, projects: { nodes: { id: string; name: string }[] } }[];
  linearUsers?: { id: string; name: string; email: string }[];
  linearLabels?: { id: string; name: string; color: string }[];
}) {
  const [expanded, setExpanded] = useState(index === 0);
  return (
    <div className="hb-aim-group">
      <div className="hb-aim-group-head" onClick={() => setExpanded((e) => !e)}>
        <div className="hb-aim-group-bullet">{index + 1}</div>
        <div className="hb-aim-group-meta">
          <div className="hb-aim-group-title-row">
            <span className="hb-aim-group-title">{group.title}</span>
            {group.module && (
              <span className="hb-aim-tag">{group.module}</span>
            )}
            <span className="hb-aim-bugcount">
              {bugs.length} bug{bugs.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="hb-aim-group-reason">{group.reason}</div>
        </div>
        <button
          className="hb-aim-icon-btn hb-aim-danger"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove group"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="hb-aim-group-body">
          <Field label="Title">
            <Input
              value={group.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 8 }}
              value={group.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
            />
          </Field>
          <Field label="Acceptance criteria">
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 6 }}
              placeholder="Optional"
              value={group.acceptanceCriteria}
              onChange={(e) => onUpdate({ acceptanceCriteria: e.target.value })}
            />
          </Field>
          {integration === "linear" ? (
            <>
              <div className="hb-aim-twocol">
                <Field label="Team (Linear)">
                  <Select
                    allowClear
                    showSearch
                    placeholder="Select team"
                    value={group.teamId}
                    onChange={(v) => onUpdate({ teamId: v, projectId: undefined })}
                    options={linearTeams?.map((t) => ({ value: t.id, label: t.name })) || []}
                    filterOption={(input, option) =>
                      (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ width: "100%" }}
                  />
                </Field>
                <Field label="Project (Linear)">
                  <Select
                    allowClear
                    showSearch
                    placeholder="Select project"
                    value={group.projectId}
                    onChange={(v) => onUpdate({ projectId: v })}
                    options={
                      linearTeams
                        ?.find((t) => t.id === group.teamId)
                        ?.projects.nodes.map((p) => ({ value: p.id, label: p.name })) || []
                    }
                    filterOption={(input, option) =>
                      (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ width: "100%" }}
                    disabled={!group.teamId}
                  />
                </Field>
              </div>
              <div className="hb-aim-twocol" style={{ marginTop: 12 }}>
                <Field label="Assignee (Linear)">
                  <Select
                    allowClear
                    showSearch
                    placeholder="Unassigned"
                    value={group.assigneeId}
                    onChange={(v) => onUpdate({ assigneeId: v })}
                    options={linearUsers?.map((u) => ({ value: u.id, label: u.name })) || []}
                    filterOption={(input, option) =>
                      (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ width: "100%" }}
                  />
                </Field>
                <Field label="Labels (Linear)">
                  <Select
                    allowClear
                    mode="multiple"
                    showSearch
                    placeholder="Select labels"
                    value={group.labelIds}
                    onChange={(v) => onUpdate({ labelIds: v })}
                    options={linearLabels?.map((l) => ({ value: l.id, label: l.name })) || []}
                    filterOption={(input, option) =>
                      (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ width: "100%" }}
                  />
                </Field>
              </div>
            </>
          ) : (
            <div className="hb-aim-twocol">
              <Field label="Project">
                <Select
                  allowClear
                  showSearch
                  placeholder="Inherit from folder"
                  value={group.projectId}
                  onChange={(v) => onUpdate({ projectId: v })}
                  options={projects.map((p) => ({
                    value: p.value,
                    label: p.code ? `${p.code} · ${p.label}` : p.label,
                  }))}
                  filterOption={(input, option) =>
                    (option?.label as string)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  style={{ width: "100%" }}
                />
              </Field>
              <Field label="Assignee">
                <Select
                  allowClear
                  showSearch
                  placeholder="Unassigned"
                  value={group.assigneeId}
                  onChange={(v) => onUpdate({ assigneeId: v })}
                  options={members}
                  filterOption={(input, option) =>
                    (option?.label as string)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  style={{ width: "100%" }}
                />
              </Field>
            </div>
          )}

          <div className="hb-aim-buglist">
            <div className="hb-aim-buglist-title">Bugs in this ticket</div>
            {bugs.map((b) => {
              const r = reviewByBugId.get(b.id);
              return (
                <div key={b.id} className="hb-aim-bugrow">
                  <span className="hb-aim-bugnum">
                    {b.bugNumber || b.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="hb-aim-bugrow-title">
                    {r?.suggestedTitle || b.title || b.description}
                  </span>
                  {b.severity && (
                    <span className={`hb-aim-pill hb-aim-pill-${b.severity}`}>
                      {b.severity}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Step 3: Done
// ───────────────────────────────────────────────────────────────────────────

function DoneStep({
  tickets,
  bugs,
  onClose,
}: {
  tickets: ConvertedTicket[];
  bugs: BugListItem[];
  onClose: () => void;
}) {
  const { open: openTicketDrawer } = useTicketDrawer();
  const totalBugsLinked = tickets.reduce((acc, t) => acc + t.bugIds.length, 0);
  return (
    <div className="hb-aim-done">
      <div className="hb-aim-done-icon">
        <CheckCircle2 size={26} />
      </div>
      <div className="hb-aim-done-title">
        {tickets.length} ticket{tickets.length === 1 ? "" : "s"} created
      </div>
      <div className="hb-aim-done-sub">
        {totalBugsLinked} bug{totalBugsLinked === 1 ? "" : "s"} from your selection
        {bugs.length > totalBugsLinked
          ? ` (${bugs.length - totalBugsLinked} skipped)`
          : ""}
        {" "}
        are now linked.
      </div>

      <div className="hb-aim-tickets">
        {tickets.map((t) => (
          <button
            key={t.ticketId}
            type="button"
            className="hb-aim-ticket"
            onClick={() => {
              if (t.url) {
                window.open(t.url, '_blank');
              } else {
                openTicketDrawer(t.ticketId);
              }
            }}
          >
            <div>
              <div className="hb-aim-ticket-num">{t.ticketNumber}</div>
              <div className="hb-aim-ticket-meta">
                {t.bugIds.length} bug{t.bugIds.length === 1 ? "" : "s"} linked
              </div>
            </div>
            <ExternalLink size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Footer
// ───────────────────────────────────────────────────────────────────────────

function ModalFooter({
  step,
  bugCount,
  groupCount,
  reviewing,
  grouping,
  converting,
  reviewReady,
  onBack,
  onContinueToGroup,
  onConvert,
  onClose,
}: {
  step: Step;
  bugCount: number;
  groupCount: number;
  reviewing: boolean;
  grouping: boolean;
  converting: boolean;
  reviewReady: boolean;
  onBack: () => void;
  onContinueToGroup: () => void;
  onConvert: () => void;
  onClose: () => void;
}) {
  if (step === "review") {
    return (
      <div className="hb-aim-footer">
        <button className="hb-aim-secondary" onClick={onClose}>
          Cancel
        </button>
        <Tooltip
          title={
            !reviewReady
              ? "Run AI review first to continue"
              : ""
          }
        >
          <button
            className="hb-aim-primary"
            disabled={!reviewReady || reviewing || grouping}
            onClick={onContinueToGroup}
          >
            {grouping ? (
              <>
                <Sparkles size={14} className="hb-aim-spin" />
                Grouping…
              </>
            ) : (
              <>
                Continue to grouping
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </Tooltip>
      </div>
    );
  }

  if (step === "group") {
    return (
      <div className="hb-aim-footer">
        <button className="hb-aim-secondary" onClick={onBack}>
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="hb-aim-footer-meta">
          {groupCount} group{groupCount === 1 ? "" : "s"} ·{" "}
          {bugCount} bug{bugCount === 1 ? "" : "s"} selected
        </div>
        <button
          className="hb-aim-primary"
          disabled={converting || groupCount === 0}
          onClick={onConvert}
        >
          {converting ? (
            <>
              <Sparkles size={14} className="hb-aim-spin" />
              Creating…
            </>
          ) : (
            <>
              <Plus size={14} />
              Create {groupCount} ticket{groupCount === 1 ? "" : "s"}
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="hb-aim-footer">
      <span className="hb-aim-footer-meta">Done.</span>
      <button className="hb-aim-primary" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Small primitives + helpers
// ───────────────────────────────────────────────────────────────────────────

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hb-aim-section">
      <div className="hb-aim-section-label">{label}</div>
      <div className="hb-aim-section-body">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hb-aim-field">
      <label>{label}</label>
      {children}
    </div>
  );
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

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped.split(/\n{2,}/);
  return paragraphs
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function seedGroup(
  g: AiGroupSuggestion,
  bugsById: Map<string, BugListItem>,
  reviewByBugId: Map<string, AiReviewResult>,
): EditableGroup {
  const bugsWithContent = g.bugIds
    .map((id) => {
      const bug = bugsById.get(id);
      const review = reviewByBugId.get(id);
      if (!bug) return null;
      return { bug, text: review?.cleanedDescription || bug.description || "" };
    })
    .filter((entry): entry is { bug: BugListItem; text: string } => !!entry && entry.text.trim().length > 0);

  // Build structured HTML sections separated by <hr>, with bug label headers
  // when there are multiple bugs (so context isn't lost in a single wall of text).
  const sections = bugsWithContent.map(({ bug, text }) => {
    const label = bug.bugNumber || bug.id.slice(-6).toUpperCase();
    const titleLine = bug.title ? ` \u2014 ${bug.title}` : "";
    const headerHtml = bugsWithContent.length > 1
      ? `<p><strong>${label}${titleLine}</strong></p>`
      : "";
    return `${headerHtml}${plainTextToHtml(text)}`;
  });

  const assignees = g.bugIds
    .map((id) => bugsById.get(id)?.assigneeId)
    .filter((v): v is string => !!v);
  const sharedAssignee =
    assignees.length > 0 && assignees.every((a) => a === assignees[0])
      ? assignees[0]
      : undefined;

  return {
    ...g,
    description: sections.join("<hr>"),
    acceptanceCriteria: "",
    assigneeId: sharedAssignee,
  };
}
