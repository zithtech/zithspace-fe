"use client";

/**
 * Module page — everything one module touches, end to end.
 *
 * The Coverage Map row says a module has 3 suites and 12 runs. This page says
 * which run failed, when, who ran it, and exactly which cases went red — the
 * "10 runs, and the 5th one dropped 10 failures" question.
 *
 * Run failures are not in any list endpoint, so they are pulled per run from
 * the run detail endpoint with a Fail filter: the recent failing runs load up
 * front to build the hotspot panel, and the rest load when opened.
 */

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Drawer, Tooltip } from "antd";
import { BugOutlined } from "@ant-design/icons";
import {
  ArrowLeft, ArrowUpRight, AlertTriangle, Activity, Boxes, CalendarDays, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Clock, FileText, Flame, Grid3x3, Layers, Lightbulb,
  PlayCircle, Repeat, RotateCw, Search, Target, TrendingDown, TrendingUp, X,
} from "lucide-react";
import dayjs from "dayjs";

import { usePermission } from "@/hooks/usePermission";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useActivitySource } from "@/hooks/useActivitySource";
import { apiClient } from "@/lib/axios";
import ZukvoLoader, { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import {
  ResultBar, fmtAgo, fmtDate, fmtDateTime, initialsOf, statusTone,
  useCoverageData, useUserProjects, type ModuleNode,
} from "../shared";

/** Failing runs whose failures are fetched without being asked. */
const EAGER_FAILURE_RUNS = 8;

/** How many run-result reads Case stability keeps in flight at once. */
const RESULT_CONCURRENCY = 5;

const SECTIONS = [
  { key: "suites", label: "Suites & runs", icon: Layers },
  { key: "failures", label: "Failures", icon: Flame },
  { key: "scopes", label: "Scopes", icon: Target },
  { key: "scenarios", label: "Scenarios", icon: ClipboardList },
] as const;
type SectionKey = (typeof SECTIONS)[number]["key"];

const runDate = (r: any) => r?.started_at || r?.created_at || null;

const countsOf = (r: any) => ({
  passed: Number(r?.passed_count || 0),
  failed: Number(r?.failed_count || 0),
  blocked: Number(r?.blocked_count || 0),
  notRun: Number(r?.not_executed_count || 0),
});

/** A run's pass rate over what was actually executed, null if nothing was. */
const rateOf = (r: any) => {
  const { passed, failed, blocked } = countsOf(r);
  const executed = passed + failed + blocked;
  return executed > 0 ? Math.round((passed / executed) * 100) : null;
};

/**
 * Passed and failed as a share of the two together. A count on its own doesn't
 * say whether "8 failed" was a bad day or a bad quarter, so every calendar
 * figure carries its percentage beside it. Null when nothing passed or failed.
 */
const shareOf = (passed: number, failed: number) => {
  const total = passed + failed;
  if (total === 0) return null;
  const pass = Math.round((passed / total) * 100);
  return { pass, fail: 100 - pass };
};

/** What a run is called for grouping — its type if set, else its name. */
const kindOf = (r: any) => String(r?.execution_type || r?.run_name || "Unnamed").trim();

type Tone = "info" | "good" | "warn" | "bad";
interface Insight {
  icon: any;
  tone: Tone;
  /** The headline, with the numbers that matter emphasised by the renderer. */
  text: React.ReactNode;
  detail?: string;
}

/**
 * Reads the module's execution history the way a QA lead would summarise it in
 * a stand-up: how much has run, what kind, what went worst, and what needs
 * attention right now.
 */
function buildInsights(suites: any[], chrono: any[], hotspots: { name: string; runs: any[] }[]): Insight[] {
  const out: Insight[] = [];
  const runs = chrono;
  const n = runs.length;

  if (!n) {
    out.push({
      icon: AlertTriangle, tone: "warn",
      text: <>This module has <b>never been executed</b>.</>,
      detail: suites.length
        ? `${suites.length} suite${suites.length === 1 ? " is" : "s are"} ready but no run has been created.`
        : "No suite has been assembled for it yet, so there is nothing to run.",
    });
    return out;
  }

  const first = runDate(runs[0]);
  const last = runDate(runs[n - 1]);
  const suitesRun = new Set(runs.map(r => String(r.suite_id))).size;

  // 1 — how much has run
  out.push({
    icon: PlayCircle, tone: "info",
    text: <>This module has been executed <b>{n} time{n === 1 ? "" : "s"}</b> across <b>{suitesRun} suite{suitesRun === 1 ? "" : "s"}</b>.</>,
    detail: first && last ? `First run ${fmtDate(first)}, most recent ${fmtDate(last)}.` : undefined,
  });

  // 2 — what kind of runs dominate
  const kinds = new Map<string, number>();
  runs.forEach(r => kinds.set(kindOf(r), (kinds.get(kindOf(r)) || 0) + 1));
  const [topKind, topKindN] = Array.from(kinds.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topKindN > 1) {
    out.push({
      icon: Repeat, tone: "info",
      text: <>Most runs are <b>“{topKind}”</b> — <b>{topKindN} of {n}</b>.</>,
      detail: kinds.size > 1 ? `${kinds.size} different run types in total.` : "Every run has been the same type.",
    });
  }

  // 3 — the totals
  const passed = runs.reduce((a, r) => a + countsOf(r).passed, 0);
  const failed = runs.reduce((a, r) => a + countsOf(r).failed, 0);
  const blocked = runs.reduce((a, r) => a + countsOf(r).blocked, 0);
  const executed = passed + failed + blocked;
  const overall = executed > 0 ? Math.round((passed / executed) * 100) : null;
  out.push({
    icon: Activity, tone: overall !== null && overall < 70 ? "warn" : "good",
    text: <>Across those {n} runs: <b>{passed} passed</b> and <b>{failed} failed</b> case{failed === 1 ? "" : "s"}.</>,
    detail: overall === null
      ? "Nothing has been marked pass or fail yet."
      : `${overall}% overall success${blocked ? `, ${blocked} blocked` : ""}.`,
  });

  // 4 — the worst run
  const worst = runs.slice().sort((a, b) => countsOf(b).failed - countsOf(a).failed)[0];
  if (countsOf(worst).failed > 0) {
    const idx = runs.indexOf(worst) + 1;
    out.push({
      icon: Flame, tone: "bad",
      text: <>Worst run was <b>#{idx} “{worst.run_name || "Untitled run"}”</b> on <b>{fmtDate(runDate(worst))}</b> — <b>{countsOf(worst).failed} failed case{countsOf(worst).failed === 1 ? "" : "s"}</b>.</>,
      detail: [worst.created_by_name && `Run by ${worst.created_by_name}`, worst.scope_name && `scope ${worst.scope_name}`]
        .filter(Boolean).join(" · ") || undefined,
    });
  }

  // 5 — where it stands right now
  const latest = runs[n - 1];
  const latestRate = rateOf(latest);
  const latestFailed = countsOf(latest).failed;
  const needsAttention = latestRate !== null && latestRate < 80;
  out.push({
    icon: needsAttention ? AlertTriangle : CheckCircle2,
    tone: needsAttention ? "bad" : "good",
    text: (
      <>
        Last run was <b>{fmtAgo(last).toLowerCase()}</b> ({fmtDate(last)})
        {latestRate === null
          ? <> — <b>nothing executed</b> on it yet.</>
          : <> — <b>{latestRate}% success</b>{latestFailed ? <>, <b>{latestFailed} still failing</b></> : null}.</>}
      </>
    ),
    detail: needsAttention
      ? "Below 80% — this module needs attention before the next release."
      : latestRate !== null ? "Holding above 80% success." : undefined,
  });

  // 6 — direction of travel
  if (n >= 3 && overall !== null && latestRate !== null) {
    const delta = latestRate - overall;
    if (Math.abs(delta) >= 5) {
      out.push({
        icon: delta > 0 ? TrendingUp : TrendingDown,
        tone: delta > 0 ? "good" : "warn",
        text: <>The latest run is <b>{Math.abs(delta)} points {delta > 0 ? "above" : "below"}</b> this module&apos;s average of <b>{overall}%</b>.</>,
        detail: delta > 0 ? "Quality is trending up." : "Quality is trending down run over run.",
      });
    }
  }

  // 7 — failures that keep coming back
  const recurring = hotspots.filter(h => h.runs.length > 1);
  if (recurring.length) {
    const worstCase = recurring[0];
    out.push({
      icon: Repeat, tone: "bad",
      text: <><b>{recurring.length} case{recurring.length === 1 ? "" : "s"}</b> failed in more than one run — worst is <b>“{worstCase.name}”</b> at <b>{worstCase.runs.length} runs</b>.</>,
      detail: "Recurring failures usually mean an unfixed defect rather than a flaky test.",
    });
  }

  // 8 — suites nobody runs
  const idle = suites.filter(su => !runs.some(r => String(r.suite_id) === String(su.id)));
  if (idle.length) {
    out.push({
      icon: Layers, tone: "warn",
      text: <><b>{idle.length} of {suites.length} suite{suites.length === 1 ? "" : "s"}</b> {idle.length === 1 ? "has" : "have"} never been run.</>,
      detail: idle.slice(0, 3).map(su => su.suite_name).filter(Boolean).join(", ")
        + (idle.length > 3 ? ` and ${idle.length - 3} more.` : "."),
    });
  }

  // 9 — has it gone quiet?
  const idleDays = last ? dayjs().diff(dayjs(last), "day") : null;
  if (idleDays !== null && idleDays > 30) {
    out.push({
      icon: Clock, tone: "warn",
      text: <>Nothing has been executed here for <b>{idleDays} days</b>.</>,
      detail: "The last result is old enough that it no longer says much about today's build.",
    });
  }

  return out;
}

/**
 * "What the history says" — the read-out that opens the page.
 *
 * It reads the whole module by default, but a module's suites often test very
 * different things, so the same picker the calendar uses narrows every insight
 * below it to one suite's runs.
 */
function HistoryInsights({ suites, runs, hotspots }: {
  suites: any[];
  /** Every run this module has, oldest first. */
  runs: any[];
  /** Cases that failed more than once, each carrying the runs it failed in. */
  hotspots: { name: string; runs: { run: any }[] }[];
}) {
  const [suiteId, setSuiteId] = useState<string>("all");

  const options = useMemo(() => {
    const counted = suites.map(su => ({
      id: String(su.id),
      name: su.suite_name || "Untitled suite",
      n: runs.filter(r => String(r.suite_id) === String(su.id)).length,
    }));
    const orphan = runs.filter(r => !suites.some(su => String(su.id) === String(r.suite_id))).length;
    if (orphan) counted.push({ id: "__none", name: "Without a suite", n: orphan });
    return counted.sort((a, b) => b.n - a.n);
  }, [suites, runs]);

  const inScope = (r: any) => {
    if (suiteId === "all") return true;
    if (suiteId === "__none") return !suites.some(su => String(su.id) === String(r.suite_id));
    return String(r.suite_id) === suiteId;
  };

  const scoped = useMemo(() => runs.filter(inScope), [runs, suites, suiteId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Only the picked suite counts as "never run" once the panel is narrowed to it. */
  const scopedSuites = useMemo(
    () => (suiteId === "all" ? suites : suites.filter(su => String(su.id) === suiteId)),
    [suites, suiteId],
  );

  /** A hotspot keeps only the failures that happened inside the picked suite. */
  const scopedHotspots = useMemo(() => {
    if (suiteId === "all") return hotspots;
    return hotspots
      .map(h => ({ ...h, runs: h.runs.filter(x => inScope(x.run)) }))
      .filter(h => h.runs.length)
      .sort((a, b) => b.runs.length - a.runs.length);
  }, [hotspots, suiteId, suites]); // eslint-disable-line react-hooks/exhaustive-deps

  const insights = useMemo(
    () => buildInsights(scopedSuites, scoped, scopedHotspots),
    [scopedSuites, scoped, scopedHotspots],
  );

  const activeName = suiteId === "all"
    ? null
    : options.find(o => o.id === suiteId)?.name ?? "this suite";

  return (
    <section className="mx-insights">
      <header className="mx-insights__head">
        <span className="mx-insights__ic"><Lightbulb size={14} /></span>
        <div className="min-w-0">
          <div className="mx-insights__title">What the history says</div>
          <div className="mx-insights__sub">
            {activeName
              ? <>Read from the <b>{scoped.length}</b> run{scoped.length === 1 ? "" : "s"} of “{activeName}”</>
              : "Read from every scope, suite and run attached to this module"}
          </div>
        </div>
        <div className="mx-insights__tools">
          <SearchableDropdown
            value={suiteId}
            onChange={(v: any) => setSuiteId(v || "all")}
            options={[
              { value: "all", label: "All suites", meta: `${runs.length} run${runs.length === 1 ? "" : "s"}` },
              ...options.map(o => ({
                value: o.id,
                label: o.name,
                meta: `${o.n} run${o.n === 1 ? "" : "s"}`,
                disabled: o.n === 0,
              })),
            ]}
            searchPlaceholder="Search suites"
            itemNoun="suites"
            hideAvatar
            allowClear={false}
            width={280}
            style={{ width: 230 }}
          />
        </div>
      </header>
      <ol className="mx-insights__list">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <li key={i} className={`mx-ins mx-ins--${ins.tone}`}>
              <span className="mx-ins__n">{i + 1}</span>
              <span className="mx-ins__ic"><Icon size={14} /></span>
              <div className="mx-ins__body">
                <div className="mx-ins__text">{ins.text}</div>
                {ins.detail && <div className="mx-ins__detail">{ins.detail}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Weekday header for the calendar, Monday-first the way a sprint reads. */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Run calendar — the same execution history laid out by date instead of by
 * bar. Pick a suite, walk the months, and every day carries the runs that
 * executed on it; clicking a day (or a single run beside it) sends it to the
 * inspector exactly like clicking a bar does.
 */
function RunCalendar({ suites, runs }: {
  suites: any[];
  runs: any[];
}) {
  const router = useRouter();
  const [suiteId, setSuiteId] = useState<string>("all");
  const [cursor, setCursor] = useState(() => dayjs().startOf("month"));
  const [day, setDay] = useState<string | null>(null);

  /** Every suite plus a catch-all, with how many runs each one carries. */
  const options = useMemo(() => {
    const counted = suites.map(su => ({
      id: String(su.id),
      name: su.suite_name || "Untitled suite",
      n: runs.filter(r => String(r.suite_id) === String(su.id)).length,
    }));
    const orphan = runs.filter(r => !suites.some(su => String(su.id) === String(r.suite_id))).length;
    if (orphan) counted.push({ id: "__none", name: "Without a suite", n: orphan });
    return counted.sort((a, b) => b.n - a.n);
  }, [suites, runs]);

  const scoped = useMemo(() => {
    if (suiteId === "all") return runs;
    if (suiteId === "__none") return runs.filter(r => !suites.some(su => String(su.id) === String(r.suite_id)));
    return runs.filter(r => String(r.suite_id) === suiteId);
  }, [runs, suites, suiteId]);

  /** Runs keyed by the day they ran, so painting a cell is one lookup. */
  const byDay = useMemo(() => {
    const m = new Map<string, any[]>();
    scoped.forEach(r => {
      const d = dayjs(runDate(r));
      if (!d.isValid()) return;
      const k = d.format("YYYY-MM-DD");
      m.set(k, [...(m.get(k) ?? []), r]);
    });
    return m;
  }, [scoped]);

  /** Land on the month of the newest run so an empty page is never the first view. */
  useEffect(() => {
    const newest = chronological(scoped)[scoped.length - 1];
    const d = newest ? dayjs(runDate(newest)) : null;
    setCursor(d?.isValid() ? d.startOf("month") : dayjs().startOf("month"));
    setDay(null);
  }, [suiteId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Six weeks from the Monday on or before the 1st — a stable grid every month. */
  const cells = useMemo(() => {
    const first = cursor.startOf("month");
    const start = first.subtract((first.day() + 6) % 7, "day");
    return Array.from({ length: 42 }, (_, i) => {
      const d = start.add(i, "day");
      const key = d.format("YYYY-MM-DD");
      const dayRuns = byDay.get(key) ?? [];
      const c = dayRuns.reduce(
        (a, r) => { const x = countsOf(r); return { passed: a.passed + x.passed, failed: a.failed + x.failed }; },
        { passed: 0, failed: 0 },
      );
      return { d, key, runs: dayRuns, ...c, outside: d.month() !== cursor.month() };
    });
  }, [cursor, byDay]);

  const monthRuns = cells.filter(c => !c.outside).flatMap(c => c.runs);
  const monthTotals = monthRuns.reduce(
    (a, r) => { const x = countsOf(r); return { passed: a.passed + x.passed, failed: a.failed + x.failed }; },
    { passed: 0, failed: 0 },
  );
  const monthShare = shareOf(monthTotals.passed, monthTotals.failed);
  /** Years the picker offers — whatever ran, plus this year and wherever the cursor sits. */
  const years = useMemo(() => {
    const counted = new Map<string, number>();
    scoped.forEach(r => {
      const d = dayjs(runDate(r));
      if (d.isValid()) counted.set(d.format("YYYY"), (counted.get(d.format("YYYY")) ?? 0) + 1);
    });
    [dayjs().format("YYYY"), cursor.format("YYYY")].forEach(y => {
      if (!counted.has(y)) counted.set(y, 0);
    });
    return Array.from(counted.entries())
      .map(([year, n]) => ({ year, n }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [scoped, cursor]);

  /**
   * The rail never opens empty: until a day is clicked (or after the month
   * moves away from the clicked one) it reads the month's first run date.
   */
  const firstRunDay = useMemo(() => cells.find(c => !c.outside && c.runs.length)?.key ?? null, [cells]);
  const activeDay = day && cells.some(c => c.key === day && c.runs.length) ? day : firstRunDay;
  const selected = activeDay ? cells.find(c => c.key === activeDay) : null;
  const selectedShare = selected ? shareOf(selected.passed, selected.failed) : null;
  const labelOf = (d: any) => d.format("D MMM YYYY");

  const pick = (cell: { key: string; d: any; runs: any[]; outside: boolean }) => {
    setDay(cell.key);
    if (cell.outside) setCursor(cell.d.startOf("month"));
  };

  return (
    <section className="cal">
      <div className="cal__head">
        <div>
          <div className="cal__title"><CalendarDays size={14} />Run calendar</div>
          <div className="cal__sub">
            <b>{monthRuns.length}</b> run{monthRuns.length === 1 ? "" : "s"} in {cursor.format("MMMM YYYY")} ·{" "}
            <b>{monthTotals.passed}</b> passed{monthShare && <> ({monthShare.pass}%)</>},{" "}
            <b>{monthTotals.failed}</b> failed{monthShare && <> ({monthShare.fail}%)</>}
          </div>
        </div>

        <div className="cal__tools">
          <SearchableDropdown
            value={suiteId}
            onChange={(v: any) => setSuiteId(v || "all")}
            options={[
              { value: "all", label: "All suites", meta: `${runs.length} run${runs.length === 1 ? "" : "s"}` },
              ...options.map(o => ({
                value: o.id,
                label: o.name,
                meta: `${o.n} run${o.n === 1 ? "" : "s"}`,
                disabled: o.n === 0,
              })),
            ]}
            searchPlaceholder="Search suites"
            itemNoun="suites"
            hideAvatar
            allowClear={false}
            width={280}
            style={{ width: 230 }}
          />
          <div className="cal__nav">
            <button type="button" onClick={() => setCursor(c => c.subtract(1, "month"))} title="Previous month">
              <ChevronLeft size={14} />
            </button>
            <span>{cursor.format("MMMM")}</span>
            <button type="button" onClick={() => setCursor(c => c.add(1, "month"))} title="Next month">
              <ChevronRight size={14} />
            </button>
          </div>
          <SearchableDropdown
            value={cursor.format("YYYY")}
            onChange={(v: any) => v && setCursor(c => c.year(Number(v)).startOf("month"))}
            options={years.map(y => ({
              value: y.year,
              label: y.year,
              meta: `${y.n} run${y.n === 1 ? "" : "s"}`,
            }))}
            searchPlaceholder="Search year"
            itemNoun="years"
            hideAvatar
            allowClear={false}
            width={180}
            style={{ width: 116 }}
          />
          <button
            type="button"
            className="cal__today"
            onClick={() => setCursor(dayjs().startOf("month"))}
          >
            Today
          </button>
        </div>
      </div>

      <div className="cal__body">
        <div className="cal__grid">
          {WEEKDAYS.map(w => <div key={w} className="cal__wd">{w}</div>)}
          {cells.map(c => {
            const isToday = c.d.isSame(dayjs(), "day");
            const share = shareOf(c.passed, c.failed);
            const picked = activeDay === c.key;
            return (
              <button
                key={c.key}
                type="button"
                className={`cal__cell${c.outside ? " is-outside" : ""}${c.runs.length ? " has-runs" : ""}`
                  + `${c.failed > 0 ? " has-fail" : ""}${picked ? " is-picked" : ""}${isToday ? " is-today" : ""}`}
                onClick={() => pick(c)}
                disabled={!c.runs.length}
                title={c.runs.length
                  ? `${labelOf(c.d)} — ${c.runs.length} run${c.runs.length === 1 ? "" : "s"}, `
                    + `${c.passed} passed${share ? ` (${share.pass}%)` : ""}, `
                    + `${c.failed} failed${share ? ` (${share.fail}%)` : ""}`
                  : labelOf(c.d)}
              >
                <span className="cal__date">{c.d.date()}</span>
                {c.runs.length > 0 && (
                  <>
                    <span className="cal__bar">
                      <i className="is-pass" style={{ flexGrow: c.passed || 0 }} />
                      <i className="is-fail" style={{ flexGrow: c.failed || 0 }} />
                    </span>
                    <span className="cal__counts">
                      <em className={`is-pass${c.passed === 0 ? " is-zero" : ""}`}>
                        {c.passed}{share && <i>{share.pass}%</i>}
                      </em>
                      <em className={`is-fail${c.failed === 0 ? " is-zero" : ""}`}>
                        {c.failed}{share && <i>{share.fail}%</i>}
                      </em>
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <aside className="cal__side">
          {!selected || !selected.runs.length ? (
            <div className="cal__side-empty">
              <CalendarDays size={18} />
              <div>Pick a day with runs to list what executed on it.</div>
            </div>
          ) : (
            <>
              <div className="cal__side-head">
                <div className="cal__side-title">{selected.d.format("dddd, D MMM YYYY")}</div>
                <div className="cal__side-sub">
                  {selected.runs.length} run{selected.runs.length === 1 ? "" : "s"} ·{" "}
                  {selected.passed} passed{selectedShare && ` (${selectedShare.pass}%)`},{" "}
                  {selected.failed} failed{selectedShare && ` (${selectedShare.fail}%)`}
                </div>
              </div>
              <ul className="cal__runs">
                {chronological(selected.runs).map((r: any) => {
                  const c = countsOf(r);
                  const rate = rateOf(r);
                  const sh = shareOf(c.passed, c.failed);
                  const suite = suites.find(su => String(su.id) === String(r.suite_id));
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="cal__run"
                        onClick={() => router.push(`/qa-workspace/test-runs/${r.id}`)}
                        title="Open this run"
                      >
                        <span className="cal__run-top">
                          <span className="cal__run-name">{r.run_name || "Untitled run"}</span>
                          {rate !== null && (
                            <span className={`cal__run-rate${rate < 80 ? " is-low" : ""}`}>{rate}%</span>
                          )}
                        </span>
                        <span className="cal__run-meta">
                          {[suite?.suite_name, fmtDateTime(runDate(r))].filter(Boolean).join(" · ")}
                        </span>
                        <span className="cal__run-counts">
                          <em className="is-pass">{c.passed} passed{sh && ` · ${sh.pass}%`}</em>
                          <em className="is-fail">{c.failed} failed{sh && ` · ${sh.fail}%`}</em>
                          {c.blocked > 0 && <em>{c.blocked} blocked</em>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

/**
 * One case's result on one run. The matrix draws the square from `status`
 * alone, but expanding a case reads the rest — when it was executed, what the
 * tester wrote, and what the case itself is classified as.
 */
interface ResultCell {
  caseKey: string;
  ref?: string;
  name: string;
  status: string;
  bugLogged: boolean;
  bugNumber?: string | null;
  executedAt?: string | null;
  notes?: string | null;
  priority?: string | null;
  severity?: string | null;
  testType?: string | null;
}

type Shape = "flaky" | "regressed" | "failing" | "fixed";

const SHAPES: Record<Shape, { label: string; hint: string; rank: number }> = {
  flaky:     { label: "Flaky",     hint: "Passes and fails alternate — suspect the test, not only the build", rank: 0 },
  regressed: { label: "Regressed", hint: "Passed before, fails on the latest run", rank: 1 },
  failing:   { label: "Failing",   hint: "Failing, with no passing run to compare against", rank: 2 },
  fixed:     { label: "Fixed",     hint: "Failed earlier, passing on the latest run", rank: 3 },
};

/** Fail more times than this and the case is flagged, not just listed. */
const CONCERN_FAILS = 2;

const FILTERS = [
  { key: "all", label: "All failed" },
  { key: "concern", label: "Needs attention" },
  { key: "flaky", label: "Flaky" },
  { key: "open", label: "Still failing" },
] as const;
type MatrixFilter = (typeof FILTERS)[number]["key"];

/** Pass / Fail / Blocked / Not executed / not part of that run's suite. */
const cellTone = (status?: string) => {
  if (!status) return "none";
  const v = status.toLowerCase();
  if (v === "pass") return "pass";
  if (v === "fail") return "fail";
  if (v === "blocked") return "block";
  return "idle";
};

/**
 * One failed case's whole history, shown in a drawer beside the list.
 *
 * The list answers "how often"; this answers "when, and what happened" — every
 * run that touched the case, newest first, with the time it was executed, who
 * ran it, the tester's note and whether a bug came out of it. It opens over the
 * page rather than sending the reader somewhere else to find the same answer.
 */
function CaseDrawer({ row, runs, suites, onClose }: {
  /** The case being read, or null while the drawer is closed. */
  row: CaseRow | null;
  /** Every run in scope, oldest first. */
  runs: any[];
  suites: any[];
  onClose: () => void;
}) {
  /** Newest first — the last thing that happened to this case is the thing to read. */
  const events = useMemo(() => {
    if (!row) return [];
    return runs
      .map((run, i) => ({ run, no: i + 1, cell: row.cells.get(String(run.id)) }))
      .filter(e => !!e.cell)
      .reverse();
  }, [row, runs]);

  /** Case attributes live on the result rows; take them from wherever they were recorded. */
  const attrs = useMemo(() => {
    const c = events.map(e => e.cell!);
    return [
      c.find(x => x.priority)?.priority && `${c.find(x => x.priority)!.priority} priority`,
      c.find(x => x.severity)?.severity && `${c.find(x => x.severity)!.severity} severity`,
      c.find(x => x.testType)?.testType,
    ].filter(Boolean).join(" · ");
  }, [events]);

  const passes = events.filter(e => e.cell!.status?.toLowerCase() === "pass").length;

  return (
    <Drawer
      open={!!row}
      onClose={onClose}
      width={560}
      destroyOnClose
      rootClassName="sm-drawer"
      title={row && (
        <div className="sm__dr-title">
          <div className="sm__dr-id">
            {row.ref && <code className="sm__ref">{row.ref}</code>}
            <span className="sm__dr-name">{row.name}</span>
          </div>
          <div className="sm__dr-sub">{attrs || "No priority, severity or type recorded for this case"}</div>
        </div>
      )}
    >
      {row && (
        <>
          <div className="sm__dr-tally">
            <span className="is-fail"><b>{row.fails}</b>failed</span>
            <span className="is-pass"><b>{passes}</b>passed</span>
            <span><b>{events.length}</b>run{events.length === 1 ? "" : "s"}</span>
            {row.unfiled > 0 && <span className="is-fail"><b>{row.unfiled}</b>without a bug</span>}
          </div>

          {row.concern && (
            <div className="sm__dr-warn">
              <AlertTriangle size={14} />
              Failed {row.fails} times — more than {CONCERN_FAILS}, so this is worth a look before the next run.
            </div>
          )}

          <div className="sm__dr-label">Every run that touched this case</div>
          <ol className="sm__events">
            {events.map(({ run, no, cell }) => {
              const c = cell!;
              const suite = suites.find(su => String(su.id) === String(run.suite_id));
              const when = fmtDateTime(c.executedAt) || fmtDateTime(runDate(run));
              return (
                <li key={run.id} className={`sm__ev is-${cellTone(c.status)}`}>
                  <span className="sm__ev-status">{c.status || "Not Executed"}</span>
                  <div className="sm__ev-body">
                    <div className="sm__ev-top">
                      <span className="sm__ev-run">#{no} · {run.run_name || "Untitled run"}</span>
                      {c.bugLogged
                        ? <span className="cm-pill cm-pill--blue">{c.bugNumber || "Bug filed"}</span>
                        : c.status?.toLowerCase() === "fail" && <span className="cm-pill cm-pill--ash">No bug</span>}
                    </div>
                    <div className="sm__ev-meta">
                      <span><Clock size={10} />{when || "no execution time recorded"}</span>
                      {suite?.suite_name && <span><Layers size={10} />{suite.suite_name}</span>}
                      {run.execution_type && <span>{run.execution_type}</span>}
                      {run.created_by_name && <span>by {run.created_by_name}</span>}
                    </div>
                    {c.notes && <div className="sm__ev-note">“{c.notes}”</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Drawer>
  );
}

/** One failed case, read across every run that executed it. */
interface CaseRow {
  key: string;
  ref?: string;
  name: string;
  cells: Map<string, ResultCell>;
  /** How many times it went red — the number the list is ranked by. */
  fails: number;
  /** Runs that produced a pass or a fail; blocked and not-run aren't verdicts. */
  executed: number;
  flips: number;
  shape: Shape;
  unfiled: number;
  concern: boolean;
}

/**
 * Case stability — which cases keep breaking, and how badly.
 *
 * Only cases that have actually failed are listed. A case that passes every
 * time needs nobody's attention, so listing it only buries the ones that do.
 * What's left is ranked by how many times each broke, and anything that failed
 * more than twice is flagged rather than left for the reader to count. Opening
 * a row gives its whole history in a drawer, without leaving the page.
 */
function StabilityMatrix({ suites, runs, results, onNeed }: {
  suites: any[];
  /** Every run this module has, oldest first. */
  runs: any[];
  results: Record<string, ResultCell[]>;
  /** Asks the page to load a run's full result list, once. */
  onNeed: (runId: string) => void;
}) {
  const [suiteId, setSuiteId] = useState<string>("all");
  const [filter, setFilter] = useState<MatrixFilter>("all");
  const [query, setQuery] = useState("");
  /** The case whose history is open in the drawer. */
  const [openCase, setOpenCase] = useState<string | null>(null);

  const options = useMemo(() => {
    const counted = suites.map(su => ({
      id: String(su.id),
      name: su.suite_name || "Untitled suite",
      n: runs.filter(r => String(r.suite_id) === String(su.id)).length,
    }));
    const orphan = runs.filter(r => !suites.some(su => String(su.id) === String(r.suite_id))).length;
    if (orphan) counted.push({ id: "__none", name: "Without a suite", n: orphan });
    return counted.sort((a, b) => b.n - a.n);
  }, [suites, runs]);

  const scoped = useMemo(() => {
    if (suiteId === "all") return runs;
    if (suiteId === "__none") return runs.filter(r => !suites.some(su => String(su.id) === String(r.suite_id)));
    return runs.filter(r => String(r.suite_id) === suiteId);
  }, [runs, suites, suiteId]);

  /** Every run in scope is read, and only once each. */
  useEffect(() => {
    scoped.forEach(r => onNeed(String(r.id)));
  }, [scoped]); // eslint-disable-line react-hooks/exhaustive-deps

  const pending = scoped.filter(r => !results[String(r.id)]).length;
  const ready = scoped.length - pending;

  /** One row per case that has failed at least once, worst first. */
  const rows: CaseRow[] = useMemo(() => {
    const byCase = new Map<string, {
      key: string; ref?: string; name: string;
      cells: Map<string, ResultCell>;
    }>();
    scoped.forEach(run => {
      (results[String(run.id)] ?? []).forEach(cell => {
        if (!byCase.has(cell.caseKey)) {
          byCase.set(cell.caseKey, { key: cell.caseKey, ref: cell.ref, name: cell.name, cells: new Map() });
        }
        byCase.get(cell.caseKey)!.cells.set(String(run.id), cell);
      });
    });

    return Array.from(byCase.values()).map(row => {
      /** The pass/fail sequence in execution order — blocked and not-run don't count as a verdict. */
      const seq = scoped
        .map(run => row.cells.get(String(run.id))?.status?.toLowerCase())
        .filter(v => v === "pass" || v === "fail") as string[];
      const fails = seq.filter(v => v === "fail").length;
      const flips = seq.reduce((a, v, i) => (i > 0 && v !== seq[i - 1] ? a + 1 : a), 0);
      const last = seq[seq.length - 1];
      const unfiled = Array.from(row.cells.values()).filter(c => c.status === "Fail" && !c.bugLogged).length;

      const shape: Shape = flips >= 2 ? "flaky"
        : last === "fail" ? (fails === seq.length ? "failing" : "regressed")
          : "fixed";

      return { ...row, fails, flips, executed: seq.length, shape, unfiled, concern: fails > CONCERN_FAILS };
    })
      /* A case that never went red isn't a stability question — drop it. */
      .filter(row => row.fails > 0)
      .sort((a, b) => {
        if (a.concern !== b.concern) return a.concern ? -1 : 1;
        if (b.fails !== a.fails) return b.fails - a.fails;
        const r = SHAPES[a.shape].rank - SHAPES[b.shape].rank;
        if (r !== 0) return r;
        if (b.flips !== a.flips) return b.flips - a.flips;
        return a.name.localeCompare(b.name);
      });
  }, [scoped, results]);

  const concerning = useMemo(() => rows.filter(r => r.concern).length, [rows]);
  const totalFails = useMemo(() => rows.reduce((a, r) => a + r.fails, 0), [rows]);
  const worst = rows[0]?.fails ?? 1;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      if (filter === "concern" && !r.concern) return false;
      if (filter === "flaky" && r.shape !== "flaky") return false;
      if (filter === "open" && r.shape === "fixed") return false;
      if (q && !`${r.ref ?? ""} ${r.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, filter, query]);

  const active = rows.find(r => r.key === openCase) ?? null;

  return (
    <section className="sm">
      <div className="sm__head">
        <div>
          <div className="sm__title"><Grid3x3 size={14} />Case stability</div>
          <div className="sm__sub">
            {scoped.length === 0
              ? "No run to read yet."
              : <>Across <b>{scoped.length}</b> run{scoped.length === 1 ? "" : "s"} · <b>{rows.length}</b> failed case{rows.length === 1 ? "" : "s"}
                {totalFails > 0 && <> · <b>{totalFails}</b> failure{totalFails === 1 ? "" : "s"}</>}
                {concerning > 0 && <> · <b className="sm__sub-warn">{concerning}</b> need{concerning === 1 ? "s" : ""} attention</>}
                {pending > 0 && <> · reading {ready}/{scoped.length}</>}</>}
          </div>
        </div>

        <div className="sm__tools">
          <SearchableDropdown
            value={suiteId}
            onChange={(v: any) => setSuiteId(v || "all")}
            options={[
              { value: "all", label: "All suites", meta: `${runs.length} run${runs.length === 1 ? "" : "s"}` },
              ...options.map(o => ({
                value: o.id, label: o.name,
                meta: `${o.n} run${o.n === 1 ? "" : "s"}`,
                disabled: o.n === 0,
              })),
            ]}
            searchPlaceholder="Search suites"
            itemNoun="suites"
            hideAvatar
            allowClear={false}
            width={280}
            style={{ width: 216 }}
          />
        </div>
      </div>

      {scoped.length === 0 ? (
        <div className="sm__empty">Nothing has been executed for this suite yet.</div>
      ) : (
        <>
          <div className="sm__filters">
            {FILTERS.map(f => {
              const n = f.key === "all" ? rows.length
                : f.key === "concern" ? concerning
                  : f.key === "flaky" ? rows.filter(r => r.shape === "flaky").length
                    : rows.filter(r => r.shape !== "fixed").length;
              return (
                <button
                  key={f.key}
                  type="button"
                  className={`sm__filter${filter === f.key ? " is-active" : ""}`}
                  onClick={() => setFilter(f.key)}
                  disabled={n === 0 && f.key !== "all"}
                >
                  {f.label}
                  <span className="sm__filter-n">{n}</span>
                </button>
              );
            })}
            <div className="sm__search">
              <Search size={12} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Find a case"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} title="Clear"><X size={12} /></button>
              )}
            </div>
          </div>

          {pending > 0 && rows.length === 0 ? (
            <div className="sm__loading"><ZukvoLoader size="sm" message="Reading run results…" /></div>
          ) : rows.length === 0 ? (
            <div className="sm__empty sm__empty--clean">
              <CheckCircle2 size={16} />
              No case failed across the {scoped.length} run{scoped.length === 1 ? "" : "s"} on record.
            </div>
          ) : shown.length === 0 ? (
            <div className="sm__empty">No failed case matches this filter.</div>
          ) : (
            <ul className="sm__list">
              {shown.map(row => (
                <li key={row.key}>
                  <button
                    type="button"
                    className={`sm__row${row.concern ? " is-concern" : ""}`}
                    onClick={() => setOpenCase(row.key)}
                    title={`${row.name} — see every run that executed it`}
                  >
                    <span className="sm__row-main">
                      <span className="sm__row-top">
                        {row.ref && <code className="sm__ref">{row.ref}</code>}
                        <span className="sm__case-name">{row.name}</span>
                        {row.unfiled > 0 && (
                          <Tooltip title={`${row.unfiled} failure${row.unfiled === 1 ? "" : "s"} with no bug filed`}>
                            <span className="sm__nobug">no bug</span>
                          </Tooltip>
                        )}
                      </span>
                      {/* How much of this case's history is red, against the worst case here. */}
                      <span className="sm__row-track">
                        <i style={{ width: `${(row.fails / worst) * 100}%` }} />
                      </span>
                    </span>

                    <span className="sm__row-side">
                      <Tooltip
                        title={row.concern
                          ? `Failed ${row.fails} times in ${row.executed} run${row.executed === 1 ? "" : "s"} — more than ${CONCERN_FAILS}, worth a look`
                          : `Failed ${row.fails} time${row.fails === 1 ? "" : "s"} in ${row.executed} run${row.executed === 1 ? "" : "s"}`}
                      >
                        <span className={`sm__fails${row.concern ? " is-concern" : ""}`}>
                          {row.concern && <AlertTriangle size={11} />}
                          <b>{row.fails}×</b>
                          <span>failed of {row.executed}</span>
                        </span>
                      </Tooltip>
                      <Tooltip title={SHAPES[row.shape].hint}>
                        <span className={`sm__shape is-${row.shape}`}>{SHAPES[row.shape].label}</span>
                      </Tooltip>
                      <ChevronRight size={14} className="sm__row-chev" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="sm__legend">
            <span className="sm__legend-concern"><AlertTriangle size={11} />More than {CONCERN_FAILS} failures</span>
            <span className="sm__legend-hint">Only cases that have failed · open one for every run it executed in</span>
          </div>
        </>
      )}

      <CaseDrawer row={active} runs={scoped} suites={suites} onClose={() => setOpenCase(null)} />
    </section>
  );
}

/** Runs oldest first, so "the 5th run" means the fifth one executed. */
const chronological = (runs: any[]) =>
  runs.slice().sort((a, b) => dayjs(runDate(a) || 0).valueOf() - dayjs(runDate(b) || 0).valueOf());

interface FailureRow {
  id: string;
  name: string;
  tc_ref_id?: string;
  priority?: string;
  severity?: string;
  test_type?: string;
  notes?: string | null;
  executed_at?: string | null;
  bug_number?: string | null;
  bug_logged?: boolean;
}

function ModuleDetail() {
  useActivitySource({ section: "WORK", module: "QA", page: "CoverageModule" });

  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const { canReadScope, canReadCase, canReadSuite, canReadRun } = usePermission();

  const nodeKey = decodeURIComponent(String(params?.nodeKey ?? ""));
  const projectId = search.get("project") || undefined;
  const hintedName = search.get("name") || "";

  const { projects, loading: loadingProjects } = useUserProjects();
  const { loading, nodes, refetch, project } = useCoverageData(
    projects,
    projectId,
    { canReadScope, canReadCase, canReadSuite, canReadRun },
    !loadingProjects,
  );

  const node: ModuleNode | undefined = useMemo(
    () => nodes.find(n => n.key === nodeKey),
    [nodes, nodeKey],
  );

  const [section, setSection] = useState<SectionKey>("suites");
  const [openRuns, setOpenRuns] = useState<Record<string, boolean>>({});
  const [failures, setFailures] = useState<Record<string, FailureRow[]>>({});
  const [loadingRun, setLoadingRun] = useState<Record<string, boolean>>({});
  /** Every case result of a run — what the stability matrix reads, unlike the failures-only list. */
  const [runResults, setRunResults] = useState<Record<string, ResultCell[]>>({});
  /** Guards against the matrix asking for the same run twice before state settles. */
  const resultsAsked = useRef<Set<string>>(new Set());
  const resultQueue = useRef<string[]>([]);
  const resultsInFlight = useRef(0);

  /** Failing runs, newest first — the ones worth pulling detail for. */
  const failingRuns = useMemo(
    () => (node?.runs ?? [])
      .filter((r: any) => Number(r.failed_count || 0) > 0)
      .sort((a: any, b: any) => dayjs(runDate(b) || 0).valueOf() - dayjs(runDate(a) || 0).valueOf()),
    [node],
  );

  /**
   * The whole result list of a run, cached per run.
   *
   * Case stability reads every run the module has, so a busy module would fire
   * a hundred of these at once. They queue instead, a few at a time, and the
   * panel fills in as they land.
   */
  const readRun = async (runId: string) => {
    try {
      const res: any = await apiClient.get(`/api/v2/qa/runs/${runId}`, { params: { pageSize: 500 } });
      const rows: any[] = res?.data?.data?.results ?? [];
      setRunResults(prev => ({
        ...prev,
        [runId]: rows.map(r => ({
          caseKey: String(r.test_case_id ?? r.tc_ref_id ?? r.id),
          ref: r.tc_ref_id,
          name: r.name || "Untitled case",
          status: String(r.status || "Not Executed"),
          bugLogged: !!r.bug_logged,
          bugNumber: r.bug_number ?? null,
          executedAt: r.executed_at ?? null,
          notes: r.notes ?? null,
          priority: r.priority ?? null,
          severity: r.severity ?? null,
          testType: r.test_type ?? null,
        })),
      }));
    } catch {
      setRunResults(prev => ({ ...prev, [runId]: [] }));
    }
  };

  const fetchRunResults = (runId: string) => {
    if (resultsAsked.current.has(runId)) return;
    resultsAsked.current.add(runId);
    resultQueue.current.push(runId);
    drainResultQueue();
  };

  /** Keeps at most RESULT_CONCURRENCY reads in flight, starting the next as each finishes. */
  const drainResultQueue = () => {
    while (resultsInFlight.current < RESULT_CONCURRENCY && resultQueue.current.length) {
      const next = resultQueue.current.shift()!;
      resultsInFlight.current += 1;
      readRun(next).finally(() => {
        resultsInFlight.current -= 1;
        drainResultQueue();
      });
    }
  };

  const fetchFailures = async (runId: string) => {
    if (failures[runId] || loadingRun[runId]) return;
    setLoadingRun(prev => ({ ...prev, [runId]: true }));
    try {
      const res: any = await apiClient.get(`/api/v2/qa/runs/${runId}`, {
        params: { status: "Fail", pageSize: 200 },
      });
      const rows: FailureRow[] = res?.data?.data?.results ?? [];
      setFailures(prev => ({ ...prev, [runId]: rows }));
    } catch {
      setFailures(prev => ({ ...prev, [runId]: [] }));
    } finally {
      setLoadingRun(prev => ({ ...prev, [runId]: false }));
    }
  };

  // Pull the recent failures up front so the hotspot panel has something to say.
  useEffect(() => {
    failingRuns.slice(0, EAGER_FAILURE_RUNS).forEach((r: any) => fetchFailures(String(r.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failingRuns]);

  /** Cases that went red more than once — the module's real problem areas. */
  const hotspots = useMemo(() => {
    const byCase = new Map<string, { name: string; ref?: string; runs: { run: any; row: FailureRow }[] }>();
    (node?.runs ?? []).forEach((run: any) => {
      (failures[String(run.id)] ?? []).forEach(row => {
        const key = row.tc_ref_id || row.name || row.id;
        if (!byCase.has(key)) byCase.set(key, { name: row.name, ref: row.tc_ref_id, runs: [] });
        byCase.get(key)!.runs.push({ run, row });
      });
    });
    return Array.from(byCase.values()).sort((a, b) => b.runs.length - a.runs.length);
  }, [node, failures]);

  const runsBySuite = useMemo(() => {
    const map = new Map<string, any[]>();
    (node?.runs ?? []).forEach((r: any) => {
      const key = String(r.suite_id ?? "__none");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [node]);

  /** Every run this module has, oldest first — "#5" means the fifth executed. */
  const allRuns = useMemo(() => chronological(node?.runs ?? []), [node]);

  const name = node?.name || hintedName || "Module";
  const canRead = canReadScope || canReadCase || canReadSuite || canReadRun;
  if (!canRead) return null;

  const toggleRun = (runId: string) => {
    setOpenRuns(prev => ({ ...prev, [runId]: !prev[runId] }));
    fetchFailures(runId);
  };

  const backToMap = () => router.push(
    `/qa-workspace/coverage-map${projectId ? `?project=${encodeURIComponent(projectId)}` : ""}`,
  );

  /* ── Rows ─────────────────────────────────────────────────────────────── */

  const renderFailureList = (runId: string) => {
    const rows = failures[runId];
    if (loadingRun[runId] && !rows) {
      return <div className="md-fail__loading"><ZukvoLoader size="sm" message="Loading failures…" /></div>;
    }
    if (!rows?.length) {
      return <div className="md-fail__none">No failing cases recorded on this run.</div>;
    }
    return (
      <div className="md-fail">
        <div className="md-fail__head">
          <Flame size={12} />
          {rows.length} failed case{rows.length === 1 ? "" : "s"}
        </div>
        {rows.map(row => (
          <div key={row.id} className="md-failrow">
            <span className="md-failrow__dot" />
            <div className="md-failrow__body">
              <div className="md-failrow__title">
                {row.tc_ref_id && <code className="md-ref">{row.tc_ref_id}</code>}
                {row.name}
              </div>
              <div className="md-failrow__meta">
                {[
                  row.severity && `Severity ${row.severity}`,
                  row.priority && `${row.priority} priority`,
                  row.test_type,
                  fmtDateTime(row.executed_at) && `failed ${fmtDateTime(row.executed_at)}`,
                ].filter(Boolean).join(" · ")}
              </div>
              {row.notes && <div className="md-failrow__note">“{row.notes}”</div>}
            </div>
            {row.bug_logged ? (
              <Tooltip title="A bug is already filed for this failure">
                <span className="cm-pill cm-pill--blue">{row.bug_number || "Bug filed"}</span>
              </Tooltip>
            ) : (
              <span className="cm-pill cm-pill--ash">No bug</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderRun = (run: any, index: number, total: number) => {
    const id = String(run.id);
    const isOpen = !!openRuns[id];
    const failed = Number(run.failed_count || 0);
    const passed = Number(run.passed_count || 0);
    const blocked = Number(run.blocked_count || 0);
    const notRun = Number(run.not_executed_count || 0);
    return (
      <div key={id} className={`md-run${isOpen ? " is-open" : ""}${failed > 0 ? " has-fail" : ""}`}>
        <button className="md-run__head" onClick={() => toggleRun(id)}>
          <span className="md-run__chev">{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
          <span className="md-run__ord" title={`Run ${index + 1} of ${total}`}>#{index + 1}</span>
          <span className="md-run__id">
            <span className="md-run__name">{run.run_name || "Untitled run"}</span>
            <span className="md-run__meta">
              {[
                fmtDateTime(runDate(run)),
                run.created_by_name && `by ${run.created_by_name}`,
                run.scope_name && `scope: ${run.scope_name}`,
              ].filter(Boolean).join(" · ")}
            </span>
          </span>
          <span className="md-run__bar">
            <ResultBar passed={passed} failed={failed} blocked={blocked} notExecuted={notRun} />
          </span>
          <span className="md-run__counts">
            <span className="md-count is-pass">{passed}</span>
            <span className={`md-count${failed > 0 ? " is-fail" : ""}`}>{failed}</span>
            <span className="md-count">{notRun}</span>
          </span>
          <span
            className="md-run__go"
            role="link"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); router.push(`/qa-workspace/test-runs/${id}`); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); router.push(`/qa-workspace/test-runs/${id}`); } }}
          >
            <ArrowUpRight size={14} />
          </span>
        </button>
        {isOpen && <div className="md-run__body">{renderFailureList(id)}</div>}
      </div>
    );
  };

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="md-shell">
        <div className="md-topbar">
          <div className="md-topbar__left">
            <Button className="md-back" type="text" icon={<ArrowLeft size={16} />} onClick={backToMap} />
            <span className="md-crumb">Coverage Map</span>
            <span className="md-sep">/</span>
            <span className={`md-av${node?.unassigned || node?.adhoc ? " is-soft" : ""}`}>{initialsOf(name)}</span>
            <h1 className="md-title">{name}</h1>
            {node?.adhoc && <span className="cm-tag">ad hoc</span>}
            {node?.unassigned && <span className="cm-tag">no module</span>}
            <span className="md-sep">·</span>
            <span className="md-project"><Boxes size={12} />{project?.label || "All projects"}</span>
          </div>
          <div className="md-topbar__right">
            <span className="md-updated"><CalendarDays size={12} />{fmtAgo(node?.lastActivity)}</span>
            <Button
              type="default"
              icon={<RotateCw size={14} className={loading ? "animate-spin" : ""} />}
              onClick={refetch}
              disabled={loading}
              title="Refresh"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0 }}
            />
          </div>
        </div>

        <div className="md-scroll">
          <ZukvoLoadingOverlay loading={loading} message="Loading module detail…" minHeight={loading ? 400 : undefined}>
            {!loading && !node ? (
              <div className="cm-empty">
                <BugOutlined className="cm-empty__ic" style={{ fontSize: 26 }} />
                <p className="cm-empty__title">Nothing to show for “{name}”</p>
                <p className="cm-empty__desc">
                  This module has no records in {project?.label || "any project"} — it may belong to another project.
                </p>
                <Button size="small" onClick={backToMap}>Back to the map</Button>
              </div>
            ) : node ? (
              <>
                {/* The QA pipeline for this module, stage by stage — planned,
                    written, assembled, executed. Each stage jumps to its list. */}
                <nav className="md-flow">
                  {([
                    { key: "scopes", icon: Target, n: node.scopes.length, label: "Scopes", hint: "planned this module", tab: "scopes" },
                    { key: "scenarios", icon: ClipboardList, n: node.cases.length, label: "Scenarios", hint: "written for it", tab: "scenarios" },
                    { key: "cases", icon: FileText, n: node.childCases, label: "Cases", hint: "beneath those scenarios", tab: "scenarios" },
                    { key: "suites", icon: Layers, n: node.suites.length, label: "Suites", hint: "assembled to execute", tab: "suites" },
                    { key: "runs", icon: PlayCircle, n: node.runs.length, label: "Runs", hint: "executed so far", tab: "suites" },
                  ] as const).map((step, i, arr) => {
                    const Icon = step.icon;
                    return (
                      <React.Fragment key={step.key}>
                        <button
                          type="button"
                          className={`md-step${step.n === 0 ? " is-zero" : ""}`}
                          onClick={() => setSection(step.tab as SectionKey)}
                          title={`${step.n} ${step.label.toLowerCase()} ${step.hint}`}
                        >
                          <Icon size={13} className="md-step__ic" />
                          <span className="md-step__n">{step.n}</span>
                          <span className="md-step__label">{step.label}</span>
                        </button>
                        {i < arr.length - 1 && <span className="md-flow__sep" />}
                      </React.Fragment>
                    );
                  })}
                </nav>

                {/* What the history says, before any of the raw lists. */}
                <HistoryInsights suites={node.suites} runs={allRuns} hotspots={hotspots} />

                {allRuns.length > 0 && (
                  <RunCalendar suites={node.suites} runs={allRuns} />
                )}

                {allRuns.length > 0 && (
                  <StabilityMatrix
                    suites={node.suites}
                    runs={allRuns}
                    results={runResults}
                    onNeed={fetchRunResults}
                  />
                )}

                <div className="md-tabs">
                  {SECTIONS.map(sct => {
                    const Icon = sct.icon;
                    const count = sct.key === "suites" ? node.suites.length
                      : sct.key === "failures" ? hotspots.length
                        : sct.key === "scopes" ? node.scopes.length
                          : node.cases.length;
                    return (
                      <button
                        key={sct.key}
                        className={`md-tab${section === sct.key ? " is-active" : ""}`}
                        onClick={() => setSection(sct.key)}
                      >
                        <Icon size={14} />
                        {sct.label}
                        <span className="md-tab__n">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ── Suites, each with its whole run history ───────────── */}
                {section === "suites" && (
                  <div className="md-list">
                    {node.suites.length === 0 && (
                      <div className="cm-col__empty">No suite has been assembled for this module.</div>
                    )}
                    {node.suites.map((suite: any) => {
                      const suiteRuns = chronological(runsBySuite.get(String(suite.id)) ?? []);
                      const failedRuns = suiteRuns.filter((r: any) => Number(r.failed_count || 0) > 0).length;
                      return (
                        <section key={suite.id} className="md-card">
                          <header className="md-card__head">
                            <span className="md-card__ic"><Layers size={14} /></span>
                            <div className="md-card__id">
                              <div className="md-card__title">{suite.suite_name || "Untitled suite"}</div>
                              <div className="md-card__meta">
                                {[
                                  `${Number(suite.case_count || 0)} cases`,
                                  `${suiteRuns.length} run${suiteRuns.length === 1 ? "" : "s"}`,
                                  failedRuns ? `${failedRuns} with failures` : null,
                                  suite.parent_title,
                                  suite.created_by_name && `by ${suite.created_by_name}`,
                                  fmtDate(suite.created_at) && `added ${fmtDate(suite.created_at)}`,
                                ].filter(Boolean).join(" · ")}
                              </div>
                            </div>
                            <Button
                              size="small"
                              onClick={() => router.push(`/qa-workspace/test-suites/${suite.id}`)}
                            >
                              Open suite
                            </Button>
                          </header>

                          {suiteRuns.length === 0 ? (
                            <div className="md-card__empty">Nothing has been executed against this suite yet.</div>
                          ) : (
                            <div className="md-runs">
                              {suiteRuns.map((run, i) => renderRun(run, i, suiteRuns.length))}
                            </div>
                          )}
                        </section>
                      );
                    })}

                    {/* Runs whose suite sits outside this module's suite list */}
                    {(runsBySuite.get("__none")?.length ?? 0) > 0 && (
                      <section className="md-card">
                        <header className="md-card__head">
                          <span className="md-card__ic"><PlayCircle size={14} /></span>
                          <div className="md-card__id">
                            <div className="md-card__title">Runs without a suite</div>
                            <div className="md-card__meta">Executed here but no longer linked to a suite</div>
                          </div>
                        </header>
                        <div className="md-runs">
                          {chronological(runsBySuite.get("__none")!).map((run, i, arr) => renderRun(run, i, arr.length))}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {/* ── Failure hotspots across every run ─────────────────── */}
                {section === "failures" && (
                  <div className="md-list">
                    {failingRuns.length === 0 ? (
                      <div className="cm-col__empty">No run in this module has recorded a failure.</div>
                    ) : (
                      <>
                        <div className="md-note">
                          <AlertTriangle size={13} />
                          <span>
                            Failures from the {Math.min(failingRuns.length, EAGER_FAILURE_RUNS)} most recent failing
                            run{failingRuns.length === 1 ? "" : "s"} are loaded.
                            {failingRuns.length > EAGER_FAILURE_RUNS
                              ? ` Open an older run under Suites & runs to add it here.`
                              : ""}
                          </span>
                        </div>

                        {hotspots.length === 0 ? (
                          <div className="md-card__empty">Loading failure detail…</div>
                        ) : hotspots.map(spot => (
                          <section key={spot.ref || spot.name} className="md-card">
                            <header className="md-card__head">
                              <span className="md-card__ic is-fail"><Flame size={14} /></span>
                              <div className="md-card__id">
                                <div className="md-card__title">
                                  {spot.ref && <code className="md-ref">{spot.ref}</code>}
                                  {spot.name}
                                </div>
                                <div className="md-card__meta">
                                  failed in {spot.runs.length} run{spot.runs.length === 1 ? "" : "s"}
                                </div>
                              </div>
                              {spot.runs.length > 1 && <span className="cm-pill cm-pill--red">recurring</span>}
                            </header>
                            <div className="md-spot">
                              {spot.runs
                                .slice()
                                .sort((a, b) => dayjs(runDate(b.run) || 0).valueOf() - dayjs(runDate(a.run) || 0).valueOf())
                                .map(({ run, row }) => (
                                  <button
                                    key={`${run.id}-${row.id}`}
                                    className="md-spotrow"
                                    onClick={() => router.push(`/qa-workspace/test-runs/${run.id}`)}
                                  >
                                    <span className="md-spotrow__run">{run.run_name || "Untitled run"}</span>
                                    <span className="md-spotrow__meta">
                                      {[
                                        fmtDateTime(row.executed_at || runDate(run)),
                                        run.created_by_name && `by ${run.created_by_name}`,
                                      ].filter(Boolean).join(" · ")}
                                    </span>
                                    {row.notes && <span className="md-spotrow__note">“{row.notes}”</span>}
                                    <ArrowUpRight size={13} className="md-spotrow__go" />
                                  </button>
                                ))}
                            </div>
                          </section>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* ── Scopes that planned this module ───────────────────── */}
                {section === "scopes" && (
                  <div className="md-list">
                    {node.scopes.length === 0 && (
                      <div className="cm-col__empty">No scope has planned this module.</div>
                    )}
                    {node.scopes.map((sc: any) => (
                      <button
                        key={sc.id}
                        className="md-card md-card--row"
                        onClick={() => router.push(`/qa-workspace/test-scope/${sc.id}`)}
                      >
                        <span className="md-card__ic"><Target size={14} /></span>
                        <div className="md-card__id">
                          <div className="md-card__title">{sc.name || "Untitled scope"}</div>
                          <div className="md-card__meta">
                            {[
                              sc.type,
                              sc.priority && `${sc.priority} priority`,
                              sc.qa_owner,
                              fmtDate(sc.created_at) && `created ${fmtDate(sc.created_at)}`,
                              sc.start_date && sc.end_date
                                ? `${fmtDate(sc.start_date)} → ${fmtDate(sc.end_date)}`
                                : sc.end_date ? `due ${fmtDate(sc.end_date)}` : null,
                            ].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        {sc.status && <span className={`cm-pill cm-pill--${statusTone(sc.status)}`}>{sc.status}</span>}
                        <ArrowUpRight size={13} className="md-card__go" />
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Scenarios written for it ──────────────────────────── */}
                {section === "scenarios" && (
                  <div className="md-list">
                    {node.cases.length === 0 && (
                      <div className="cm-col__empty">No scenario has been written for this module.</div>
                    )}
                    {node.cases.map((c: any) => (
                      <button
                        key={c.id}
                        className="md-card md-card--row"
                        onClick={() => router.push(`/qa-workspace/test-cases/${c.id}`)}
                      >
                        <span className="md-card__ic"><FileText size={14} /></span>
                        <div className="md-card__id">
                          <div className="md-card__title">{c.title || "Untitled scenario"}</div>
                          <div className="md-card__meta">
                            {[
                              `${Number(c.child_count || 0)} module cases`,
                              c.feature,
                              c.automation,
                              (c.owner_name || c.qa_owner) && `owner ${c.owner_name || c.qa_owner}`,
                              fmtDate(c.created_at) && `added ${fmtDate(c.created_at)}`,
                            ].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        {c.status && <span className={`cm-pill cm-pill--${statusTone(c.status)}`}>{c.status}</span>}
                        <ArrowUpRight size={13} className="md-card__go" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </ZukvoLoadingOverlay>
        </div>
      </div>
    </MainLayout>
  );
}

export default function CoverageModulePage() {
  return (
    <Suspense fallback={<ZukvoLoader size="lg" fullscreen message="Loading module…" />}>
      <ModuleDetail />
    </Suspense>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Styles — a full-width reading surface rather than the list shell, plus the
 * KPI / pill vocabulary the map already uses.
 * ──────────────────────────────────────────────────────────────────────────── */
const STYLES = `
.md-shell { display: flex; flex-direction: column; height: calc(100vh - 64px); overflow: hidden; background: transparent; }
.md-topbar {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 56px; padding: 10px 20px; border-bottom: 1px solid var(--border-slate-200);
}
.md-topbar__left { display: flex; align-items: center; gap: 9px; min-width: 0; flex-wrap: wrap; }
.md-topbar__right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.md-back { width: 30px; height: 30px; border-radius: 8px !important; color: var(--text-slate-500); }
.md-crumb {
  font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--text-slate-400); white-space: nowrap;
}
.md-sep { color: var(--border-slate-300, #cbd5e1); }
.md-av {
  width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10.5px; font-weight: 800;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.18);
}
.md-av.is-soft { color: var(--text-slate-500); background: var(--bg-slate-50); border-color: var(--border-slate-200); }
.md-title { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: -.02em; color: var(--text-slate-900); }
.md-project, .md-updated {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 600; color: var(--text-slate-500);
}
.md-scroll { flex: 1; overflow-y: auto; padding: 16px 20px 32px; }

/* ── Pipeline strip: one line, the module's QA funnel end to end ───────── */
.md-flow {
  display: flex; align-items: center; flex-wrap: wrap;
  padding: 3px 4px; margin-bottom: 12px;
  border: 1px solid var(--border-slate-200); border-radius: 10px; background: var(--bg-pure-white);
}
.md-step {
  display: inline-flex; align-items: center; gap: 7px;
  height: 32px; padding: 0 12px; border: none; border-radius: 7px;
  background: transparent; cursor: pointer; white-space: nowrap;
  transition: background .15s ease, color .15s ease;
}
.md-step:hover { background: rgba(59,130,246,.06); }
.md-step__ic { color: #2563eb; flex-shrink: 0; }
.md-step__n {
  font-size: 15px; font-weight: 800; letter-spacing: -.02em; line-height: 1;
  color: var(--text-slate-900); font-variant-numeric: tabular-nums;
}
.md-step__label { font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); }
.md-step.is-zero .md-step__ic { color: var(--text-slate-300); }
.md-step.is-zero .md-step__n { color: var(--text-slate-300); }
.md-flow__sep { width: 1px; height: 16px; background: var(--border-slate-100); flex-shrink: 0; }

@media (max-width: 720px) {
  .md-step { padding: 0 9px; }
  .md-flow__sep { display: none; }
}

/* ── Insights: the read-out, before any raw list ───────────────────────── */
.mx-insights {
  border: 1px solid var(--border-slate-200); border-radius: 14px;
  background: var(--bg-pure-white); overflow: hidden; margin-bottom: 12px;
}
.mx-insights__head {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px; flex-wrap: wrap;
  border-bottom: 1px solid var(--border-slate-100);
  background: linear-gradient(180deg, rgba(59,130,246,.05), transparent);
}
.mx-insights__tools { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.mx-insights__ic {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.18);
}
.mx-insights__title { font-size: 13.5px; font-weight: 750; letter-spacing: -.01em; color: var(--text-slate-900); }
.mx-insights__sub { margin-top: 2px; font-size: 11.5px; color: var(--text-slate-400); }
.mx-insights__sub b { font-weight: 750; color: var(--text-slate-600); }
.mx-insights__list { margin: 0; padding: 6px; list-style: none; display: flex; flex-direction: column; gap: 2px; }

.mx-ins {
  position: relative; display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px; border-radius: 10px; border: 1px solid transparent;
  transition: background .15s ease, border-color .15s ease;
}
.mx-ins:hover { background: var(--bg-slate-50); border-color: var(--border-slate-100); }
.mx-ins__n {
  flex-shrink: 0; width: 20px; height: 20px; border-radius: 6px; margin-top: 1px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10.5px; font-weight: 800; font-variant-numeric: tabular-nums;
  color: var(--text-slate-500); background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
}
.mx-ins__ic {
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 7px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--text-slate-500); background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.mx-ins__body { min-width: 0; flex: 1; }
.mx-ins__text { font-size: 13px; line-height: 1.5; color: var(--text-slate-700); }
.mx-ins__text b { font-weight: 750; color: var(--text-slate-900); }
.mx-ins__detail { margin-top: 3px; font-size: 11.5px; line-height: 1.45; color: var(--text-slate-400); }

.mx-ins--good .mx-ins__ic { color: #047857; background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.2); }
.mx-ins--good .mx-ins__n { color: #047857; }
.mx-ins--warn .mx-ins__ic { color: #b45309; background: rgba(245,158,11,.1); border-color: rgba(245,158,11,.2); }
.mx-ins--bad .mx-ins__ic { color: #dc2626; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.2); }
.mx-ins--bad .mx-ins__n { color: #dc2626; border-color: rgba(239,68,68,.25); }
.mx-ins--bad .mx-ins__text b { color: #b91c1c; }
.mx-ins--info .mx-ins__ic { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.18); }

/* ── Run calendar ──────────────────────────────────────────────────────── */
.cal {
  border: 1px solid var(--border-slate-200); border-radius: 14px;
  background: var(--bg-pure-white); padding: 14px 16px 16px; margin-bottom: 16px;
}
.cal__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.cal__title {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 750; letter-spacing: -.01em; color: var(--text-slate-900);
}
.cal__title svg { color: #2563eb; }
.cal__sub { margin-top: 2px; font-size: 11px; color: var(--text-slate-400); }
.cal__tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cal__nav {
  display: inline-flex; align-items: center; gap: 2px; padding: 2px;
  border: 1px solid var(--border-slate-200); border-radius: 9px; background: var(--bg-slate-50);
}
.cal__nav span {
  min-width: 82px; text-align: center; font-size: 11.5px; font-weight: 700; color: var(--text-slate-700);
}
.cal__nav button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border: none; border-radius: 7px; background: transparent; cursor: pointer;
  color: var(--text-slate-500); transition: background .15s ease, color .15s ease;
}
.cal__nav button:hover { background: var(--bg-pure-white); color: #2563eb; }
.cal__today {
  height: 28px; padding: 0 12px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
  font-size: 11.5px; font-weight: 650; color: var(--text-slate-600);
}
.cal__today:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }

.cal__body { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 12px; margin-top: 14px; align-items: stretch; }
.cal__grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
.cal__wd {
  padding: 2px 0 4px; text-align: center;
  font-size: 10px; font-weight: 750; letter-spacing: .04em; text-transform: uppercase; color: var(--text-slate-400);
}
.cal__cell {
  display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  min-height: 78px; padding: 6px 7px; cursor: pointer; text-align: left;
  border: 1px solid var(--border-slate-100); border-radius: 10px; background: var(--bg-pure-white);
  transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.cal__cell:disabled { cursor: default; }
.cal__cell.is-outside { opacity: .4; }
.cal__date { font-size: 11.5px; font-weight: 700; color: var(--text-slate-500); font-variant-numeric: tabular-nums; }
.cal__cell.has-runs { background: rgba(16,185,129,.06); border-color: rgba(16,185,129,.22); }
.cal__cell.has-runs .cal__date { color: var(--text-slate-900); }
.cal__cell.has-fail { background: rgba(239,68,68,.06); border-color: rgba(239,68,68,.22); }
.cal__cell.has-runs:hover { box-shadow: 0 1px 3px rgba(15,23,42,.08); }
.cal__cell.is-today .cal__date { color: #2563eb; }
.cal__cell.is-today { border-color: rgba(59,130,246,.35); }
.cal__cell.is-picked { border-color: rgba(59,130,246,.55); box-shadow: 0 0 0 2px rgba(59,130,246,.14); }
/* Under the line: passed in green on the left, failed in red on the right. */
.cal__counts { display: flex; align-items: flex-start; justify-content: space-between; width: 100%; gap: 8px; }
.cal__counts em {
  font-style: normal; font-size: 13px; font-weight: 800; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.cal__counts em { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; }
/* The share under the count — smaller and lighter, so the number still leads. */
.cal__counts em i { font-style: normal; font-size: 9.5px; font-weight: 700; line-height: 1; opacity: .7; }
.cal__counts em.is-fail { align-items: flex-end; }
.cal__counts em.is-pass { color: #059669; }
.cal__counts em.is-fail { color: #dc2626; }
.cal__counts em.is-zero { opacity: .35; }
/* The split line under them: how much of that day was green versus red. */
.cal__bar { display: flex; width: 100%; height: 4px; border-radius: 999px; overflow: hidden; background: var(--bg-slate-50); }
.cal__bar i { display: block; min-width: 0; }
.cal__bar i.is-pass { background: #10b981; }
.cal__bar i.is-fail { background: #ef4444; }

.cal__side {
  border: 1px solid var(--border-slate-200); border-radius: 12px; background: var(--bg-slate-50);
  padding: 12px; display: flex; flex-direction: column; gap: 10px; min-width: 0;
}
.cal__side-empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  text-align: center; font-size: 11.5px; color: var(--text-slate-400);
}
.cal__side-empty svg { color: var(--text-slate-300); }
.cal__side-head { flex-shrink: 0; }
.cal__side-title { font-size: 12px; font-weight: 750; color: var(--text-slate-900); }
.cal__side-sub { margin-top: 2px; font-size: 11px; color: var(--text-slate-400); }
.cal__runs {
  list-style: none; margin: 0; padding: 0 2px 0 0;
  display: flex; flex-direction: column; gap: 6px;
  flex: 1; min-height: 0; overflow-y: auto;
}
.cal__runs::-webkit-scrollbar { width: 5px; }
.cal__runs::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 999px; }
.cal__run {
  width: 100%; display: flex; flex-direction: column; gap: 3px; text-align: left; cursor: pointer;
  padding: 8px 9px; border: 1px solid var(--border-slate-200); border-radius: 10px; background: var(--bg-pure-white);
  transition: border-color .15s ease, box-shadow .15s ease;
}
.cal__run:hover { border-color: rgba(59,130,246,.4); box-shadow: 0 1px 3px rgba(15,23,42,.06); }
.cal__run-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cal__run-name {
  font-size: 11.5px; font-weight: 700; color: var(--text-slate-900);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cal__run-rate { font-size: 10.5px; font-weight: 750; color: #059669; flex-shrink: 0; }
.cal__run-rate.is-low { color: #dc2626; }
.cal__run-meta { font-size: 10.5px; color: var(--text-slate-400); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cal__run-counts { display: flex; gap: 8px; }
.cal__run-counts em { font-style: normal; font-size: 10px; font-weight: 650; color: var(--text-slate-500); }
.cal__run-counts em.is-pass { color: #059669; }
.cal__run-counts em.is-fail { color: #dc2626; }

@media (max-width: 1080px) {
  .cal__body { grid-template-columns: minmax(0, 1fr); }
}

/* ── Case stability matrix ─────────────────────────────────────────────── */
.sm {
  border: 1px solid var(--border-slate-200); border-radius: 14px;
  background: var(--bg-pure-white); padding: 14px 16px 14px; margin-bottom: 16px;
}
.sm__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.sm__title {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 750; letter-spacing: -.01em; color: var(--text-slate-900);
}
.sm__title svg { color: #2563eb; }
.sm__sub { margin-top: 2px; font-size: 11px; color: var(--text-slate-400); }
.sm__tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sm__filters {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  margin-top: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-slate-100);
}
.sm__filter {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px;
  border: 1px solid var(--border-slate-200); border-radius: 8px; background: var(--bg-pure-white);
  font-size: 11.5px; font-weight: 600; color: var(--text-slate-600); cursor: pointer;
  transition: background .15s ease, border-color .15s ease, color .15s ease;
}
.sm__filter:hover:not(:disabled) { background: var(--bg-slate-50); color: var(--text-slate-900); }
.sm__filter.is-active { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.28); }
.sm__filter:disabled { opacity: .45; cursor: default; }
.sm__filter-n {
  min-width: 17px; padding: 0 5px; border-radius: 999px; text-align: center;
  font-size: 10px; font-weight: 700;
  background: var(--bg-slate-50); color: var(--text-slate-500); border: 1px solid var(--border-slate-100);
}
.sm__filter.is-active .sm__filter-n { background: rgba(59,130,246,.16); color: #2563eb; border-color: transparent; }
.sm__search {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; margin-left: auto;
  border: 1px solid var(--border-slate-200); border-radius: 8px; background: var(--bg-pure-white);
  color: var(--text-slate-400);
}
.sm__search input {
  border: none; outline: none; background: transparent; width: 150px;
  font-size: 11.5px; font-weight: 600; color: var(--text-slate-800);
}
.sm__search button {
  display: inline-flex; border: none; background: transparent; cursor: pointer; color: var(--text-slate-400); padding: 0;
}
.sm__search button:hover { color: var(--text-slate-700); }

/* ── The failed-case list ──────────────────────────────────────────────── */
.sm__list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.sm__row {
  width: 100%; display: flex; align-items: center; gap: 14px; cursor: pointer; text-align: left;
  padding: 10px 12px; border-radius: 11px;
  border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}
.sm__row:hover { border-color: rgba(59,130,246,.45); box-shadow: 0 1px 4px rgba(15,23,42,.06); }
.sm__row:hover .sm__row-chev { color: #2563eb; transform: translateX(2px); }
/* Flagged cases carry the warning on the whole row, not just the count. */
.sm__row.is-concern { border-color: rgba(239,68,68,.28); background: rgba(239,68,68,.03); }
.sm__row.is-concern:hover { border-color: rgba(239,68,68,.5); }
.sm__row-main { flex: 1; min-width: 0; }
.sm__row-top { display: flex; align-items: center; gap: 7px; min-width: 0; }
.sm__row-side { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.sm__row-chev { color: var(--text-slate-300); transition: color .15s ease, transform .15s ease; }
/* How red this case's history is, against the worst case on the list. */
.sm__row-track {
  display: block; height: 4px; margin-top: 7px; border-radius: 999px; overflow: hidden;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.sm__row-track i { display: block; height: 100%; background: #ef4444; border-radius: 999px; }

.sm__ref {
  flex-shrink: 0; padding: 1px 5px; border-radius: 5px;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
  font-size: 9.5px; font-weight: 700; color: var(--text-slate-500);
}
.sm__case-name {
  font-size: 12px; font-weight: 650; color: var(--text-slate-800);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sm__nobug {
  flex-shrink: 0; padding: 1px 6px; border-radius: 999px;
  background: rgba(239,68,68,.08); color: #dc2626; border: 1px solid rgba(239,68,68,.18);
  font-size: 9.5px; font-weight: 700;
}

/* ── The drawer: one case, every run it executed in ────────────────────── */
.sm__dr-id { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; min-width: 0; }
.sm__dr-name { font-size: 13px; font-weight: 750; color: var(--text-slate-900); }
.sm__dr-sub { margin-top: 3px; font-size: 11px; font-weight: 500; color: var(--text-slate-400); }
.sm__dr-tally {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.sm__dr-tally span {
  display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 74px;
  padding: 8px 10px; border-radius: 9px;
  font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.sm__dr-tally b { font-size: 16px; font-weight: 800; color: var(--text-slate-800); font-variant-numeric: tabular-nums; }
.sm__dr-tally .is-fail { background: rgba(239,68,68,.07); border-color: rgba(239,68,68,.18); }
.sm__dr-tally .is-fail b { color: #dc2626; }
.sm__dr-tally .is-pass { background: rgba(16,185,129,.08); border-color: rgba(16,185,129,.18); }
.sm__dr-tally .is-pass b { color: #047857; }
.sm__dr-warn {
  display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px 12px; border-radius: 10px;
  font-size: 11.5px; font-weight: 600; line-height: 1.45; color: #b91c1c;
  background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.24);
}
.sm__dr-warn svg { flex-shrink: 0; }
.sm__dr-label {
  margin: 18px 0 8px;
  font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--text-slate-400);
}
.sm-drawer .ant-drawer-header { padding: 14px 20px; border-bottom: 1px solid var(--border-slate-200); }
.sm-drawer .ant-drawer-body { padding: 16px 20px 24px; background: var(--bg-pure-white); }
.sm__events { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.sm__ev {
  display: flex; align-items: flex-start; gap: 10px; padding: 9px 11px;
  border: 1px solid var(--border-slate-200); border-radius: 10px; background: var(--bg-pure-white);
}
.sm__ev-status {
  flex-shrink: 0; min-width: 62px; padding: 2px 8px; border-radius: 999px; text-align: center;
  font-size: 9.5px; font-weight: 800; letter-spacing: .02em;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100); color: var(--text-slate-500);
}
.sm__ev.is-fail { border-color: rgba(239,68,68,.28); background: rgba(239,68,68,.04); }
.sm__ev.is-fail .sm__ev-status { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.26); color: #dc2626; }
.sm__ev.is-pass .sm__ev-status { background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.24); color: #047857; }
.sm__ev.is-block .sm__ev-status { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.28); color: #b45309; }
.sm__ev-body { flex: 1; min-width: 0; }
.sm__ev-top { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.sm__ev-run { font-size: 11.5px; font-weight: 700; color: var(--text-slate-900); }
.sm__ev-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 3px; }
.sm__ev-meta span { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: var(--text-slate-400); }
.sm__ev-meta svg { color: var(--text-slate-300); }
.sm__ev-note {
  margin-top: 6px; padding: 5px 8px; border-radius: 6px;
  font-size: 11px; font-style: italic; line-height: 1.45; color: var(--text-slate-600);
  background: var(--bg-slate-50); border-left: 2px solid var(--border-slate-200);
}
.sm__ev.is-fail .sm__ev-note { border-left-color: rgba(239,68,68,.35); }

.sm__shape {
  min-width: 66px; padding: 2px 8px; border-radius: 999px; text-align: center;
  font-size: 10px; font-weight: 750; white-space: nowrap;
  color: var(--text-slate-500); background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.sm__shape.is-flaky { color: #b45309; }
.sm__shape.is-regressed, .sm__shape.is-failing { color: #dc2626; }
.sm__shape.is-fixed { color: #059669; }

/* How many times this case went red, and whether that count is a problem. */
.sm__fails {
  display: flex; align-items: baseline; gap: 5px;
  font-size: 10.5px; color: var(--text-slate-500); white-space: nowrap;
}
.sm__fails b { font-size: 14px; font-weight: 800; color: #dc2626; font-variant-numeric: tabular-nums; }
.sm__fails span { font-size: 10px; color: var(--text-slate-400); }
.sm__fails svg { color: #dc2626; flex-shrink: 0; }
.sm__fails.is-concern {
  padding: 3px 9px; border-radius: 999px;
  background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.28);
}
.sm__fails.is-concern span { color: #b91c1c; }
.sm__sub-warn { color: #dc2626; }

.sm__legend { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
.sm__legend span { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 600; color: var(--text-slate-500); }
.sm__legend-concern {
  color: #dc2626 !important; padding: 1px 7px; border-radius: 999px;
  background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.24);
}
.sm__legend-hint { margin-left: auto; color: var(--text-slate-400); font-weight: 500; }

.sm__empty {
  margin-top: 12px; padding: 28px 16px; text-align: center;
  font-size: 12px; color: var(--text-slate-400);
  border: 1px dashed var(--border-slate-200); border-radius: 10px;
}
.sm__empty--clean {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  color: var(--text-slate-500); background: rgba(16,185,129,.06);
  border: 1px solid rgba(16,185,129,.2);
}
.sm__empty--clean svg { color: #047857; }
.sm__loading { padding: 28px 0; display: flex; justify-content: center; }


/* ── Section tabs ──────────────────────────────────────────────────────── */
.md-tabs {
  display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
  padding-bottom: 10px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200);
}
.md-tab {
  display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px;
  border: 1px solid transparent; border-radius: 9px; background: transparent; cursor: pointer;
  font-size: 12.5px; font-weight: 600; color: var(--text-slate-500);
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.md-tab:hover { background: var(--bg-slate-50); color: var(--text-slate-800); }
.md-tab.is-active { background: var(--bg-blue-50); color: #2563eb; border-color: rgba(59,130,246,.22); }
.md-tab__n {
  min-width: 18px; padding: 0 6px; border-radius: 999px; text-align: center;
  font-size: 10.5px; font-weight: 700;
  background: var(--bg-slate-50); color: var(--text-slate-500); border: 1px solid var(--border-slate-100);
}
.md-tab.is-active .md-tab__n { background: rgba(59,130,246,.14); color: #2563eb; border-color: transparent; }

/* ── Cards ─────────────────────────────────────────────────────────────── */
.md-list { display: flex; flex-direction: column; gap: 10px; }
.md-card {
  border: 1px solid var(--border-slate-200); border-radius: 12px;
  background: var(--bg-pure-white); overflow: hidden;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.md-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 16px rgba(15,23,42,.04); }
.md-card--row {
  display: flex; align-items: center; gap: 11px; width: 100%;
  padding: 12px 14px; cursor: pointer; text-align: left;
}
.md-card__head { display: flex; align-items: center; gap: 11px; padding: 12px 14px; }
.md-card__ic {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.18);
}
.md-card__ic.is-fail { color: #dc2626; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.2); }
.md-card__id { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.md-card__title {
  display: flex; align-items: center; gap: 7px;
  font-size: 13.5px; font-weight: 700; letter-spacing: -.01em; color: var(--text-slate-900);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.md-card__meta {
  font-size: 11.5px; color: var(--text-slate-400);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.md-card__go { color: var(--text-slate-300); flex-shrink: 0; }
.md-card--row:hover .md-card__go { color: #3B82F6; }
.md-card__empty {
  padding: 12px 14px; border-top: 1px solid var(--border-slate-100);
  font-size: 11.5px; color: var(--text-slate-400); background: var(--bg-slate-50);
}
.md-ref {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10.5px; font-weight: 700;
  padding: 1px 6px; border-radius: 5px; flex-shrink: 0;
  color: var(--text-slate-500); background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.md-note {
  display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px;
  border: 1px solid rgba(59,130,246,.2); border-radius: 10px; background: rgba(59,130,246,.05);
  font-size: 11.5px; line-height: 1.5; color: var(--text-slate-600);
}
.md-note svg { color: #3B82F6; flex-shrink: 0; margin-top: 1px; }

/* ── Run history ───────────────────────────────────────────────────────── */
.md-runs { border-top: 1px solid var(--border-slate-200); }
.md-run + .md-run { border-top: 1px solid var(--border-slate-100); }
.md-run.is-open { background: var(--bg-slate-50); }
.md-run__head {
  display: flex; align-items: center; gap: 11px; width: 100%;
  padding: 9px 14px; border: none; background: transparent; cursor: pointer; text-align: left;
  transition: background .15s ease;
}
.md-run__head:hover { background: var(--bg-slate-50); }
.md-run__chev { color: var(--text-slate-400); display: inline-flex; flex-shrink: 0; }
.md-run__ord {
  min-width: 30px; padding: 1px 7px; border-radius: 999px; flex-shrink: 0; text-align: center;
  font-size: 10.5px; font-weight: 800;
  color: var(--text-slate-500); background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
}
.md-run.has-fail .md-run__ord { color: #dc2626; background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.2); }
.md-run__id { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 220px; }
.md-run__name {
  font-size: 12.5px; font-weight: 650; color: var(--text-slate-800);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.md-run__meta {
  font-size: 11px; color: var(--text-slate-400);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.md-run__bar { display: flex; flex: 0 1 160px; min-width: 90px; }
.md-run__counts { display: inline-flex; gap: 4px; flex-shrink: 0; }
.md-count {
  min-width: 24px; padding: 1px 6px; border-radius: 6px; text-align: center;
  font-size: 10.5px; font-weight: 700;
  color: var(--text-slate-500); background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.md-count.is-pass { color: #047857; background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.2); }
.md-count.is-fail { color: #dc2626; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.2); }
.md-run__go {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 26px; height: 26px; border-radius: 7px; cursor: pointer;
  color: var(--text-slate-300); transition: background .15s ease, color .15s ease;
}
.md-run__go:hover { background: var(--bg-pure-white); color: #3B82F6; }

/* ── Failures inside a run ─────────────────────────────────────────────── */
.md-run__body { padding: 4px 14px 14px 52px; }
.md-fail__loading, .md-fail__none {
  padding: 10px 12px; font-size: 11.5px; color: var(--text-slate-400);
  border: 1px dashed var(--border-slate-200); border-radius: 9px; background: var(--bg-pure-white);
}
.md-fail {
  border: 1px solid rgba(239,68,68,.18); border-radius: 10px;
  background: var(--bg-pure-white); overflow: hidden;
}
.md-fail__head {
  display: flex; align-items: center; gap: 6px; padding: 8px 12px;
  font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  color: #dc2626; background: rgba(239,68,68,.06); border-bottom: 1px solid rgba(239,68,68,.14);
}
.md-failrow { display: flex; align-items: flex-start; gap: 10px; padding: 9px 12px; }
.md-failrow + .md-failrow { border-top: 1px solid var(--border-slate-100); }
.md-failrow__dot {
  width: 7px; height: 7px; border-radius: 999px; background: #ef4444; flex-shrink: 0; margin-top: 6px;
}
.md-failrow__body { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.md-failrow__title {
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  font-size: 12.5px; font-weight: 650; color: var(--text-slate-800);
}
.md-failrow__meta { font-size: 11px; color: var(--text-slate-400); }
.md-failrow__note {
  margin-top: 2px; padding: 6px 9px; border-radius: 7px;
  font-size: 11.5px; font-style: italic; line-height: 1.45; color: var(--text-slate-600);
  background: var(--bg-slate-50); border-left: 2px solid var(--border-slate-200);
}

/* ── Hotspot rows ──────────────────────────────────────────────────────── */
.md-spot { border-top: 1px solid var(--border-slate-100); }
.md-spotrow {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 9px 14px; border: none; background: transparent; cursor: pointer; text-align: left;
  transition: background .15s ease;
}
.md-spotrow + .md-spotrow { border-top: 1px solid var(--border-slate-100); }
.md-spotrow:hover { background: var(--bg-slate-50); }
.md-spotrow__run { font-size: 12.5px; font-weight: 650; color: var(--text-slate-800); flex-shrink: 0; }
.md-spotrow__meta { font-size: 11px; color: var(--text-slate-400); flex-shrink: 0; }
.md-spotrow__note {
  font-size: 11px; font-style: italic; color: var(--text-slate-500);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;
}
.md-spotrow__go { color: var(--text-slate-300); flex-shrink: 0; margin-left: auto; }

/* ── Borrowed vocabulary from the map ──────────────────────────────────── */
.cm-bar {
  display: flex; height: 7px; flex: 1; min-width: 80px; border-radius: 999px; overflow: hidden;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.cm-bar.is-empty { align-items: center; justify-content: center; height: auto; padding: 2px 8px; background: transparent; border-style: dashed; }
.cm-bar__none { font-size: 10.5px; color: var(--text-slate-400); white-space: nowrap; }
.cm-bar__seg { height: 100%; }
.cm-bar__seg.is-pass { background: #10b981; }
.cm-bar__seg.is-fail { background: #ef4444; }
.cm-bar__seg.is-block { background: #94a3b8; }
.cm-bar__seg.is-todo { background: var(--border-slate-200); }

.cm-tag {
  flex-shrink: 0; padding: 1px 7px; border-radius: 999px;
  font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
  color: var(--text-slate-500); background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
}
.cm-pill {
  flex-shrink: 0; display: inline-flex; align-items: center; height: 20px; padding: 0 8px;
  border-radius: 6px; font-size: 10.5px; font-weight: 700; border: 1px solid; white-space: nowrap;
}
.cm-pill--blue { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.22); }
.cm-pill--green { color: #047857; background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.24); }
.cm-pill--red { color: #dc2626; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.22); }
.cm-pill--ash { color: #64748b; background: rgba(100,116,139,.1); border-color: rgba(100,116,139,.2); }
.cm-col__empty {
  font-size: 12px; color: var(--text-slate-400); line-height: 1.5;
  padding: 16px 14px; border: 1px dashed var(--border-slate-200); border-radius: 10px; text-align: center;
}
.cm-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 54px 20px; text-align: center; border: 1px dashed var(--border-slate-200); border-radius: 12px;
}
.cm-empty__ic { color: var(--text-slate-300); }
.cm-empty__title { margin: 4px 0 0; font-size: 13.5px; font-weight: 700; color: var(--text-slate-800); }
.cm-empty__desc { margin: 0 0 8px; font-size: 12px; color: var(--text-slate-400); max-width: 400px; line-height: 1.5; }

@media (max-width: 900px) {
  .md-run__bar { display: none; }
  .md-run__body { padding-left: 18px; }
  .md-spotrow__note { display: none; }
}
@media (max-width: 640px) {
  .md-scroll { padding: 12px 14px 24px; }
  .md-run__head { flex-wrap: wrap; }
}
`;
