"use client";

import { createContext, useContext } from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Holds the full stored report snapshot (`report_data`) for a generated report.
 * When present, section components read their slice from here instead of each
 * making its own API call — so opening a generated report is a single DB-backed
 * fetch. `null` means no snapshot (active/ungenerated sprint) → sections fetch
 * their own live endpoints as before.
 */
export const SnapshotContext = createContext<Record<string, any> | null>(null);

/**
 * Returns the snapshot slice for a section key (e.g. "timeline"), or `undefined`
 * when there is no snapshot — in which case the section should fetch live.
 */
export function useSnapshotSection<T = any>(key: string): T | undefined {
  const snap = useContext(SnapshotContext);
  const value = snap ? snap[key] : undefined;
  return value == null ? undefined : (value as T);
}

export const ACCENT = "#6366f1"; // indigo-500
export const ACCENT_SOFT_LIGHT = "rgba(99,102,241,0.10)";
export const ACCENT_SOFT_DARK = "rgba(99,102,241,0.18)";

export const PIE_PALETTE_LIGHT = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
];
export const PIE_PALETTE_DARK = [
  "#818cf8",
  "#38bdf8",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#c084fc",
  "#2dd4bf",
];

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function fmtDayShort(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n}%`;
}

export function fmtNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

export function useChartColors() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    isDark,
    palette: isDark ? PIE_PALETTE_DARK : PIE_PALETTE_LIGHT,
    grid: isDark ? "#27272a" : "#f4f4f5",
    axis: isDark ? "#71717a" : "#a1a1aa",
    tick: isDark ? "#d4d4d8" : "#52525b",
    tooltipBg: isDark ? "#18181b" : "#ffffff",
    tooltipBorder: isDark ? "#27272a" : "#e4e4e7",
    tooltipText: isDark ? "#e4e4e7" : "#27272a",
    cursorFill: isDark ? ACCENT_SOFT_DARK : ACCENT_SOFT_LIGHT,
    pieStroke: isDark ? "#18181b" : "#ffffff",
  };
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
        {title}
      </h2>
      {hint ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      ) : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  hint,
  padded = true,
  allowBreak,
}: {
  title: string;
  children: React.ReactNode;
  hint?: string;
  padded?: boolean;
  allowBreak?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 ${allowBreak ? '' : 'break-inside-avoid'}`}>
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-3">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{title}</span>
        {hint ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
        ) : null}
      </div>
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 ring-1 ring-zinc-200 dark:ring-zinc-700">
      {initials || "·"}
    </span>
  );
}

export function EmptyChart({ message = "No data" }: { message?: string }) {
  return (
    <div className="h-32 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
      {message}
    </div>
  );
}

export function InsightCard({
  title,
  insights,
}: {
  title?: string;
  insights: string[];
}) {
  if (insights.length === 0) return null;
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 break-inside-avoid">
      {title ? (
        <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          {title}
        </div>
      ) : null}
      <ul className="space-y-1.5 text-sm text-zinc-800 dark:text-zinc-200">
        {insights.map((i, idx) => (
          <li key={idx} className="flex gap-2 leading-relaxed">
            <span className="text-indigo-500 dark:text-indigo-400 mt-1.5 flex-shrink-0">
              <span className="inline-block w-1 h-1 rounded-full bg-current align-middle" />
            </span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SectionSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 animate-pulse"
      style={{ height }}
    />
  );
}

export function SectionError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-5">
      <div className="text-sm text-rose-700 dark:text-rose-300">{message}</div>
    </div>
  );
}
