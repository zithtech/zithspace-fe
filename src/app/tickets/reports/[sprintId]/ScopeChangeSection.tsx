"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import {
  Panel,
  SectionTitle,
  Avatar,
  EmptyChart,
  SectionSkeleton,
  SectionError,
  fmtNum,
  fmtPct,
  useSnapshotSection,
} from "./_shared";

interface ScopeData {
  summary: {
    plannedTickets: number;
    plannedPoints: number;
    addedTickets: number;
    addedPoints: number;
    removedTickets: number;
    removedPoints: number;
    totalTickets: number;
    scopeIncreasePct: number;
    capacityDisruptionPct: number;
  };
  scopeAdders: {
    userId: string | null;
    userName: string;
    tickets: number;
    points: number;
  }[];
  addedByType: { type: string; count: number }[];
  removedEvents: {
    ticketId: string;
    action: string;
    performedAt: string;
    performedById: string | null;
    performedByName: string | null;
    storyPoint: number;
    type: string | null;
  }[];
}

export default function ScopeChangeSection({ sprintId }: { sprintId: string }) {
  const snapshot = useSnapshotSection<ScopeData>("scope");
  const [data, setData] = useState<ScopeData | null>(null);
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
      .get<ScopeData>(`/api/sprint-report/${sprintId}/scope`)
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err?.message ?? "Failed to load scope analysis"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sprintId, snapshot]);

  if (loading) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Scope Change" />
        <SectionSkeleton height={280} />
      </section>
    );
  }
  if (error) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Scope Change" />
        <SectionError message={error} />
      </section>
    );
  }
  if (!data) return null;

  const { summary, scopeAdders, addedByType } = data;
  const stackTotal = summary.plannedTickets + summary.addedTickets;
  const plannedPct = stackTotal > 0 ? (summary.plannedTickets / stackTotal) * 100 : 100;
  const addedPct = stackTotal > 0 ? (summary.addedTickets / stackTotal) * 100 : 0;

  return (
    <section className="space-y-4">
      <SectionTitle title="Scope Change" hint="What changed vs the sprint plan" />

      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
        <ScopeStat
          label="Planned"
          value={fmtNum(summary.plannedTickets)}
          sub={`${fmtNum(summary.plannedPoints)} pts`}
          tone="neutral"
        />
        <ScopeStat
          label="Added Mid-Sprint"
          value={fmtNum(summary.addedTickets)}
          sub={`${fmtNum(summary.addedPoints)} pts`}
          tone="amber"
        />
        <ScopeStat
          label="Removed"
          value={fmtNum(summary.removedTickets)}
          sub={`${fmtNum(summary.removedPoints)} pts`}
          tone="rose"
        />
        <ScopeStat
          label="Scope Increase"
          value={fmtPct(summary.scopeIncreasePct)}
          sub={`${fmtPct(summary.capacityDisruptionPct)} by points`}
          tone="indigo"
        />
      </div>

      <Panel title="Composition" hint="Planned vs added mid-sprint">
        {stackTotal === 0 ? (
          <EmptyChart message="No tickets in this sprint" />
        ) : (
          <div className="space-y-3">
            <div className="h-3 flex rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700">
              <div
                className="h-full bg-indigo-500 dark:bg-indigo-400"
                style={{ width: `${plannedPct}%` }}
              />
              <div
                className="h-full bg-amber-500 dark:bg-amber-400"
                style={{ width: `${addedPct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 dark:bg-indigo-400" />
                Planned
                <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {summary.plannedTickets} · {Math.round(plannedPct)}%
                </span>
              </span>
              <span className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 dark:bg-amber-400" />
                Added mid-sprint
                <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {summary.addedTickets} · {Math.round(addedPct)}%
                </span>
              </span>
              {summary.removedTickets > 0 ? (
                <span className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 dark:bg-rose-400" />
                  Removed
                  <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {summary.removedTickets}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-1 gap-4">
        <Panel title="Top Scope Adders" hint="Who introduced mid-sprint work">
          {scopeAdders.length === 0 ? (
            <EmptyChart message="No scope added after sprint start" />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
                    <th className="px-5 py-2.5 text-left">User</th>
                    <th className="px-5 py-2.5 text-right">Tickets Added</th>
                    <th className="px-5 py-2.5 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {scopeAdders.map((r) => (
                    <tr
                      key={r.userId ?? r.userName}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.userName} />
                          <span className="text-zinc-800 dark:text-zinc-200 whitespace-normal break-words">
                            {r.userName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                        {r.tickets}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                        {r.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Added Tickets by Type">
          {addedByType.length === 0 ? (
            <EmptyChart message="No mid-sprint additions" />
          ) : (
            <TypeBars rows={addedByType} />
          )}
        </Panel>
      </div>
    </section>
  );
}

function ScopeStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "neutral" | "amber" | "rose" | "indigo";
}) {
  const toneStyles = {
    neutral: "text-zinc-900 dark:text-zinc-50",
    amber: "text-amber-700 dark:text-amber-300",
    rose: "text-rose-700 dark:text-rose-300",
    indigo: "text-indigo-700 dark:text-indigo-300",
  } as const;

  return (
    <div className="px-5 py-4 border-zinc-200 dark:border-zinc-800 [&:not(:last-child)]:border-r sm:[&:nth-child(4n)]:border-r-0 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
      <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div
        className={`mt-1.5 text-2xl font-semibold leading-none tabular-nums ${toneStyles[tone]}`}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{sub}</div>
      ) : null}
    </div>
  );
}

function TypeBars({ rows }: { rows: { type: string; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.type} className="space-y-1 break-inside-avoid">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-zinc-700 dark:text-zinc-300 capitalize">
              {r.type || "Unknown"}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">{r.count}</span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm bg-amber-500 dark:bg-amber-400"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
