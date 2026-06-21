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
  useSnapshotSection,
} from "./_shared";

type Severity = "info" | "warn" | "critical";

interface BottlenecksData {
  alerts: { kind: string; severity: Severity; message: string }[];
  qaQueue: StuckTicket[];
  blocked: StuckTicket[];
  stuckInProgress: StuckTicket[];
  oversized: {
    ticketId: string;
    ticketNumber: string | null;
    title: string;
    status: string | null;
    storyPoint: number;
    assigneeId: string | null;
    assigneeName: string | null;
  }[];
  concentration: {
    assigneeId: string | null;
    assigneeName: string;
    inFlightCount: number;
    sharePct: number;
  }[];
  thresholds: { qaDays: number; stuckDays: number };
}

interface StuckTicket {
  ticketId: string;
  ticketNumber: string | null;
  title: string;
  status: string;
  priority: string | null;
  storyPoint: number | null;
  assigneeId: string | null;
  assigneeName: string | null;
  daysInStatus: number;
}

const SEVERITY_STYLES: Record<
  Severity,
  { box: string; label: string; dot: string }
> = {
  info: {
    box: "border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10",
    label: "text-sky-800 dark:text-sky-200",
    dot: "bg-sky-500",
  },
  warn: {
    box: "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10",
    label: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  critical: {
    box: "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10",
    label: "text-rose-800 dark:text-rose-200",
    dot: "bg-rose-500",
  },
};

export default function BottlenecksSection({ sprintId }: { sprintId: string }) {
  const snapshot = useSnapshotSection<BottlenecksData>("bottlenecks");
  const [data, setData] = useState<BottlenecksData | null>(null);
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
      .get<BottlenecksData>(`/api/sprint-report/${sprintId}/bottlenecks`)
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err?.message ?? "Failed to load bottlenecks"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sprintId, snapshot]);

  if (loading) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Bottlenecks" />
        <SectionSkeleton height={260} />
      </section>
    );
  }
  if (error) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Bottlenecks" />
        <SectionError message={error} />
      </section>
    );
  }
  if (!data) return null;

  return (
    <section className="space-y-4">
      <SectionTitle
        title="Bottlenecks"
        hint="Detected workflow risks and stuck work"
      />

      {data.alerts.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4">
          <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            No active bottlenecks detected.
          </div>
          <div className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
            Sprint flow is clean: no QA queue buildup, no aged WIP, no concentration risk.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.alerts.map((a) => {
            const s = SEVERITY_STYLES[a.severity];
            return (
              <div
                key={a.kind}
                className={`rounded-xl border ${s.box} p-4 flex items-start gap-3`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full ${s.dot} mt-2 flex-shrink-0`}
                />
                <div className="min-w-0">
                  <div
                    className={`text-[11px] uppercase tracking-[0.12em] font-medium ${s.label}`}
                  >
                    {a.kind.replace(/-/g, " ")}
                  </div>
                  <div className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                    {a.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.qaQueue.length > 0 ? (
        <Panel
          title="QA Queue"
          hint={`Tickets currently in QA · ≥${data.thresholds.qaDays}d flagged`}
        >
          <StuckTable rows={data.qaQueue} warnThreshold={data.thresholds.qaDays} />
        </Panel>
      ) : null}

      {data.blocked.length > 0 ? (
        <Panel title="Blocked" hint="Tickets currently in blocked status">
          <StuckTable rows={data.blocked} warnThreshold={1} />
        </Panel>
      ) : null}

      {data.stuckInProgress.length > 0 ? (
        <Panel
          title="Stuck In-Progress"
          hint={`No status change for ≥${data.thresholds.stuckDays}d`}
        >
          <StuckTable rows={data.stuckInProgress} warnThreshold={data.thresholds.stuckDays} />
        </Panel>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.oversized.length > 0 ? (
          <Panel title="Oversized In-Flight" hint="≥13 story points">
            <div className="overflow-x-auto -mx-5">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
                    <th className="px-5 py-2.5 text-left">Ticket</th>
                    <th className="px-5 py-2.5 text-right">Pts</th>
                    <th className="px-5 py-2.5 text-left">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.oversized.map((t) => (
                    <tr
                      key={t.ticketId}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                            {t.ticketNumber ?? "—"}
                          </span>
                          <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-xs">
                            {t.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        <span className="text-rose-700 dark:text-rose-300 font-medium">
                          {t.storyPoint}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300 truncate">
                        {t.assigneeName ?? "Unassigned"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}

        {data.concentration.length > 0 ? (
          <Panel title="Workload Concentration" hint="Users holding ≥30% of in-flight tickets">
            <div className="space-y-3">
              {data.concentration.map((c) => (
                <div key={c.assigneeId ?? c.assigneeName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={c.assigneeName} />
                      <span className="text-zinc-800 dark:text-zinc-200 truncate">
                        {c.assigneeName}
                      </span>
                    </div>
                    <span className="tabular-nums whitespace-nowrap">
                      <span
                        className={
                          c.sharePct >= 50
                            ? "text-rose-700 dark:text-rose-300 font-medium"
                            : "text-amber-700 dark:text-amber-300 font-medium"
                        }
                      >
                        {c.sharePct}%
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 ml-2">
                        · {c.inFlightCount} tickets
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm ${
                        c.sharePct >= 50
                          ? "bg-rose-500 dark:bg-rose-400"
                          : "bg-amber-500 dark:bg-amber-400"
                      }`}
                      style={{ width: `${Math.min(100, c.sharePct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}
      </div>
    </section>
  );
}

function StuckTable({
  rows,
  warnThreshold,
}: {
  rows: StuckTicket[];
  warnThreshold: number;
}) {
  if (rows.length === 0) return <EmptyChart message="No tickets" />;
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
            <th className="px-5 py-2.5 text-left">Ticket</th>
            <th className="px-5 py-2.5 text-left">Assignee</th>
            <th className="px-5 py-2.5 text-left">Status</th>
            <th className="px-5 py-2.5 text-right">Days in Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((t) => {
            const isHot = t.daysInStatus >= warnThreshold;
            return (
              <tr
                key={t.ticketId}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
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
                    <span className="text-zinc-700 dark:text-zinc-300 truncate">
                      {t.assigneeName ?? "Unassigned"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300 capitalize">
                  {t.status.replace(/_/g, " ")}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  <span
                    className={
                      isHot
                        ? "text-rose-700 dark:text-rose-300 font-medium"
                        : "text-zinc-700 dark:text-zinc-300"
                    }
                  >
                    {t.daysInStatus}d
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
