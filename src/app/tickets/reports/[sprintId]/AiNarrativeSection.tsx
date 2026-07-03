"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import {
  Panel,
  SectionTitle,
  SectionSkeleton,
  SectionError,
} from "./_shared";

type Severity = "low" | "medium" | "high" | "info" | "warn" | "critical";

interface AiNarrative {
  executiveSummary: string;
  healthNarrative: string;
  keyWins: string[];
  keyConcerns: string[];
  delayPatterns: { pattern: string; cause: string; severity: "low" | "medium" | "high" }[];
  predictions: { title: string; detail: string; severity: "info" | "warn" | "critical" }[];
  retroActions: string[];
}

interface ApiShape {
  cached: boolean;
  aiAvailable: boolean;
  narrative: AiNarrative | null;
  model?: string;
  generatedAt?: string | null;
  generatedById?: string | null;
}

export default function AiNarrativeSection({ sprintId, printMode }: { sprintId: string; printMode?: boolean }) {
  const [data, setData] = useState<ApiShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<ApiShape>(`/api/sprint-report/${sprintId}/ai-narrative`)
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err?.message ?? "Failed to load narrative"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sprintId]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post<ApiShape>(`/api/sprint-report/${sprintId}/ai-narrative`);
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <SectionTitle title="AI Sprint Narrative" />
        <SectionSkeleton height={180} />
      </section>
    );
  }

  // AI not configured server-side
  if (data && !data.aiAvailable && !data.narrative) {
    return null; // hide section entirely when AI is off
  }

  // No cached narrative yet — show the call-to-action
  if (data && !data.narrative) {
    return (
      <section className="space-y-4">
        <SectionTitle title="AI Sprint Narrative" hint="Executive summary, predictions, and retro actions" />
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/40 p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="max-w-md">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Generate AI insights for this sprint
            </div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Synthesizes overview, scope, velocity, timeline, and quality signals into an
              executive narrative with predictions and retro actions. Results are cached.
            </div>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              generating
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-wait"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {generating ? (
              <>
                <Spinner />
                Generating…
              </>
            ) : (
              <>
                <SparkleIcon />
                Generate Narrative
              </>
            )}
          </button>
        </div>
        {error ? <SectionError message={error} /> : null}
      </section>
    );
  }

  // Cached narrative present
  if (data && data.narrative) {
    const n = data.narrative;
    return (
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <SectionTitle title="AI Sprint Narrative" />
          {!printMode && (
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              {data.generatedAt ? (
                <span>
                  Generated {formatRelative(data.generatedAt)}
                  {data.model ? <span className="ml-1.5 text-zinc-400 dark:text-zinc-500">· {data.model}</span> : null}
                </span>
              ) : null}
              <button
                type="button"
                onClick={generate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
              >
                {generating ? <Spinner small /> : <RefreshIcon />}
                {generating ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
          <div className="px-6 pt-6 pb-5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-indigo-600 dark:text-indigo-400">
              Executive Summary
            </div>
            <p className="mt-2 text-base text-zinc-900 dark:text-zinc-50 leading-relaxed">
              {n.executiveSummary}
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
              Why the Health Score
            </div>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {n.healthNarrative}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WinsConcernsPanel
            title="Key Wins"
            items={n.keyWins}
            tone="emerald"
          />
          <WinsConcernsPanel
            title="Key Concerns"
            items={n.keyConcerns}
            tone="rose"
          />
        </div>

        {n.predictions.length > 0 ? (
          <Panel title="Predictions" hint="Forward-looking, based on current pace">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {n.predictions.map((p, i) => (
                <PredictionCard key={i} prediction={p} />
              ))}
            </div>
          </Panel>
        ) : null}

        {n.delayPatterns.length > 0 ? (
          <Panel title="Delay Patterns" hint="Likely root causes inferred from data">
            <div className="space-y-3">
              {n.delayPatterns.map((d, i) => (
                <DelayPatternRow key={i} pattern={d} />
              ))}
            </div>
          </Panel>
        ) : null}

        {n.retroActions.length > 0 ? (
          <Panel title="Retro Actions" hint="Suggestions for next sprint">
            <ol className="space-y-2.5 text-sm">
              {n.retroActions.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold tabular-nums flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-200 leading-relaxed">{a}</span>
                </li>
              ))}
            </ol>
          </Panel>
        ) : null}

        {error ? <SectionError message={error} /> : null}
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <SectionTitle title="AI Sprint Narrative" />
        <SectionError message={error} />
      </section>
    );
  }

  return null;
}

function WinsConcernsPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "rose";
}) {
  const toneStyles = {
    emerald: {
      label: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
    },
    rose: {
      label: "text-rose-700 dark:text-rose-300",
      dot: "bg-rose-500",
    },
  }[tone];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5">
      <div className={`text-[11px] uppercase tracking-[0.12em] font-medium ${toneStyles.label}`}>
        {title}
      </div>
      {items.length === 0 ? (
        <div className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
          Nothing notable.
        </div>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-zinc-800 dark:text-zinc-200">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 leading-relaxed">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${toneStyles.dot} mt-2 flex-shrink-0`}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PredictionCard({
  prediction,
}: {
  prediction: AiNarrative["predictions"][number];
}) {
  const styles =
    prediction.severity === "critical"
      ? "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10"
      : prediction.severity === "warn"
        ? "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10"
        : "border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10";
  const labelStyle =
    prediction.severity === "critical"
      ? "text-rose-800 dark:text-rose-200"
      : prediction.severity === "warn"
        ? "text-amber-800 dark:text-amber-200"
        : "text-sky-800 dark:text-sky-200";
  return (
    <div className={`rounded-lg border ${styles} p-4`}>
      <div className={`text-[11px] uppercase tracking-[0.12em] font-medium ${labelStyle}`}>
        {prediction.severity}
      </div>
      <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {prediction.title}
      </div>
      <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
        {prediction.detail}
      </div>
    </div>
  );
}

function DelayPatternRow({
  pattern,
}: {
  pattern: AiNarrative["delayPatterns"][number];
}) {
  const dotStyle =
    pattern.severity === "high"
      ? "bg-rose-500"
      : pattern.severity === "medium"
        ? "bg-amber-500"
        : "bg-zinc-400 dark:bg-zinc-500";
  const labelStyle =
    pattern.severity === "high"
      ? "text-rose-700 dark:text-rose-300"
      : pattern.severity === "medium"
        ? "text-amber-700 dark:text-amber-300"
        : "text-zinc-500 dark:text-zinc-400";
  return (
    <div className="flex items-start gap-3">
      <span className={`inline-block w-2 h-2 rounded-full ${dotStyle} mt-2 flex-shrink-0`} />
      <div className="min-w-0">
        <div className="text-sm text-zinc-900 dark:text-zinc-50 leading-relaxed">
          {pattern.pattern}
        </div>
        <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
          <span className={`uppercase tracking-[0.08em] font-medium ${labelStyle}`}>
            {pattern.severity}
          </span>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">·</span>
          {pattern.cause.replace(/-/g, " ")}
        </div>
      </div>
    </div>
  );
}

function Spinner({ small = false }: { small?: boolean }) {
  const size = small ? "w-3 h-3" : "w-4 h-4";
  return (
    <svg
      className={`animate-spin ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M18 14l.75 2.25L21 17l-2.25.75L18 20l-.75-2.25L15 17l2.25-.75L18 14z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    if (diff < 60_000) return "just now";
    const m = Math.round(diff / 60_000);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
