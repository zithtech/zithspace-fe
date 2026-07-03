"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import {
  Panel,
  SectionTitle,
  EmptyChart,
  SectionSkeleton,
  SectionError,
  InsightCard,
  useSnapshotSection,
} from "./_shared";

interface HotspotsData {
  epics: {
    epicId: string;
    epicTitle: string;
    epicNumber: string | null;
    ticketCount: number;
    uniqueAssignees: number;
    urgentCount: number;
    doneCount: number;
    totalComments: number;
    totalTransitions: number;
    totalReopens: number;
    totalPoints: number;
    hotScore: number;
  }[];
  tags: {
    tag: string;
    ticketCount: number;
    uniqueAssignees: number;
    urgentCount: number;
    totalComments: number;
    totalTransitions: number;
    hotScore: number;
  }[];
  modules?: {
    module: string;
    ticketCount: number;
    uniqueAssignees: number;
    urgentCount: number;
    doneCount: number;
    totalComments: number;
    totalTransitions: number;
    totalPoints: number;
    hotScore: number;
  }[];
  insights: string[];
}

export default function HotspotsSection({ sprintId }: { sprintId: string }) {
  const snapshot = useSnapshotSection<HotspotsData>("hotspots");
  const [data, setData] = useState<HotspotsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (snapshot !== undefined) {
      setData(snapshot);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<HotspotsData>(`/api/sprint-report/${sprintId}/hotspots`)
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err?.message ?? "Failed to load hotspots"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sprintId, snapshot]);

  if (loading) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Hot Features & Modules" />
        <SectionSkeleton height={280} />
      </section>
    );
  }
  if (error) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Hot Features & Modules" />
        <SectionError message={error} />
      </section>
    );
  }
  if (!data) return null;

  const modules = data.modules ?? [];
  const hasEpics = data.epics.length > 0;

  return (
    <section className="space-y-4">
      <SectionTitle title="Hot Features & Modules" hint="Where the sprint's energy went" />

      <InsightCard title="Highlights" insights={data.insights} />

      {hasEpics ? (
        <Panel title="Hot Epics" hint="Ranked by ticket count, contributors, churn">
          <EpicList rows={data.epics.slice(0, 10)} />
        </Panel>
      ) : modules.length > 0 ? (
        <Panel title="Hot Work Types" hint="Busiest categories by tickets, contributors, churn">
          <ModuleList rows={modules.slice(0, 10)} />
        </Panel>
      ) : (
        <Panel title="Hot Epics" hint="Ranked by ticket count, contributors, churn">
          <EmptyChart message="No epics or work-type data for this sprint" />
        </Panel>
      )}

      {data.tags.length > 0 ? (
        <Panel title="Hot Tags" hint="Top tags by activity volume">
          <TagGrid rows={data.tags.slice(0, 12)} />
        </Panel>
      ) : null}
    </section>
  );
}

function ModuleList({ rows }: { rows: NonNullable<HotspotsData["modules"]> }) {
  const maxScore = Math.max(...rows.map((r) => r.hotScore), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((m, idx) => {
        const widthPct = (m.hotScore / maxScore) * 100;
        const progressPct =
          m.ticketCount > 0 ? Math.round((m.doneCount / m.ticketCount) * 100) : 0;
        return (
          <div
            key={m.module}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <RankPill rank={idx + 1} />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 capitalize whitespace-normal break-words">
                    {m.module}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <Stat label="Tickets" value={m.ticketCount} />
                  <Stat label="Contributors" value={m.uniqueAssignees} />
                  <Stat label="Points" value={m.totalPoints} />
                  <Stat label="Done" value={`${m.doneCount} · ${progressPct}%`} />
                  {m.urgentCount > 0 ? <Stat label="Urgent" value={m.urgentCount} tone="rose" /> : null}
                  {m.totalComments > 0 ? <Stat label="Comments" value={m.totalComments} /> : null}
                  {m.totalTransitions > 0 ? (
                    <Stat label="Transitions" value={m.totalTransitions} />
                  ) : null}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
                  Hot Score
                </div>
                <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {m.hotScore}
                </div>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm bg-indigo-500 dark:bg-indigo-400"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EpicList({ rows }: { rows: HotspotsData["epics"] }) {
  const maxScore = Math.max(...rows.map((r) => r.hotScore), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((e, idx) => {
        const widthPct = (e.hotScore / maxScore) * 100;
        const progressPct =
          e.ticketCount > 0 ? Math.round((e.doneCount / e.ticketCount) * 100) : 0;
        return (
          <div
            key={e.epicId}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <RankPill rank={idx + 1} />
                  {e.epicNumber ? (
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      {e.epicNumber}
                    </span>
                  ) : null}
                </div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50 whitespace-normal break-words">
                  {e.epicTitle}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <Stat label="Tickets" value={e.ticketCount} />
                  <Stat label="Contributors" value={e.uniqueAssignees} />
                  <Stat label="Points" value={e.totalPoints} />
                  <Stat label="Done" value={`${e.doneCount} · ${progressPct}%`} />
                  {e.urgentCount > 0 ? (
                    <Stat label="Urgent" value={e.urgentCount} tone="rose" />
                  ) : null}
                  {e.totalReopens > 0 ? (
                    <Stat label="Reopens" value={e.totalReopens} tone="amber" />
                  ) : null}
                  {e.totalComments > 0 ? (
                    <Stat label="Comments" value={e.totalComments} />
                  ) : null}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
                  Hot Score
                </div>
                <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {e.hotScore}
                </div>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm bg-indigo-500 dark:bg-indigo-400"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankPill({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-500/30"
      : rank <= 3
        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ring-zinc-200 dark:ring-zinc-700"
        : "bg-transparent text-zinc-400 dark:text-zinc-500 ring-zinc-200 dark:ring-zinc-800";
  return (
    <span
      className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-semibold tabular-nums ring-1 ${tone}`}
    >
      #{rank}
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "rose" | "amber";
}) {
  const toneClass =
    tone === "rose"
      ? "text-rose-700 dark:text-rose-300"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-300"
        : "text-zinc-700 dark:text-zinc-300";
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className={`font-medium tabular-nums ${toneClass}`}>{value}</span>
    </span>
  );
}

function TagGrid({ rows }: { rows: HotspotsData["tags"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((t) => (
        <div
          key={t.tag}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
        >
          <span className="text-zinc-800 dark:text-zinc-200">{t.tag}</span>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span className="text-zinc-600 dark:text-zinc-400 tabular-nums">{t.ticketCount}</span>
          {t.urgentCount > 0 ? (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className="text-rose-600 dark:text-rose-400 tabular-nums text-xs">
                {t.urgentCount} urgent
              </span>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
