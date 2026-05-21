"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectService } from "@/services/projectService";
import ReleasePlanService, { ReleasePlan } from "@/services/releasePlanService";

type ProjectOption = {
  value: string;
  label: string;
  code: string;
  description?: string;
};
type StatusFilter = "all" | "active" | "completed";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Active + Completed" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export default function ReportsHub() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sprints, setSprints] = useState<ReleasePlan[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    ProjectService.getUserProjectsForTickets()
      .then((rows) => {
        if (cancelled) return;
        setProjects(rows);
        if (rows.length > 0) setProjectId(rows[0].value);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message ?? "Failed to load projects");
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) {
      setSprints([]);
      return;
    }
    let cancelled = false;
    setSprintsLoading(true);
    setError(null);
    ReleasePlanService.getReleasePlans({
      projectId,
      type: "sprint_plan",
      limit: 100,
      sortBy: "startedAt",
      sortOrder: "desc",
    })
      .then((res: any) => {
        if (cancelled) return;
        const rows: ReleasePlan[] = Array.isArray(res) ? res : res?.data ?? [];
        setSprints(rows);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message ?? "Failed to load sprints");
      })
      .finally(() => {
        if (!cancelled) setSprintsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const filteredSprints = useMemo(() => {
    let arr = sprints.filter((s) => s.status === "active" || s.status === "completed");
    if (statusFilter !== "all") arr = arr.filter((s) => s.status === statusFilter);
    arr.sort((a, b) => {
      const aDate = new Date(a.startedAt ?? a.startDate ?? a.createdAt).getTime();
      const bDate = new Date(b.startedAt ?? b.startDate ?? b.createdAt).getTime();
      return bDate - aDate;
    });
    return arr;
  }, [sprints, statusFilter]);

  const aggregates = useMemo(() => computeAggregates(filteredSprints), [filteredSprints]);
  const [featured, ...rest] = filteredSprints;
  const selectedProject = projects.find((p) => p.value === projectId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0B0F1A]">
      <div className="mx-auto max-w-7xl px-6 pt-5 pb-12 space-y-6">
        <HeaderBar
          projects={projects}
          projectId={projectId}
          onProjectChange={setProjectId}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          projectsLoading={projectsLoading}
          selectedProjectLabel={selectedProject?.label}
          selectedProjectCode={selectedProject?.code}
          sprints={sprints}
          onPickSprint={(id) => router.push(`/tickets/reports/${id}`)}
        />

        {error ? (
          <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4">
            <div className="text-sm text-rose-700 dark:text-rose-300">{error}</div>
          </div>
        ) : null}

        {sprintsLoading ? (
          <LoadingState />
        ) : filteredSprints.length === 0 ? (
          <EmptyState
            hasProject={!!projectId}
            statusFilter={statusFilter}
            projectsCount={projects.length}
          />
        ) : (
          <>
            <KpiStrip aggregates={aggregates} />
            {featured ? (
              <FeaturedSprint sprint={featured} onOpen={() => router.push(`/tickets/reports/${featured.id}`)} />
            ) : null}
            {rest.length > 0 ? (
              <SprintList
                sprints={rest}
                onOpen={(id) => router.push(`/tickets/reports/${id}`)}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function HeaderBar({
  projects,
  projectId,
  onProjectChange,
  statusFilter,
  onStatusChange,
  projectsLoading,
  selectedProjectLabel,
  selectedProjectCode,
  sprints,
  onPickSprint,
}: {
  projects: ProjectOption[];
  projectId: string;
  onProjectChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  projectsLoading: boolean;
  selectedProjectLabel?: string;
  selectedProjectCode?: string;
  sprints: ReleasePlan[];
  onPickSprint: (id: string) => void;
}) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
      <div className="text-[11px] uppercase tracking-[0.16em] font-semibold text-indigo-600 dark:text-indigo-400">
        Sprint Reports
      </div>
      <div className="mt-2 flex items-end justify-between gap-6 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {selectedProjectLabel ?? "All projects"}
            </h1>
            {selectedProjectCode ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                {selectedProjectCode}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Browse sprint reports across the projects you have access to. Open any sprint for a
            full delivery, scope, and quality breakdown.
          </p>
        </div>
        <FilterCluster
          projects={projects}
          projectId={projectId}
          onProjectChange={onProjectChange}
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          projectsLoading={projectsLoading}
          sprints={sprints}
          onPickSprint={onPickSprint}
        />
      </div>
    </div>
  );
}

function FilterCluster({
  projects,
  projectId,
  onProjectChange,
  statusFilter,
  onStatusChange,
  projectsLoading,
  sprints,
  onPickSprint,
}: {
  projects: ProjectOption[];
  projectId: string;
  onProjectChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  projectsLoading: boolean;
  sprints: ReleasePlan[];
  onPickSprint: (id: string) => void;
}) {
  return (
    <div className="inline-flex items-stretch rounded-lg border border-zinc-200 dark:border-zinc-800 divide-x divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900/60">
      <ProjectFilterDropdown
        projects={projects}
        projectId={projectId}
        onProjectChange={onProjectChange}
        loading={projectsLoading}
      />
      <SprintFilterDropdown
        statusFilter={statusFilter}
        onStatusChange={onStatusChange}
        sprints={sprints}
        onPickSprint={onPickSprint}
      />
    </div>
  );
}

function SprintFilterDropdown({
  statusFilter,
  onStatusChange,
  sprints,
  onPickSprint,
}: {
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  sprints: ReleasePlan[];
  onPickSprint: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const visibleSprints = useMemo(() => {
    let arr = sprints.filter((s) => s.status === "active" || s.status === "completed");
    if (statusFilter !== "all") arr = arr.filter((s) => s.status === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(
        (s) =>
          (s.version || s.name || "").toLowerCase().includes(q) ||
          (s.goal || "").toLowerCase().includes(q)
      );
    }
    arr.sort((a, b) => {
      const aDate = new Date(a.startedAt ?? a.startDate ?? a.createdAt).getTime();
      const bDate = new Date(b.startedAt ?? b.startDate ?? b.createdAt).getTime();
      return bDate - aDate;
    });
    return arr;
  }, [sprints, statusFilter, query]);

  const activeSprints = visibleSprints.filter((s) => s.status === "active");
  const completedSprints = visibleSprints.filter((s) => s.status === "completed");

  const triggerLabel =
    statusFilter === "all"
      ? `All sprints · ${sprints.filter((s) => s.status === "active" || s.status === "completed").length}`
      : statusFilter === "active"
        ? `Active · ${sprints.filter((s) => s.status === "active").length}`
        : `Completed · ${sprints.filter((s) => s.status === "completed").length}`;

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex flex-col"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3.5 py-1.5 flex flex-col items-start min-w-[260px] hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-900"
      >
        <span className="text-[10px] uppercase tracking-[0.14em] font-medium text-zinc-500 dark:text-zinc-400">
          Sprint
        </span>
        <span className="-mt-px w-full flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
            {triggerLabel}
          </span>
          <span
            className={`text-zinc-400 dark:text-zinc-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            <ChevronDownIcon />
          </span>
        </span>
      </button>

      {open ? (
        <div className="absolute top-full right-0 mt-2 w-[360px] max-w-[90vw] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-50 overflow-hidden">
          <div className="px-3 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((o) => {
                const isActive = statusFilter === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => onStatusChange(o.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sprints…"
                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
              />
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                <SearchIcon />
              </span>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {visibleSprints.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {query.trim() ? "No sprints match your search." : "No sprints available."}
              </div>
            ) : (
              <>
                {activeSprints.length > 0 ? (
                  <SprintGroup
                    label="Active"
                    sprints={activeSprints}
                    onPick={(id) => {
                      setOpen(false);
                      onPickSprint(id);
                    }}
                  />
                ) : null}
                {completedSprints.length > 0 ? (
                  <SprintGroup
                    label="Completed"
                    sprints={completedSprints}
                    onPick={(id) => {
                      setOpen(false);
                      onPickSprint(id);
                    }}
                  />
                ) : null}
              </>
            )}
          </div>

          <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span className="tabular-nums">
              {visibleSprints.length} sprint{visibleSprints.length === 1 ? "" : "s"}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">
              Select a sprint to open its report
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SprintGroup({
  label,
  sprints,
  onPick,
}: {
  label: string;
  sprints: ReleasePlan[];
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <div className="px-3 pt-3 pb-1.5 text-[10px] uppercase tracking-[0.14em] font-semibold text-zinc-400 dark:text-zinc-500">
        {label}
        <span className="ml-1.5 text-zinc-300 dark:text-zinc-600 tabular-nums">
          {sprints.length}
        </span>
      </div>
      <ul>
        {sprints.map((s) => {
          const start = s.startedAt ?? s.startDate;
          const end = s.completedAt ?? s.endDate;
          const completionPct =
            s.totalTickets > 0
              ? Math.round((s.completedTickets / s.totalTickets) * 100)
              : 0;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onPick(s.id)}
                className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-800/60 transition-colors group"
              >
                <StatusDot status={s.status} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                    {s.version || s.name || "Untitled sprint"}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {fmtRange(start, end)}
                    <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">·</span>
                    {s.totalTickets} tickets
                    <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">·</span>
                    {completionPct}%
                  </div>
                </div>
                <StatusPill status={s.status} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProjectFilterDropdown({
  projects,
  projectId,
  onProjectChange,
  loading,
}: {
  projects: ProjectOption[];
  projectId: string;
  onProjectChange: (id: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const selected = projects.find((p) => p.value === projectId);
  const disabled = loading || projects.length === 0;

  const filtered = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.code || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }, [projects, query]);

  const triggerLabel = loading
    ? "Loading…"
    : projects.length === 0
      ? "No projects"
      : selected
        ? selected.label
        : "Select project";

  return (
    <div ref={wrapperRef} className="relative inline-flex flex-col">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="px-3.5 py-1.5 flex flex-col items-start min-w-[240px] hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 transition-colors focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-900"
      >
        <span className="text-[10px] uppercase tracking-[0.14em] font-medium text-zinc-500 dark:text-zinc-400">
          Project
        </span>
        <span className="-mt-px w-full flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
              {triggerLabel}
            </span>
            {selected?.code ? (
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                {selected.code}
              </span>
            ) : null}
          </span>
          <span
            className={`text-zinc-400 dark:text-zinc-500 transition-transform flex-shrink-0 ${
              open ? "rotate-180" : ""
            }`}
          >
            <ChevronDownIcon />
          </span>
        </span>
      </button>

      {open ? (
        <div className="absolute top-full left-0 mt-2 w-[340px] max-w-[90vw] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-50 overflow-hidden">
          <div className="px-3 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects…"
                autoFocus
                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
              />
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                <SearchIcon />
              </span>
            </div>
          </div>

          <div className="max-h-[340px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {query.trim() ? "No projects match your search." : "No projects available."}
              </div>
            ) : (
              <ul>
                {filtered.map((p) => {
                  const isSelected = p.value === projectId;
                  return (
                    <li key={p.value}>
                      <button
                        type="button"
                        onClick={() => {
                          onProjectChange(p.value);
                          setOpen(false);
                          setQuery("");
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors focus:outline-none group ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-500/10"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60 focus:bg-zinc-50 dark:focus:bg-zinc-800/60"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-[11px] font-semibold tabular-nums flex-shrink-0 ${
                            isSelected
                              ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {(p.code || p.label).slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-sm font-medium truncate ${
                                isSelected
                                  ? "text-indigo-700 dark:text-indigo-200"
                                  : "text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
                              } transition-colors`}
                            >
                              {p.label}
                            </span>
                            {p.code ? (
                              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                                {p.code}
                              </span>
                            ) : null}
                          </div>
                          {p.description ? (
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                              {p.description}
                            </div>
                          ) : null}
                        </div>
                        {isSelected ? (
                          <span className="text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                            <CheckIcon />
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span className="tabular-nums">
              {filtered.length} project{filtered.length === 1 ? "" : "s"}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">
              Switch project to view its sprints
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Aggregates = {
  total: number;
  active: number;
  completed: number;
  avgCompletion: number;
  totalPoints: number;
  totalDoneTickets: number;
};

function computeAggregates(sprints: ReleasePlan[]): Aggregates {
  const total = sprints.length;
  const active = sprints.filter((s) => s.status === "active").length;
  const completed = sprints.filter((s) => s.status === "completed").length;
  const completions = sprints.map((s) =>
    s.totalTickets > 0 ? (s.completedTickets / s.totalTickets) * 100 : 0
  );
  const avgCompletion =
    completions.length === 0
      ? 0
      : Math.round(completions.reduce((a, b) => a + b, 0) / completions.length);
  const totalDoneTickets = sprints.reduce((s, sp) => s + (sp.completedTickets ?? 0), 0);
  const totalPoints = sprints.reduce((s, sp) => s + (sp.totalTickets ?? 0), 0);
  return { total, active, completed, avgCompletion, totalPoints, totalDoneTickets };
}

function KpiStrip({ aggregates }: { aggregates: Aggregates }) {
  const items: { label: string; value: string; sub?: string; accent?: "indigo" | "emerald" }[] =
    [
      {
        label: "Sprints",
        value: aggregates.total.toString(),
        sub: `${aggregates.active} active · ${aggregates.completed} done`,
      },
      {
        label: "Active",
        value: aggregates.active.toString(),
        sub: "in progress",
        accent: "indigo",
      },
      {
        label: "Completed",
        value: aggregates.completed.toString(),
        sub: "closed",
        accent: "emerald",
      },
      {
        label: "Avg Completion",
        value: `${aggregates.avgCompletion}%`,
        sub: `${aggregates.totalDoneTickets} tickets shipped`,
      },
    ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
      {items.map((it, idx) => (
        <div
          key={it.label}
          className={[
            "px-5 py-2.5 border-zinc-200 dark:border-zinc-800",
            idx % 2 === 0 ? "border-r" : "lg:border-r",
            idx < 2 ? "border-b lg:border-b-0" : "",
            idx < 3 ? "lg:border-r" : "",
            idx === 3 ? "lg:border-r-0" : "",
          ].join(" ")}
        >
          <div className="text-[10px] uppercase tracking-[0.14em] font-medium text-zinc-500 dark:text-zinc-400">
            {it.label}
          </div>
          <div className="mt-1 flex items-baseline gap-2 min-w-0">
            <span
              className={`text-[22px] font-semibold leading-none tabular-nums flex-shrink-0 ${
                it.accent === "indigo"
                  ? "text-indigo-600 dark:text-indigo-400"
                  : it.accent === "emerald"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {it.value}
            </span>
            {it.sub ? (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {it.sub}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturedSprint({
  sprint,
  onOpen,
}: {
  sprint: ReleasePlan;
  onOpen: () => void;
}) {
  const completionPct =
    sprint.totalTickets > 0
      ? Math.round((sprint.completedTickets / sprint.totalTickets) * 100)
      : 0;
  const start = sprint.startedAt ?? sprint.startDate;
  const end = sprint.completedAt ?? sprint.endDate;
  const isActive = sprint.status === "active";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
    >
      <div className="relative">
        <div
          className={`absolute top-0 left-0 right-0 h-[3px] ${
            isActive
              ? "bg-gradient-to-r from-indigo-500 to-indigo-400"
              : "bg-emerald-500"
          }`}
        />
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                {isActive ? "Current Sprint" : "Most Recent"}
              </span>
              <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                {sprint.version || sprint.name || "Untitled sprint"}
              </h2>
              <StatusPill status={sprint.status} />
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <CompletionDial pct={completionPct} active={isActive} />
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                Open report
                <ArrowRightIcon />
              </div>
            </div>
          </div>

          {sprint.goal ? (
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-1 max-w-3xl">
              {sprint.goal}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
            <Metric label="Tickets" value={`${sprint.totalTickets}`} />
            <Metric
              label="Done"
              value={`${sprint.completedTickets}`}
              sub={`of ${sprint.totalTickets}`}
            />
            <Metric label="Completion" value={`${completionPct}%`} />
            <Metric label="Dates" value={fmtRange(start, end)} />
          </div>
        </div>
      </div>
    </button>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.14em] font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </span>
      {sub ? (
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
          {sub}
        </span>
      ) : null}
    </span>
  );
}

function CompletionDial({ pct, active }: { pct: number; active: boolean }) {
  const size = 48;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (circ * Math.min(100, Math.max(0, pct))) / 100;
  const color = active ? "#6366f1" : "#10b981";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-zinc-100 dark:text-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {pct}%
        </span>
      </div>
    </div>
  );
}

function SprintList({
  sprints,
  onOpen,
}: {
  sprints: ReleasePlan[];
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
          All Sprints
          <span className="ml-2 text-zinc-400 dark:text-zinc-500 font-normal tabular-nums">
            {sprints.length}
          </span>
        </h3>
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {sprints.map((s) => (
            <SprintRow key={s.id} sprint={s} onOpen={() => onOpen(s.id)} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function SprintRow({ sprint, onOpen }: { sprint: ReleasePlan; onOpen: () => void }) {
  const completionPct =
    sprint.totalTickets > 0
      ? Math.round((sprint.completedTickets / sprint.totalTickets) * 100)
      : 0;
  const start = sprint.startedAt ?? sprint.startDate;
  const end = sprint.completedAt ?? sprint.endDate;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-900 group"
      >
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <StatusDot status={sprint.status} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                {sprint.version || sprint.name || "Untitled sprint"}
              </span>
            </div>
            {sprint.goal ? (
              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {sprint.goal}
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-8 flex-shrink-0">
          <div className="text-right min-w-[110px]">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {fmtRange(start, end)}
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
              {sprint.totalTickets} tickets
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-[140px]">
            <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  sprint.status === "completed"
                    ? "bg-emerald-500"
                    : "bg-indigo-500"
                }`}
                style={{ width: `${Math.min(100, completionPct)}%` }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300 min-w-[34px] text-right">
              {completionPct}%
            </span>
          </div>
        </div>

        <span className="text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0">
          <ChevronRightIcon />
        </span>
      </button>
    </li>
  );
}

function StatusDot({ status }: { status: ReleasePlan["status"] }) {
  const color =
    status === "completed"
      ? "bg-emerald-500"
      : status === "active"
        ? "bg-indigo-500"
        : status === "cancelled"
          ? "bg-rose-500"
          : "bg-zinc-400";
  return (
    <span className="relative inline-flex items-center justify-center flex-shrink-0">
      {status === "active" ? (
        <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-indigo-400 opacity-60 animate-ping" />
      ) : null}
      <span className={`relative inline-block w-2 h-2 rounded-full ${color}`} />
    </span>
  );
}

function StatusPill({ status }: { status: ReleasePlan["status"] }) {
  const styles =
    status === "completed"
      ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-500/30"
      : status === "active"
        ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-200 dark:ring-indigo-500/30"
        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ring-zinc-200 dark:ring-zinc-700";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 capitalize tracking-normal ${styles}`}
    >
      {status}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`px-5 py-4 border-zinc-200 dark:border-zinc-800 ${i % 2 === 0 ? "border-r" : "lg:border-r"} ${i < 2 ? "border-b lg:border-b-0" : ""} ${i < 3 ? "lg:border-r" : ""} ${i === 3 ? "lg:border-r-0" : ""} animate-pulse`}
          >
            <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="mt-3 h-7 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="mt-2 h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
      <div className="h-[180px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 animate-pulse" />
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`px-5 py-4 ${i < 3 ? "border-b border-zinc-100 dark:border-zinc-800" : ""} animate-pulse flex items-center gap-4`}
          >
            <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex-1">
              <div className="h-3 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="mt-2 h-2.5 w-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
            <div className="h-2 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  hasProject,
  statusFilter,
  projectsCount,
}: {
  hasProject: boolean;
  statusFilter: StatusFilter;
  projectsCount: number;
}) {
  let title = "No sprints to show";
  let message = "Try changing the sprint filter or pick a different project.";
  if (!hasProject && projectsCount === 0) {
    title = "No projects available";
    message = "You don't have access to any projects yet. Ask an admin to add you to a project.";
  } else if (!hasProject) {
    title = "Pick a project";
    message = "Select a project from the dropdown above to see its sprint reports.";
  } else if (statusFilter !== "all") {
    title = `No ${statusFilter} sprints`;
    message = `This project has no ${statusFilter} sprints. Switch the sprint filter to see others.`;
  }

  return (
    <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/40 py-16 px-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 mb-4">
        <ChartIcon />
      </div>
      <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</div>
      <div className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
        {message}
      </div>
    </div>
  );
}

function fmtRange(start?: string | null, end?: string | null): string {
  const f = (d?: string | null) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };
  return `${f(start)} → ${f(end)}`;
}

function ChevronDownIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
