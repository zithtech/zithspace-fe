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
  InsightCard,
  fmtPct,
  useSnapshotSection,
} from "./_shared";

interface QualityTicket {
  ticketId: string;
  ticketNumber: string | null;
  title: string;
  type: string | null;
  status: string | null;
  priority: string | null;
  storyPoint: number | null;
  assigneeId: string | null;
  assigneeName: string | null;
  subtaskCount: number;
  commentCount: number;
  statusTransitions: number;
  linkedCount: number;
  reopenCount: number;
  qaRejectionCount: number;
  complexityScore: number;
}

interface QualityData {
  tickets: QualityTicket[];
  summary: {
    totalTickets: number;
    reopenedTicketCount: number;
    totalReopens: number;
    qaRejectedTicketCount: number;
    totalQaRejections: number;
    reworkPct: number;
    highComplexityCount: number;
  };
  reopenByAssignee: {
    assigneeId: string | null;
    assigneeName: string;
    reopens: number;
    qaRejections: number;
  }[];
  insights: string[];
}

export default function QualitySection({ sprintId }: { sprintId: string }) {
  const snapshot = useSnapshotSection<QualityData>("quality");
  const [data, setData] = useState<QualityData | null>(null);
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
      .get<QualityData>(`/api/sprint-report/${sprintId}/quality`)
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err?.message ?? "Failed to load quality analysis"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sprintId, snapshot]);

  if (loading) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Quality & Complexity" />
        <SectionSkeleton height={300} />
      </section>
    );
  }
  if (error) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Quality & Complexity" />
        <SectionError message={error} />
      </section>
    );
  }
  if (!data) return null;

  const { summary, tickets, reopenByAssignee } = data;
  const topComplex = tickets.slice(0, 10);

  return (
    <section className="space-y-4">
      <SectionTitle title="Quality & Complexity" hint="Rework, reopens, and execution complexity" />

      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
        <QualityStat
          label="Rework Rate"
          value={fmtPct(summary.reworkPct)}
          sub={`${summary.reopenedTicketCount} reopened`}
          tone={summary.reworkPct >= 15 ? "rose" : summary.reworkPct >= 5 ? "amber" : "neutral"}
        />
        <QualityStat
          label="Total Reopens"
          value={`${summary.totalReopens}`}
          sub="status reverted from done"
        />
        <QualityStat
          label="QA Rejections"
          value={`${summary.totalQaRejections}`}
          sub={`${summary.qaRejectedTicketCount} ticket${summary.qaRejectedTicketCount === 1 ? "" : "s"}`}
          tone={summary.qaRejectedTicketCount >= 3 ? "amber" : "neutral"}
        />
        <QualityStat
          label="High Complexity"
          value={`${summary.highComplexityCount}`}
          sub="score ≥ 30"
          tone={summary.highComplexityCount >= 3 ? "amber" : "neutral"}
        />
      </div>

      <InsightCard title="Quality Signals" insights={data.insights} />

      <Panel title="Most Complex Tickets" hint="Top 10 by complexity score (subtasks, comments, transitions, links, reopens)">
        <ComplexityTable rows={topComplex} />
      </Panel>

      {reopenByAssignee.length > 0 ? (
        <Panel title="Rework by Assignee" hint="Who carried the rework load">
          <RewordByAssigneeTable rows={reopenByAssignee} />
        </Panel>
      ) : null}
    </section>
  );
}

function QualityStat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "amber" | "rose";
}) {
  const toneClass =
    tone === "rose"
      ? "text-rose-700 dark:text-rose-300"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-300"
        : "text-zinc-900 dark:text-zinc-50";

  return (
    <div className="px-5 py-4 border-zinc-200 dark:border-zinc-800 [&:not(:last-child)]:border-r sm:[&:nth-child(4n)]:border-r-0 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
      <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className={`mt-1.5 text-2xl font-semibold leading-none tabular-nums ${toneClass}`}>
        {value}
      </div>
      {sub ? (
        <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{sub}</div>
      ) : null}
    </div>
  );
}

function ComplexityTable({ rows }: { rows: QualityTicket[] }) {
  if (rows.length === 0) return <EmptyChart message="No tickets in this sprint" />;
  const maxScore = Math.max(...rows.map((r) => r.complexityScore), 1);
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
            <th className="px-5 py-2.5 text-left">Ticket</th>
            <th className="px-5 py-2.5 text-right">Sub</th>
            <th className="px-5 py-2.5 text-right">Cmt</th>
            <th className="px-5 py-2.5 text-right">Trans</th>
            <th className="px-5 py-2.5 text-right">Link</th>
            <th className="px-5 py-2.5 text-right">Reopen</th>
            <th className="px-5 py-2.5 text-right">QA Rej</th>
            <th className="px-5 py-2.5 text-right">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((t) => {
            const widthPct = (t.complexityScore / maxScore) * 100;
            return (
              <tr
                key={t.ticketId}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <td className="px-5 py-3 max-w-md">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      {t.ticketNumber ?? "—"}
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-200 whitespace-normal break-words">{t.title}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {t.subtaskCount}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {t.commentCount}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {t.statusTransitions}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {t.linkedCount}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {t.reopenCount > 0 ? (
                    <span className="text-rose-700 dark:text-rose-300 font-medium">
                      {t.reopenCount}
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-600">0</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {t.qaRejectionCount > 0 ? (
                    <span className="text-amber-700 dark:text-amber-300 font-medium">
                      {t.qaRejectionCount}
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-600">0</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden hidden sm:block">
                      <div
                        className="h-full rounded-sm bg-indigo-500 dark:bg-indigo-400"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50 min-w-10 text-right">
                      {t.complexityScore}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RewordByAssigneeTable({
  rows,
}: {
  rows: QualityData["reopenByAssignee"];
}) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
            <th className="px-5 py-2.5 text-left">Assignee</th>
            <th className="px-5 py-2.5 text-right">Reopens</th>
            <th className="px-5 py-2.5 text-right">QA Rejections</th>
            <th className="px-5 py-2.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((r) => (
            <tr
              key={r.assigneeId ?? r.assigneeName}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.assigneeName} />
                  <span className="text-zinc-800 dark:text-zinc-200 whitespace-normal break-words">
                    {r.assigneeName}
                  </span>
                </div>
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {r.reopens > 0 ? (
                  <span className="text-rose-700 dark:text-rose-300 font-medium">
                    {r.reopens}
                  </span>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-600">0</span>
                )}
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {r.qaRejections > 0 ? (
                  <span className="text-amber-700 dark:text-amber-300 font-medium">
                    {r.qaRejections}
                  </span>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-600">0</span>
                )}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-900 dark:text-zinc-50 font-medium">
                {r.reopens + r.qaRejections}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
