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
  ACCENT,
} from "./_shared";

interface TimelineTicket {
  ticketId: string;
  ticketNumber: string | null;
  title: string;
  type: string | null;
  status: string | null;
  priority: string | null;
  storyPoint: number | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string | null;
  dueDate: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  firstStartedAt: string | null;
  firstQaAt: string | null;
  firstDoneAt: string | null;
  completedAt: string | null;
  transitionCount: number;
  reopenCount: number;
  delayDays: number | null;
}

interface TimelineData {
  tickets: TimelineTicket[];
  aggregates: {
    totalTickets: number;
    delayedCount: number;
    avgDelayDays: number;
    longestDelay: {
      ticketId: string;
      ticketNumber: string | null;
      title: string;
      delayDays: number | null;
    } | null;
    totalReopens: number;
    highComplexityCount: number;
    delayByAssignee: {
      assigneeId: string | null;
      assigneeName: string;
      avgDelay: number;
      count: number;
    }[];
    delayByType: { type: string; avgDelay: number; count: number }[];
  };
}

export default function TimelineSection({ sprintId }: { sprintId: string }) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<TimelineData>(`/api/sprint-report/${sprintId}/timeline`)
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err?.message ?? "Failed to load timeline"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sprintId]);

  if (loading) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Delay & Timeline" />
        <SectionSkeleton height={300} />
      </section>
    );
  }
  if (error) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Delay & Timeline" />
        <SectionError message={error} />
      </section>
    );
  }
  if (!data) return null;

  const { aggregates, tickets } = data;
  const slowest = tickets.filter((t) => (t.delayDays ?? 0) > 0).slice(0, 10);

  return (
    <section className="space-y-4">
      <SectionTitle title="Delay & Timeline" hint="Per-ticket cycle and rework signals" />

      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
        <MiniStat
          label="Delayed"
          value={`${aggregates.delayedCount}`}
          sub={`of ${aggregates.totalTickets}`}
        />
        <MiniStat
          label="Avg Delay"
          value={aggregates.avgDelayDays > 0 ? `${aggregates.avgDelayDays}d` : "—"}
          sub="on delayed tickets"
        />
        <MiniStat
          label="Reopens"
          value={`${aggregates.totalReopens}`}
          sub="status reverted from done"
        />
        <MiniStat
          label="High Complexity"
          value={`${aggregates.highComplexityCount}`}
          sub="≥8 transitions or ≥2 reopens"
        />
      </div>

      {aggregates.longestDelay ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
          <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-amber-700 dark:text-amber-300">
            Longest Delayed Ticket
          </div>
          <div className="mt-1 text-sm text-amber-900 dark:text-amber-100">
            <span className="font-medium">{aggregates.longestDelay.ticketNumber ?? "—"}</span>
            <span className="text-amber-700 dark:text-amber-300"> · </span>
            <span>{aggregates.longestDelay.title}</span>
            <span className="text-amber-700 dark:text-amber-300"> · </span>
            <span className="font-medium tabular-nums">
              {aggregates.longestDelay.delayDays}d late
            </span>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Avg Delay by Assignee">
          <DelayBars
            rows={aggregates.delayByAssignee.map((r) => ({
              label: r.assigneeName,
              value: r.avgDelay,
              count: r.count,
            }))}
            unit="d"
          />
        </Panel>
        <Panel title="Slowest Tickets" hint="Top 10 by delay, then rework">
          <SlowTicketsTable rows={slowest} />
        </Panel>
      </div>
    </section>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-5 py-4 border-zinc-200 dark:border-zinc-800 not-last:border-r [&:not(:last-child)]:border-r [&:nth-child(2n)]:sm:border-r-0 [&:not(:nth-child(2n))]:border-r sm:[&:not(:nth-child(4n))]:border-r sm:[&:nth-child(4n)]:border-r-0 [&:nth-child(-n+2)]:border-b sm:border-b-0">
      <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold leading-none text-zinc-900 dark:text-zinc-50 tabular-nums">
        {value}
      </div>
      {sub ? (
        <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{sub}</div>
      ) : null}
    </div>
  );
}

function DelayBars({
  rows,
  unit = "",
}: {
  rows: { label: string; value: number; count: number }[];
  unit?: string;
}) {
  if (rows.length === 0) return <EmptyChart message="No delayed tickets" />;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2.5">
      {rows.slice(0, 8).map((r) => {
        const widthPct = (r.value / max) * 100;
        return (
          <div key={r.label} className="space-y-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1 mr-3 capitalize">
                {r.label}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                {r.value}
                {unit}
                <span className="text-zinc-400 dark:text-zinc-500 ml-2">
                  · {r.count} ticket{r.count === 1 ? "" : "s"}
                </span>
              </span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm"
                style={{ width: `${widthPct}%`, background: ACCENT }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SlowTicketsTable({ rows }: { rows: TimelineTicket[] }) {
  if (rows.length === 0) return <EmptyChart message="No delayed tickets in this sprint" />;
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
            <th className="px-5 py-2.5 text-left">Ticket</th>
            <th className="px-5 py-2.5 text-left">Assignee</th>
            <th className="px-5 py-2.5 text-right">Delay</th>
            <th className="px-5 py-2.5 text-right">Transitions</th>
            <th className="px-5 py-2.5 text-right">Reopens</th>
            <th className="px-5 py-2.5 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((t) => (
            <tr
              key={t.ticketId}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
            >
              <td className="px-5 py-3">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    {t.ticketNumber ?? "—"}
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-md">
                    {t.title}
                  </span>
                </div>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={t.assigneeName ?? "Unassigned"} />
                  <span className="text-zinc-800 dark:text-zinc-200 truncate">
                    {t.assigneeName ?? "Unassigned"}
                  </span>
                </div>
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                <span
                  className={
                    (t.delayDays ?? 0) >= 5
                      ? "text-rose-700 dark:text-rose-300 font-medium"
                      : "text-amber-700 dark:text-amber-300"
                  }
                >
                  {t.delayDays != null ? `${t.delayDays}d` : "—"}
                </span>
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {t.transitionCount}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {t.reopenCount > 0 ? (
                  <span className="text-rose-700 dark:text-rose-300 font-medium">
                    {t.reopenCount}
                  </span>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-600">0</span>
                )}
              </td>
              <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 capitalize">
                {(t.status ?? "—").replace(/_/g, " ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
