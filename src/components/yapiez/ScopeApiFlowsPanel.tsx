"use client";

/**
 * The Yapiez → QA Space join, on the QA Space side.
 *
 * A Test Scope's page shows the API flows attached to it and how each one last
 * ran, so "API testing" is visible where QA already reports on manual test
 * runs. Yapiez itself stays a separate module; this is the one read-only
 * window QA Space keeps onto it.
 *
 * Renders its own empty and error states and never throws, so a tenant without
 * Yapiez data — or a user without permission to read it — sees a quiet panel
 * rather than a broken Test Scope page.
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Zap } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { FlowRun, YapiezService, formatDuration } from "@/services/yapiezService";
import dayjs from "dayjs";

interface Summary {
  flows: number;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  failingFlows: number;
  runs: FlowRun[];
}

export default function ScopeApiFlowsPanel({ scopeId }: { scopeId: string }) {
  const router = useRouter();
  const { canReadYapiezRun, canReadYapiezFlow } = usePermission();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!scopeId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await YapiezService.scopeSummary(scopeId);
        if (!cancelled) setSummary(result);
      } catch {
        // A 403 here means the user cannot read Yapiez runs; anything else is a
        // Yapiez problem. Either way the Test Scope page must still render.
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scopeId]);

  if (loading) {
    return <div className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">Loading API flows…</div>;
  }

  if (unavailable) {
    return (
      <div className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">
        API flow results are not available.
      </div>
    );
  }

  if (!summary?.runs?.length) {
    return (
      <div className="px-5 py-4 text-sm text-zinc-400 dark:text-zinc-500">
        No API flows have run against this scope yet.
        {canReadYapiezFlow && (
          <>
            {" "}
            <button
              type="button"
              onClick={() => router.push("/yapiez/flows")}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Build one in Yapiez
            </button>
            {" — link it to this scope and its results appear here."}
          </>
        )}
      </div>
    );
  }

  const passRate = summary.totalSteps
    ? Math.round((summary.passedSteps / summary.totalSteps) * 100)
    : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
        <Metric label="Flows" value={summary.flows} />
        <Metric label="API calls" value={summary.totalSteps} />
        <Metric label="Passed" value={summary.passedSteps} tone="pass" />
        <Metric label="Failed" value={summary.failedSteps} tone="fail" />
        <Metric label="Pass rate" value={`${passRate}%`} tone={passRate === 100 ? "pass" : undefined} />
      </div>

      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {summary.runs.map((run) => {
          const failed = run.status === "Failed";
          return (
            <li key={run.id} className="flex items-center gap-3 px-5 py-3">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  failed
                    ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
                    : run.status === "Passed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                      : "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                }`}
              >
                {run.status}
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {run.flowName ?? "Flow"}{" "}
                  <span className="text-zinc-400 dark:text-zinc-500 font-normal">#{run.runNumber}</span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {run.passedSteps}/{run.totalSteps} passed
                  {run.failedSteps > 0 ? ` · ${run.failedSteps} failed` : ""} ·{" "}
                  {run.environmentName ?? "default environment"} · {formatDuration(run.durationMs)} ·{" "}
                  {dayjs(run.startedAt).format("DD MMM YYYY, HH:mm")}
                </div>
              </div>

              {canReadYapiezRun && (
                <button
                  type="button"
                  onClick={() => router.push(`/yapiez/runs/${run.id}`)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                >
                  Result <ArrowUpRight size={12} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {summary.failingFlows > 0 && (
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Zap size={12} className="text-red-500" />
          {summary.failingFlows} flow{summary.failingFlows === 1 ? "" : "s"} last finished failing. Open the
          result to see the failed step and raise a bug from it.
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "pass" | "fail";
}) {
  const color =
    tone === "pass"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "fail"
        ? "text-red-600 dark:text-red-400"
        : "text-zinc-800 dark:text-zinc-200";
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className={`text-lg font-semibold ${color}`}>{value}</span>
    </div>
  );
}
