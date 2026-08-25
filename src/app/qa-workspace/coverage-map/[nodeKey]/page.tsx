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

import React, { Suspense, useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Tooltip } from "antd";
import { BugOutlined } from "@ant-design/icons";
import {
  ArrowLeft, ArrowUpRight, AlertTriangle, Activity, Boxes, CalendarDays, CheckCircle2,
  ChevronDown, ChevronRight, ClipboardList, Clock, FileText, Flame, Layers, Lightbulb,
  PlayCircle, Repeat, RotateCw, Target, TrendingDown, TrendingUp, X,
} from "lucide-react";
import dayjs from "dayjs";

import { usePermission } from "@/hooks/usePermission";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useActivitySource } from "@/hooks/useActivitySource";
import { apiClient } from "@/lib/axios";
import ZukvoLoader, { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import {
  ResultBar, fmtAgo, fmtDate, fmtDateTime, initialsOf, statusTone,
  useCoverageData, useUserProjects, type ModuleNode,
} from "../shared";

/** Failing runs whose failures are fetched without being asked. */
const EAGER_FAILURE_RUNS = 8;

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
function buildInsights(node: ModuleNode, chrono: any[], hotspots: { name: string; runs: any[] }[]): Insight[] {
  const out: Insight[] = [];
  const runs = chrono;
  const n = runs.length;

  if (!n) {
    out.push({
      icon: AlertTriangle, tone: "warn",
      text: <>This module has <b>never been executed</b>.</>,
      detail: node.suites.length
        ? `${node.suites.length} suite${node.suites.length === 1 ? " is" : "s are"} ready but no run has been created.`
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
  const idle = node.suites.filter(su => !runs.some(r => String(r.suite_id) === String(su.id)));
  if (idle.length) {
    out.push({
      icon: Layers, tone: "warn",
      text: <><b>{idle.length} of {node.suites.length} suite{node.suites.length === 1 ? "" : "s"}</b> {idle.length === 1 ? "has" : "have"} never been run.</>,
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

const GRAINS = [
  { key: "run", label: "Per run" },
  { key: "day", label: "Day" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
] as const;
type Grain = (typeof GRAINS)[number]["key"];

const GRAIN_FORMAT: Record<Exclude<Grain, "run">, { bucket: string; label: string }> = {
  day: { bucket: "YYYY-MM-DD", label: "D MMM" },
  month: { bucket: "YYYY-MM", label: "MMM YYYY" },
  year: { bucket: "YYYY", label: "YYYY" },
};

interface Bucket {
  key: string;
  label: string;
  sub: string;
  passed: number;
  failed: number;
  blocked: number;
  notRun: number;
  runs: any[];
}

/** Groups a suite's runs into the buckets the chart draws — one per run, or per day / month / year. */
function bucketRuns(runs: any[], grain: Grain): Bucket[] {
  if (grain === "run") {
    return chronological(runs).map((r, i) => {
      const c = countsOf(r);
      return {
        key: String(r.id),
        label: `#${i + 1}`,
        sub: fmtDate(runDate(r)) || "no date",
        ...c,
        notRun: c.notRun,
        runs: [r],
      } as Bucket;
    });
  }

  const { bucket: bucketFmt, label: labelFmt } = GRAIN_FORMAT[grain];
  const map = new Map<string, Bucket>();
  chronological(runs).forEach(r => {
    const d = dayjs(runDate(r));
    const key = d.isValid() ? d.format(bucketFmt) : "unknown";
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: d.isValid() ? d.format(labelFmt) : "Undated",
        sub: "",
        passed: 0, failed: 0, blocked: 0, notRun: 0,
        runs: [],
      });
    }
    const b = map.get(key)!;
    const c = countsOf(r);
    b.passed += c.passed;
    b.failed += c.failed;
    b.blocked += c.blocked;
    b.notRun += c.notRun;
    b.runs.push(r);
  });

  return Array.from(map.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(b => ({ ...b, sub: `${b.runs.length} run${b.runs.length === 1 ? "" : "s"}` }));
}

/**
 * Execution history — pick a suite, pick a grain, and see exactly when it ran
 * and how much passed versus failed each time. Bars are counts, not shares, so
 * a run that doubled in size reads as a taller pair rather than a flat ratio.
 */
function ExecutionChart({ suites, runs, selectedKey, onPick }: {
  suites: any[];
  runs: any[];
  /** Bucket currently shown in the inspector, so the chart can mark it. */
  selectedKey: string | null;
  onPick: (label: string, runs: any[]) => void;
}) {
  const [suiteId, setSuiteId] = useState<string>("all");
  const [grain, setGrain] = useState<Grain>("run");
  const [hover, setHover] = useState<string | null>(null);

  /** Suites that actually have runs, plus whatever ran without one. */
  const tabs = useMemo(() => {
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

  const buckets = useMemo(() => bucketRuns(scoped, grain), [scoped, grain]);
  const peak = Math.max(1, ...buckets.map(b => Math.max(b.passed, b.failed)));
  const ticks = [peak, Math.round(peak * 0.75), Math.round(peak * 0.5), Math.round(peak * 0.25), 0];

  const totals = buckets.reduce(
    (a, b) => ({ passed: a.passed + b.passed, failed: a.failed + b.failed, runs: a.runs + b.runs.length }),
    { passed: 0, failed: 0, runs: 0 },
  );
  const activeName = suiteId === "all"
    ? "All suites"
    : tabs.find(t => t.id === suiteId)?.name ?? "Suite";

  return (
    <div className="mx-chart">
      <div className="mx-chart__head">
        <div>
          <div className="mx-chart__title">Execution history</div>
          <div className="mx-chart__sub">
            {activeName} · <b>{totals.runs}</b> run{totals.runs === 1 ? "" : "s"} ·{" "}
            <b>{totals.passed}</b> passed, <b>{totals.failed}</b> failed
          </div>
        </div>
        <div className="mx-grains">
          {GRAINS.map(g => (
            <button
              key={g.key}
              type="button"
              className={grain === g.key ? "is-active" : ""}
              onClick={() => setGrain(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Which suite are we looking at? */}
      <div className="mx-suites">
        <button
          type="button"
          className={`mx-suite${suiteId === "all" ? " is-active" : ""}`}
          onClick={() => setSuiteId("all")}
        >
          <Layers size={12} />
          All suites
          <span className="mx-suite__n">{runs.length}</span>
        </button>
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            className={`mx-suite${suiteId === t.id ? " is-active" : ""}${t.n === 0 ? " is-zero" : ""}`}
            onClick={() => setSuiteId(t.id)}
            title={t.name}
            disabled={t.n === 0}
          >
            {t.name}
            <span className="mx-suite__n">{t.n}</span>
          </button>
        ))}
      </div>

      {buckets.length === 0 ? (
        <div className="mx-chart__empty">This suite has never been executed.</div>
      ) : (
        <div className="mx-plot">
          <div className="mx-axis">
            {ticks.map((t, i) => <span key={i}>{t}</span>)}
          </div>

          <div className="mx-canvas">
            <div className="mx-inner">
              <div className="mx-rules">
                {ticks.map((_, i) => <span key={i} />)}
              </div>

              <div className={`mx-cols${buckets.length > 18 ? " is-dense" : ""}`}>
              {buckets.map(b => {
                const rate = b.passed + b.failed > 0 ? Math.round((b.passed / (b.passed + b.failed)) * 100) : null;
                return (
                  <button
                    key={b.key}
                    type="button"
                    className={`mx-col${hover === b.key ? " is-hot" : ""}${selectedKey === b.key ? " is-picked" : ""}${b.failed > 0 ? " has-fail" : ""}`}
                    onMouseEnter={() => setHover(b.key)}
                    onMouseLeave={() => setHover(h => (h === b.key ? null : h))}
                    onClick={() => onPick(b.label, b.runs)}
                    title={`${b.label}${b.sub ? ` · ${b.sub}` : ""} — ${b.passed} passed, ${b.failed} failed`
                      + `${b.blocked ? `, ${b.blocked} blocked` : ""}${b.notRun ? `, ${b.notRun} not run` : ""}`}
                  >
                    <span className="mx-col__bars">
                      <span className="mx-b is-pass" style={{ height: `${(b.passed / peak) * 100}%` }}>
                        {buckets.length <= 12 && b.passed > 0 && <i>{b.passed}</i>}
                      </span>
                      <span className="mx-b is-fail" style={{ height: `${(b.failed / peak) * 100}%` }}>
                        {buckets.length <= 12 && b.failed > 0 && <i>{b.failed}</i>}
                      </span>
                    </span>
                    <span className="mx-col__foot">
                      <span className="mx-col__label">{b.label}</span>
                      {rate !== null && buckets.length <= 12 && (
                        <span className={`mx-col__rate${rate < 80 ? " is-low" : ""}`}>{rate}%</span>
                      )}
                    </span>
                  </button>
                );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      <div className="mx-legend mx-legend--foot">
        <span><i className="is-pass" />Passed</span>
        <span><i className="is-fail" />Failed</span>
        <span className="mx-legend__hint">Click a bar to inspect that run</span>
      </div>
    </div>
  );
}

/**
 * The panel beside the chart. Idle it shows the run mix; pick a bar and it
 * becomes that run's read-out — counts, pass rate and every failed case —
 * so the answer arrives next to the bar rather than further down the page.
 */
function RunInspector({
  focus, runId, onPickRun, onClear, failures, loading, router,
}: {
  focus: { label: string; runs: any[] };
  runId: string | null;
  onPickRun: (id: string) => void;
  onClear: () => void;
  failures: FailureRow[] | undefined;
  loading: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const run = focus.runs.find((r: any) => String(r.id) === runId) ?? focus.runs[focus.runs.length - 1];
  const c = countsOf(run);
  const executed = c.passed + c.failed + c.blocked;
  const rate = executed > 0 ? Math.round((c.passed / executed) * 100) : null;

  return (
    <aside className="mx-inspect">
      <header className="mx-inspect__head">
        <div className="min-w-0">
          <div className="mx-chart__title">{focus.label}</div>
          <div className="mx-chart__sub">
            {focus.runs.length > 1 ? `${focus.runs.length} runs in this period` : "Run detail"}
          </div>
        </div>
        <button className="mx-inspect__close" onClick={onClear} aria-label="Back to run mix">
          <X size={14} />
        </button>
      </header>

      {focus.runs.length > 1 && (
        <div className="mx-inspect__switch">
          {focus.runs.map((r: any) => (
            <button
              key={r.id}
              type="button"
              className={`mx-inspect__chip${String(r.id) === String(run.id) ? " is-active" : ""}${Number(r.failed_count || 0) > 0 ? " has-fail" : ""}`}
              onClick={() => onPickRun(String(r.id))}
              title={r.run_name || "Untitled run"}
            >
              {fmtDate(runDate(r)) || "Undated"}
            </button>
          ))}
        </div>
      )}

      <div className="mx-inspect__run">
        <div className="mx-inspect__name">{run.run_name || "Untitled run"}</div>
        <div className="mx-inspect__meta">
          {[fmtDateTime(runDate(run)), run.created_by_name && `by ${run.created_by_name}`, run.scope_name]
            .filter(Boolean).join(" · ")}
        </div>
      </div>

      <div className="mx-inspect__stats">
        <span className="mx-stat is-pass"><b>{c.passed}</b>passed</span>
        <span className={`mx-stat${c.failed ? " is-fail" : ""}`}><b>{c.failed}</b>failed</span>
        <span className="mx-stat"><b>{c.blocked}</b>blocked</span>
        <span className="mx-stat"><b>{c.notRun}</b>not run</span>
      </div>

      {rate !== null && (
        <div className="mx-inspect__rate">
          <div className="mx-inspect__ratetop">
            <span>Pass rate</span>
            <b className={rate < 80 ? "is-low" : ""}>{rate}%</b>
          </div>
          <div className="mx-inspect__track">
            <span style={{ width: `${rate}%` }} className={rate < 80 ? "is-low" : ""} />
          </div>
        </div>
      )}

      <div className="mx-inspect__body">
        {c.failed === 0 ? (
          <div className="mx-inspect__clean">
            <CheckCircle2 size={16} />
            Nothing failed on this run.
          </div>
        ) : loading && !failures ? (
          <div className="mx-inspect__loading"><ZukvoLoader size="sm" message="Loading failures…" /></div>
        ) : !failures?.length ? (
          <div className="mx-inspect__clean">No failure detail recorded.</div>
        ) : (
          <>
            <div className="mx-inspect__label"><Flame size={11} />{failures.length} failed case{failures.length === 1 ? "" : "s"}</div>
            <div className="mx-inspect__list">
              {failures.map(row => (
                <div key={row.id} className="mx-failcard">
                  <div className="mx-failcard__top">
                    {row.tc_ref_id && <code className="md-ref">{row.tc_ref_id}</code>}
                    <span className="mx-failcard__name">{row.name}</span>
                  </div>
                  <div className="mx-failcard__meta">
                    {[row.severity && `Severity ${row.severity}`, row.priority, row.test_type,
                      fmtDateTime(row.executed_at)].filter(Boolean).join(" · ")}
                  </div>
                  {row.notes && <div className="mx-failcard__note">“{row.notes}”</div>}
                  {row.bug_logged
                    ? <span className="cm-pill cm-pill--blue">{row.bug_number || "Bug filed"}</span>
                    : <span className="cm-pill cm-pill--ash">No bug</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Button
        block
        size="small"
        className="mx-inspect__cta"
        onClick={() => router.push(`/qa-workspace/test-runs/${run.id}`)}
      >
        Open the full run
        <ArrowUpRight size={13} />
      </Button>
    </aside>
  );
}

/** Run types as a share of all runs — what this module is actually tested with. */
function KindBreakdown({ runs }: { runs: any[] }) {
  const kinds = useMemo(() => {
    const map = new Map<string, { n: number; failed: number }>();
    runs.forEach(r => {
      const k = kindOf(r);
      const cur = map.get(k) || { n: 0, failed: 0 };
      cur.n += 1;
      cur.failed += countsOf(r).failed;
      map.set(k, cur);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].n - a[1].n);
  }, [runs]);

  if (!kinds.length) return null;
  const top = kinds[0][1].n;

  return (
    <div className="mx-kinds">
      <div className="mx-chart__title">Run mix</div>
      <div className="mx-chart__sub">How this module gets tested</div>
      <div className="mx-kinds__list">
        {kinds.map(([name, v]) => (
          <div key={name} className="mx-kind">
            <div className="mx-kind__top">
              <span className="mx-kind__name" title={name}>{name}</span>
              <span className="mx-kind__n">{v.n}</span>
            </div>
            <div className="mx-kind__track">
              <span className="mx-kind__fill" style={{ width: `${(v.n / top) * 100}%` }} />
            </div>
            <div className="mx-kind__meta">
              {v.failed > 0 ? `${v.failed} failed case${v.failed === 1 ? "" : "s"}` : "no failures"}
            </div>
          </div>
        ))}
      </div>
    </div>
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
  /** The chart bucket being inspected beside the graph, if any. */
  const [focus, setFocus] = useState<{ key: string; label: string; runs: any[] } | null>(null);
  const [focusRunId, setFocusRunId] = useState<string | null>(null);
  const [failures, setFailures] = useState<Record<string, FailureRow[]>>({});
  const [loadingRun, setLoadingRun] = useState<Record<string, boolean>>({});

  /** Failing runs, newest first — the ones worth pulling detail for. */
  const failingRuns = useMemo(
    () => (node?.runs ?? [])
      .filter((r: any) => Number(r.failed_count || 0) > 0)
      .sort((a: any, b: any) => dayjs(runDate(b) || 0).valueOf() - dayjs(runDate(a) || 0).valueOf()),
    [node],
  );

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

  const insights = useMemo(
    () => (node ? buildInsights(node, allRuns, hotspots) : []),
    [node, allRuns, hotspots],
  );

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
                <section className="mx-insights">
                  <header className="mx-insights__head">
                    <span className="mx-insights__ic"><Lightbulb size={14} /></span>
                    <div>
                      <div className="mx-insights__title">What the history says</div>
                      <div className="mx-insights__sub">Read from every scope, suite and run attached to this module</div>
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

                {allRuns.length > 0 && (
                  <div className="mx-charts">
                    <ExecutionChart
                      suites={node.suites}
                      runs={allRuns}
                      selectedKey={focus?.key ?? null}
                      onPick={(label, picked) => {
                        const last = picked[picked.length - 1];
                        setFocus({ key: label, label, runs: picked });
                        setFocusRunId(String(last.id));
                        fetchFailures(String(last.id));
                      }}
                    />
                    {focus ? (
                      <RunInspector
                        focus={focus}
                        runId={focusRunId}
                        onPickRun={(id) => { setFocusRunId(id); fetchFailures(id); }}
                        onClear={() => { setFocus(null); setFocusRunId(null); }}
                        failures={focusRunId ? failures[focusRunId] : undefined}
                        loading={focusRunId ? !!loadingRun[focusRunId] : false}
                        router={router}
                      />
                    ) : (
                      <KindBreakdown runs={allRuns} />
                    )}
                  </div>
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
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  border-bottom: 1px solid var(--border-slate-100);
  background: linear-gradient(180deg, rgba(59,130,246,.05), transparent);
}
.mx-insights__ic {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.18);
}
.mx-insights__title { font-size: 13.5px; font-weight: 750; letter-spacing: -.01em; color: var(--text-slate-900); }
.mx-insights__sub { margin-top: 2px; font-size: 11.5px; color: var(--text-slate-400); }
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

/* ── Charts ────────────────────────────────────────────────────────────── */
.mx-charts { display: grid; grid-template-columns: minmax(0, 1fr) 288px; gap: 12px; margin-bottom: 16px; align-items: stretch; }
.mx-chart, .mx-kinds {
  border: 1px solid var(--border-slate-200); border-radius: 14px;
  background: var(--bg-pure-white); padding: 14px 16px 12px;
}
/* The chart fills whatever height the inspector beside it needs. */
.mx-chart { display: flex; flex-direction: column; min-width: 0; }
.mx-chart__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.mx-chart__title { font-size: 13px; font-weight: 750; letter-spacing: -.01em; color: var(--text-slate-900); }
.mx-chart__sub { margin-top: 2px; font-size: 11px; color: var(--text-slate-400); }

.mx-legend { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.mx-legend span { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 600; color: var(--text-slate-500); }
.mx-legend i { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
.mx-legend i.is-pass { background: #10b981; }
.mx-legend i.is-fail { background: #ef4444; }

/* Suite switcher */
.mx-suites {
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
  margin-top: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-slate-100);
}
.mx-suite {
  display: inline-flex; align-items: center; gap: 6px; max-width: 220px;
  height: 28px; padding: 0 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
  font-size: 11.5px; font-weight: 600; color: var(--text-slate-600);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: background .15s ease, border-color .15s ease, color .15s ease;
}
.mx-suite:hover:not(:disabled) { background: var(--bg-slate-50); color: var(--text-slate-900); }
.mx-suite.is-active { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.28); }
.mx-suite:disabled { opacity: .45; cursor: default; }
.mx-suite__n {
  min-width: 17px; padding: 0 5px; border-radius: 999px; text-align: center;
  font-size: 10px; font-weight: 700;
  background: var(--bg-slate-50); color: var(--text-slate-500); border: 1px solid var(--border-slate-100);
}
.mx-suite.is-active .mx-suite__n { background: rgba(59,130,246,.16); color: #2563eb; border-color: transparent; }

/* Grain switch */
.mx-grains {
  display: inline-flex; padding: 2px; gap: 2px;
  border: 1px solid var(--border-slate-200); border-radius: 9px; background: var(--bg-slate-50);
}
.mx-grains button {
  height: 24px; padding: 0 10px; border: none; border-radius: 7px; background: transparent; cursor: pointer;
  font-size: 11px; font-weight: 650; color: var(--text-slate-500);
  transition: background .15s ease, color .15s ease;
}
.mx-grains button:hover { color: var(--text-slate-800); }
.mx-grains button.is-active { background: var(--bg-pure-white); color: #2563eb; box-shadow: 0 1px 2px rgba(15,23,42,.06); }

/* ── Plot: grouped pass / fail columns ─────────────────────────────────── */
.mx-plot { position: relative; display: flex; gap: 10px; margin-top: 16px; flex: 1; min-height: 208px; }
.mx-chart__empty {
  margin-top: 16px; padding: 34px 16px; text-align: center;
  font-size: 12px; color: var(--text-slate-400);
  border: 1px dashed var(--border-slate-200); border-radius: 10px;
}
.mx-axis {
  display: flex; flex-direction: column; justify-content: space-between;
  flex-shrink: 0; padding-bottom: 34px;
  font-size: 9.5px; font-weight: 700; color: var(--text-slate-300); font-variant-numeric: tabular-nums;
}
/* Long month and year labels get room; many buckets scroll rather than clip. */
.mx-canvas { flex: 1; min-width: 0; overflow-x: auto; overflow-y: hidden; padding-bottom: 2px; }
.mx-canvas::-webkit-scrollbar { height: 6px; }
.mx-canvas::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 999px; }
.mx-inner { position: relative; width: max-content; min-width: 100%; height: 100%; }
.mx-rules {
  position: absolute; left: 0; right: 0; top: 0; bottom: 34px;
  display: flex; flex-direction: column; justify-content: space-between; pointer-events: none;
}
.mx-rules span { display: block; height: 1px; background: var(--border-slate-100); }

.mx-cols { display: flex; align-items: stretch; gap: 4px; height: 100%; }
.mx-col {
  flex: 1 0 56px; min-width: 56px;
  display: flex; flex-direction: column; align-items: center;
  padding: 0 2px; border: none; background: transparent; cursor: pointer;
  border-radius: 8px 8px 0 0; transition: background .15s ease;
}
.mx-col:hover, .mx-col.is-hot { background: rgba(59,130,246,.05); }
.mx-col__bars {
  display: flex; align-items: flex-end; justify-content: center; gap: 3px;
  width: 100%; flex: 1; min-height: 0;
}
/* Fixed footer height keeps the grid lines and the bar baseline aligned. */
.mx-col__foot {
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 2px;
  height: 34px; padding-top: 6px; width: 100%; flex-shrink: 0;
}
.mx-b {
  position: relative; width: 46%; max-width: 22px; min-height: 2px; border-radius: 4px 4px 0 0;
  transition: opacity .15s ease, filter .15s ease;
}
.mx-b.is-pass { background: #10b981; }
.mx-b.is-fail { background: #ef4444; }
.mx-b i {
  position: absolute; left: 50%; top: -15px; transform: translateX(-50%);
  font-style: normal; font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
  color: var(--text-slate-500); white-space: nowrap;
}
.mx-b.is-fail i { color: #dc2626; }
.mx-col.is-hot .mx-b { filter: brightness(1.05); }
.mx-col__label {
  font-size: 10px; font-weight: 700; color: var(--text-slate-400); font-variant-numeric: tabular-nums;
  line-height: 1.3; max-width: 100%; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.mx-col.is-hot .mx-col__label { color: #2563eb; }
.mx-col__rate { font-size: 9.5px; font-weight: 700; color: #047857; }
.mx-col__rate.is-low { color: #dc2626; }
.mx-cols.is-dense .mx-b { border-radius: 2px 2px 0 0; }

.mx-legend--foot {
  margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-slate-100);
}
.mx-legend__hint { margin-left: auto; color: var(--text-slate-300) !important; font-weight: 500 !important; }

/* ── Run inspector: the picked bar's read-out, beside the chart ────────── */
.mx-inspect {
  display: flex; flex-direction: column; min-width: 0;
  border: 1px solid rgba(59,130,246,.28); border-radius: 14px;
  background: var(--bg-pure-white); padding: 14px 14px 12px;
  box-shadow: 0 8px 26px rgba(15,23,42,.05);
}
.mx-inspect__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.mx-inspect__close {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 24px; height: 24px; border-radius: 7px; border: none; background: transparent; cursor: pointer;
  color: var(--text-slate-400); transition: background .15s ease, color .15s ease;
}
.mx-inspect__close:hover { background: var(--bg-slate-50); color: var(--text-slate-800); }

.mx-inspect__switch { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; }
.mx-inspect__chip {
  height: 24px; padding: 0 9px; border-radius: 7px; cursor: pointer;
  border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
  font-size: 10.5px; font-weight: 650; color: var(--text-slate-500);
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.mx-inspect__chip:hover { background: var(--bg-slate-50); }
.mx-inspect__chip.has-fail { color: #dc2626; border-color: rgba(239,68,68,.24); }
.mx-inspect__chip.is-active { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.3); }

.mx-inspect__run { margin-top: 12px; }
.mx-inspect__name { font-size: 13px; font-weight: 750; color: var(--text-slate-900); letter-spacing: -.01em; }
.mx-inspect__meta { margin-top: 3px; font-size: 11px; line-height: 1.45; color: var(--text-slate-400); }

.mx-inspect__stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; margin-top: 11px; }
.mx-stat {
  display: flex; align-items: baseline; gap: 5px; padding: 6px 9px; border-radius: 8px;
  font-size: 10.5px; color: var(--text-slate-400);
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.mx-stat b { font-size: 14px; font-weight: 800; color: var(--text-slate-800); font-variant-numeric: tabular-nums; }
.mx-stat.is-pass { background: rgba(16,185,129,.08); border-color: rgba(16,185,129,.18); }
.mx-stat.is-pass b { color: #047857; }
.mx-stat.is-fail { background: rgba(239,68,68,.07); border-color: rgba(239,68,68,.18); }
.mx-stat.is-fail b { color: #dc2626; }

.mx-inspect__rate { margin-top: 11px; }
.mx-inspect__ratetop {
  display: flex; align-items: baseline; justify-content: space-between;
  font-size: 10.5px; font-weight: 650; color: var(--text-slate-400);
}
.mx-inspect__ratetop b { font-size: 13px; font-weight: 800; color: #047857; font-variant-numeric: tabular-nums; }
.mx-inspect__ratetop b.is-low { color: #dc2626; }
.mx-inspect__track {
  height: 6px; margin-top: 5px; border-radius: 999px; overflow: hidden;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.mx-inspect__track span { display: block; height: 100%; background: #10b981; border-radius: 999px; }
.mx-inspect__track span.is-low { background: #ef4444; }

.mx-inspect__body { margin-top: 12px; flex: 1; min-height: 0; display: flex; flex-direction: column; }
.mx-inspect__label {
  display: flex; align-items: center; gap: 5px; margin-bottom: 7px;
  font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #dc2626;
}
.mx-inspect__list { display: flex; flex-direction: column; gap: 6px; flex: 1; min-height: 0; max-height: 340px; overflow-y: auto; padding-right: 2px; }
.mx-inspect__list::-webkit-scrollbar { width: 5px; }
.mx-inspect__list::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 999px; }

.mx-failcard {
  padding: 9px 10px; border-radius: 9px;
  background: rgba(239,68,68,.04); border: 1px solid rgba(239,68,68,.16);
}
.mx-failcard__top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mx-failcard__name { font-size: 12px; font-weight: 650; color: var(--text-slate-800); }
.mx-failcard__meta { margin-top: 3px; font-size: 10.5px; color: var(--text-slate-400); }
.mx-failcard__note {
  margin: 6px 0; padding: 5px 8px; border-radius: 6px;
  font-size: 11px; font-style: italic; line-height: 1.45; color: var(--text-slate-600);
  background: var(--bg-pure-white); border-left: 2px solid rgba(239,68,68,.3);
}
.mx-failcard .cm-pill { margin-top: 4px; }

.mx-inspect__clean {
  display: flex; align-items: center; gap: 7px; padding: 14px 12px; border-radius: 9px;
  font-size: 11.5px; color: var(--text-slate-500);
  background: rgba(16,185,129,.06); border: 1px solid rgba(16,185,129,.18);
}
.mx-inspect__clean svg { color: #047857; }
.mx-inspect__loading { padding: 18px 0; display: flex; justify-content: center; }
.mx-inspect__cta { margin-top: 12px; display: inline-flex !important; align-items: center; gap: 5px; border-radius: 8px; }

/* the picked column keeps its highlight while the inspector is open */
.mx-col.is-picked { background: rgba(59,130,246,.1); box-shadow: inset 0 0 0 1px rgba(59,130,246,.25); }
.mx-col.is-picked .mx-col__label { color: #2563eb; font-weight: 800; }

.mx-kinds__list { display: flex; flex-direction: column; gap: 11px; margin-top: 14px; }
.mx-kind__top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.mx-kind__name {
  font-size: 12px; font-weight: 650; color: var(--text-slate-700);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mx-kind__n { font-size: 12px; font-weight: 800; color: var(--text-slate-900); font-variant-numeric: tabular-nums; }
.mx-kind__track {
  height: 6px; margin-top: 5px; border-radius: 999px; overflow: hidden;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.mx-kind__fill { display: block; height: 100%; background: #3B82F6; border-radius: 999px; }
.mx-kind__meta { margin-top: 4px; font-size: 10.5px; color: var(--text-slate-400); }

@media (max-width: 1100px) {
  .mx-charts { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .mx-legend { gap: 8px; }
}


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
