"use client";

import NoData from "@/components/common/NoData";
/**
 * Side drawers for the two records a QA Submission points at: the Test Runs it
 * reports on, and the Test Scope it covers.
 *
 * They exist so reviewing a submission doesn't mean leaving it. Everything here
 * is fetched the moment a drawer is opened and not before — the submission page
 * itself stays one request, and a reviewer who never opens a run never pays for
 * one. What has already been fetched is kept, so reopening the same record is
 * instant while a different one goes back to the server.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Drawer, Empty, Input, Tooltip } from "antd";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  CircleSlash,
  ExternalLink,
  FlaskConical,
  Layers,
  Link2,
  Monitor,
  Search,
  Target,
  X,
} from "lucide-react";

import TiptapViewer from "@/components/common/TiptapViewer";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { api as axios } from "@/lib/axios";
import QaSubmissionService from "@/services/qaSubmissionService";
import { fmtDate, hasRichText, initialsOf } from "./shared";

/* ─────────────────────────────────────────────────────────────────────────────
 * Styles
 *
 * Scoped under .qd-root so nothing here leaks into the page behind the drawer.
 * The palette is the QA module's: blue for in-flight, green for good, ash for
 * neutral, and the established red/amber for failed and blocked results.
 * ────────────────────────────────────────────────────────────────────────── */
export const QA_DRAWER_STYLES = `
.qd-drawer .ant-drawer-body { padding: 0; background: var(--bg-secondary); }
.qd-drawer .ant-drawer-content { background: var(--bg-secondary); box-shadow: -24px 0 60px -28px rgba(15,23,42,.28); }
/* antd sets the width inline, so narrow screens need this to stop the drawer
   running off the edge. */
.qd-drawer .ant-drawer-content-wrapper { max-width: 100vw; }

.qd-root { display: flex; flex-direction: column; height: 100%; font-variant-numeric: tabular-nums; }

/* Header — sticks while the body scrolls, so the record's identity never
   leaves the screen on a long run. */
.qd-head { position: sticky; top: 0; z-index: 3; background: var(--bg-secondary); border-bottom: 1px solid var(--border-slate-200); padding: 16px 22px 13px; }
.qd-head__top { display: flex; align-items: flex-start; gap: 12px; }
.qd-head__avatar { width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px; background: var(--bg-blue-50); color: #3B82F6; border: 1px solid rgba(59,130,246,.18); display: flex; align-items: center; justify-content: center; font-size: 12.5px; font-weight: 700; letter-spacing: .02em; }
.qd-head__text { flex: 1; min-width: 0; }
.qd-head__eyebrow { display: block; font-size: 10px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; color: var(--text-slate-400); margin-bottom: 3px; }
.qd-head__title { margin: 0; font-size: 16px; line-height: 1.25; font-weight: 700; color: var(--text-slate-900); overflow-wrap: anywhere; }
.qd-head__pills { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 7px; }
.qd-head__meta { margin: 7px 0 0; font-size: 11.5px; color: var(--text-slate-400); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.qd-head__actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.qd-iconbtn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-secondary); color: var(--text-slate-600); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s ease, color .15s ease, border-color .15s ease; }
.qd-iconbtn:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }

.qd-body { flex: 1; overflow-y: auto; padding: 18px 22px 32px; }
.qd-state { min-height: 320px; display: flex; align-items: center; justify-content: center; }

/* Section */
.qd-sec { margin-bottom: 22px; }
.qd-sec:last-child { margin-bottom: 0; }
.qd-sec__head { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
.qd-sec__icon { width: 22px; height: 22px; border-radius: 6px; background: var(--bg-slate-50); color: var(--text-slate-600); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.qd-sec__title { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-slate-600); }
.qd-sec__count { margin-left: auto; font-size: 11px; font-weight: 600; color: var(--text-slate-400); }
.qd-sub { font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--text-slate-400); margin-bottom: 7px; }

/* Progress bar */
.qd-bar { display: flex; height: 7px; border-radius: 99px; overflow: hidden; background: var(--bg-slate-100); margin-bottom: 12px; }
.qd-bar > span { display: block; height: 100%; }
.qd-bar .is-pass { background: #10b981; }
.qd-bar .is-fail { background: #ef4444; }
.qd-bar .is-blocked { background: #f59e0b; }
.qd-bar .is-none { background: var(--border-slate-200); }

/* Stat strip */
.qd-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 8px; }
.qd-stat { border: 1px solid var(--border-slate-200); border-radius: 10px; padding: 9px 11px; background: var(--bg-secondary); }
.qd-stat__label { display: block; font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--text-slate-400); }
.qd-stat__value { display: block; margin-top: 3px; font-size: 18px; font-weight: 700; line-height: 1.1; color: var(--text-slate-900); }
.qd-stat--green .qd-stat__value { color: #047857; }
.qd-stat--red .qd-stat__value { color: #dc2626; }
.qd-stat--amber .qd-stat__value { color: #b45309; }
.qd-stat--blue .qd-stat__value { color: #2563eb; }

/* Fact grid */
/* The 1px gap over a tinted background draws the dividers, so no cell is left
   with a border hanging against the container edge. */
.qd-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1px; background: var(--border-slate-100); border: 1px solid var(--border-slate-200); border-radius: 10px; overflow: hidden; }
.qd-fact { padding: 10px 13px; min-width: 0; background: var(--bg-secondary); }
.qd-fact dt { font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--text-slate-400); margin-bottom: 3px; }
.qd-fact dd { margin: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); overflow-wrap: anywhere; }
.qd-fact--wide { grid-column: 1 / -1; }

/* Environment — the scalar facts sit in a grid, the multi-value ones read as
   chip rows underneath, since a comma-joined browser list is unreadable. */
.qd-env { border: 1px solid var(--border-slate-200); border-radius: 10px; overflow: hidden; background: var(--bg-secondary); }
.qd-env__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; background: var(--border-slate-100); }
.qd-env__cell { padding: 11px 13px; min-width: 0; background: var(--bg-secondary); }
.qd-env__label { display: block; font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--text-slate-400); margin-bottom: 4px; }
.qd-env__value { font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); overflow-wrap: anywhere; }
.qd-env__row { display: flex; align-items: flex-start; gap: 14px; padding: 11px 13px; border-top: 1px solid var(--border-slate-100); }
.qd-env__rowlabel { flex-shrink: 0; width: 74px; padding-top: 3px; font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--text-slate-400); }

/* Chips */
.qd-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.qd-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 11.5px; font-weight: 600; border: 1px solid rgba(59,130,246,.2); background: rgba(59,130,246,.08); color: #2563eb; }
.qd-chip--ash { border-color: var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-600); }

/* Filter row */
.qd-filters { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 10px; }
.qd-filter { padding: 4px 11px; border-radius: 99px; border: 1px solid var(--border-slate-200); background: var(--bg-secondary); font-size: 11.5px; font-weight: 600; color: var(--text-slate-600); cursor: pointer; transition: all .15s ease; }
.qd-filter:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
.qd-filter.is-active { border-color: #3b82f6; background: rgba(59,130,246,.1); color: #2563eb; }
.qd-search { max-width: 220px; }

/* Case rows */
.qd-case { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid var(--border-slate-200); border-radius: 10px; margin-bottom: 6px; background: var(--bg-secondary); }
.qd-case:last-child { margin-bottom: 0; }
.qd-case__ref { font-size: 11px; font-weight: 700; color: var(--text-slate-400); flex-shrink: 0; padding-top: 1px; min-width: 62px; }
.qd-case__body { flex: 1; min-width: 0; }
.qd-case__name { font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); overflow-wrap: anywhere; }
.qd-case__meta { margin-top: 3px; font-size: 11px; color: var(--text-slate-400); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.qd-case__note { margin-top: 5px; font-size: 11.5px; color: var(--text-slate-600); border-left: 2px solid var(--border-slate-200); padding-left: 8px; overflow-wrap: anywhere; }
.qd-case__bug { color: #dc2626; font-weight: 600; }

.qd-more { width: 100%; margin-top: 8px; padding: 9px; border-radius: 10px; border: 1px dashed var(--border-slate-200); background: var(--bg-secondary); font-size: 12px; font-weight: 600; color: var(--text-slate-600); cursor: pointer; transition: background .15s ease, color .15s ease; }
.qd-more:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
.qd-more:disabled { opacity: .6; cursor: default; }

/* Rich text — scope definitions come back as stored HTML, so the tags are
   rendered rather than printed. */
.qd-prose { font-size: 12.5px; line-height: 1.65; color: var(--text-slate-700); overflow-wrap: anywhere; }
.qd-prose--plain { white-space: pre-wrap; }
.qd-prose p { margin: 0 0 8px; }
.qd-prose p:last-child { margin-bottom: 0; }
.qd-prose ul, .qd-prose ol { margin: 0 0 8px; padding-left: 20px; }
.qd-prose li { margin: 2px 0; }
.qd-prose h1, .qd-prose h2, .qd-prose h3, .qd-prose h4 { margin: 12px 0 6px; font-size: 13px; font-weight: 700; color: var(--text-slate-900); }
.qd-prose h1:first-child, .qd-prose h2:first-child, .qd-prose h3:first-child { margin-top: 0; }
.qd-prose strong { color: var(--text-slate-900); font-weight: 700; }
.qd-prose a { color: #2563eb; }
.qd-prose table { width: 100%; border-collapse: collapse; margin: 8px 0; }
.qd-prose th, .qd-prose td { border: 1px solid var(--border-slate-200); padding: 5px 8px; text-align: left; }
.qd-prose img { max-width: 100%; height: auto; border-radius: 8px; }
.qd-panel { border: 1px solid var(--border-slate-200); border-radius: 10px; padding: 13px 15px; background: var(--bg-secondary); }
.qd-panel + .qd-panel { margin-top: 10px; }

.qd-list { margin: 0; padding: 0; list-style: none; }
.qd-list li { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border-slate-100); font-size: 12.5px; color: var(--text-slate-900); line-height: 1.5; }
.qd-list li:last-child { border-bottom: none; }
.qd-list__dot { margin-top: 6px; width: 5px; height: 5px; border-radius: 99px; background: #3B82F6; flex-shrink: 0; }
.qd-list__dot--ash { background: var(--border-slate-200); }
.qd-empty { padding: 14px; border: 1px dashed var(--border-slate-200); border-radius: 10px; font-size: 12px; color: var(--text-slate-400); text-align: center; }

/* ── Dark theme ───────────────────────────────────────────────────────
   Surfaces and text already follow the theme variables; what needs lifting
   are the fixed accent colours, which are tuned for a white background and go
   muddy on a dark one. Scoped to the drawer so the pills keep the page's
   values everywhere else. */
[data-theme='dark'] .qd-drawer .ant-drawer-content,
[data-theme='dark'] .qd-drawer .ant-drawer-body { background: var(--bg-secondary); }
[data-theme='dark'] .qd-drawer .ant-drawer-mask { background: rgba(2,6,23,.62); }
[data-theme='dark'] .qd-head__avatar { color: #60A5FA; border-color: rgba(96,165,250,.28); }
[data-theme='dark'] .qd-stat--green .qd-stat__value { color: #34d399; }
[data-theme='dark'] .qd-stat--red .qd-stat__value { color: #f87171; }
[data-theme='dark'] .qd-stat--amber .qd-stat__value { color: #fbbf24; }
[data-theme='dark'] .qd-stat--blue .qd-stat__value { color: #60A5FA; }
[data-theme='dark'] .qd-chip { color: #93c5fd; border-color: rgba(96,165,250,.3); background: rgba(59,130,246,.16); }
[data-theme='dark'] .qd-chip--ash { color: var(--text-slate-600); border-color: var(--border-slate-200); background: var(--bg-slate-50); }
[data-theme='dark'] .qd-filter.is-active { color: #93c5fd; border-color: rgba(96,165,250,.45); background: rgba(59,130,246,.18); }
[data-theme='dark'] .qd-case__bug { color: #f87171; }
[data-theme='dark'] .qd-prose a { color: #93c5fd; }
[data-theme='dark'] .qd-list__dot { background: #60A5FA; }
[data-theme='dark'] .qd-drawer .qs-pill--blue { color: #93c5fd; background: rgba(59,130,246,.18); border-color: rgba(96,165,250,.32); }
[data-theme='dark'] .qd-drawer .qs-pill--green { color: #6ee7b7; background: rgba(16,185,129,.18); border-color: rgba(52,211,153,.32); }
[data-theme='dark'] .qd-drawer .qs-pill--amber { color: #fcd34d; background: rgba(245,158,11,.18); border-color: rgba(251,191,36,.32); }
[data-theme='dark'] .qd-drawer .qs-pill--red { color: #fca5a5; background: rgba(239,68,68,.18); border-color: rgba(248,113,113,.32); }
[data-theme='dark'] .qd-drawer .qs-pill--ash { color: var(--text-slate-600); background: rgba(148,163,184,.14); border-color: rgba(148,163,184,.26); }
`;

/* ── Small building blocks ─────────────────────────────────────────────── */

const Pill = ({
  tone = "ash",
  children,
}: {
  tone?: "blue" | "green" | "ash" | "amber" | "red";
  children: React.ReactNode;
}) => (
  <span className={`qs-pill qs-pill--${tone} qs-pill--sm`}>
    <span className="qs-pill__dot" />
    {children}
  </span>
);

const Sec = ({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: any;
  title: string;
  count?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="qd-sec">
    <div className="qd-sec__head">
      <span className="qd-sec__icon">
        <Icon size={13} />
      </span>
      <span className="qd-sec__title">{title}</span>
      {count !== undefined && <span className="qd-sec__count">{count}</span>}
    </div>
    {children}
  </section>
);

/**
 * Scope prose is stored as rich text, so the tags have to be rendered rather
 * than printed. Older records hold plain strings, which would show as one long
 * unbroken line through the viewer — those keep their line breaks instead.
 */
const RichText = ({ value }: { value?: string | null }) => {
  const text = String(value || "");
  const isHtml = /<[a-z][\s\S]*>/i.test(text);
  return isHtml ? (
    <div className="qd-prose">
      <TiptapViewer content={text} />
    </div>
  ) : (
    <p className="qd-prose qd-prose--plain">{text}</p>
  );
};

const Fact = ({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) => (
  <div className={`qd-fact${wide ? " qd-fact--wide" : ""}`}>
    <dt>{label}</dt>
    <dd>{value ?? "—"}</dd>
  </div>
);

const Stat = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "green" | "red" | "amber" | "blue";
}) => (
  <div className={`qd-stat${tone ? ` qd-stat--${tone}` : ""}`}>
    <span className="qd-stat__label">{label}</span>
    <span className="qd-stat__value">{value}</span>
  </div>
);

/** Shared chrome: sticky header, scrolling body, loading and error states. */
const DrawerShell = ({
  open,
  onClose,
  width,
  eyebrow,
  title,
  pills,
  meta,
  onOpenFull,
  openFullLabel,
  loading,
  error,
  hasData,
  children,
}: {
  open: boolean;
  onClose: () => void;
  width: number;
  eyebrow: string;
  title: string;
  pills?: React.ReactNode;
  meta?: React.ReactNode;
  onOpenFull?: () => void;
  openFullLabel: string;
  loading: boolean;
  error: string | null;
  hasData: boolean;
  children: React.ReactNode;
}) => (
  <Drawer
    open={open}
    onClose={onClose}
    placement="right"
    width={width}
    className="qd-drawer"
    closeIcon={null}
    styles={{ header: { display: "none" }, body: { padding: 0 } }}
    destroyOnHidden={false}
  >
    <style dangerouslySetInnerHTML={{ __html: QA_DRAWER_STYLES }} />
    <div className="qd-root">
      <div className="qd-head">
        <div className="qd-head__top">
          <span className="qd-head__avatar">{initialsOf(title)}</span>
          <div className="qd-head__text">
            <span className="qd-head__eyebrow">{eyebrow}</span>
            <h2 className="qd-head__title">{title}</h2>
            {pills && <div className="qd-head__pills">{pills}</div>}
            {meta && <p className="qd-head__meta">{meta}</p>}
          </div>
          <div className="qd-head__actions">
            {onOpenFull && (
              <Tooltip title={openFullLabel}>
                <button className="qd-iconbtn" onClick={onOpenFull} aria-label={openFullLabel}>
                  <ExternalLink size={15} />
                </button>
              </Tooltip>
            )}
            <Tooltip title="Close">
              <button className="qd-iconbtn" onClick={onClose} aria-label="Close">
                <X size={15} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="qd-body">
        {loading && !hasData ? (
          <div className="qd-state">
            <ZukvoLoader size="md" message="Loading…" />
          </div>
        ) : error ? (
          <div className="qd-state">
            <NoData description={error} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  </Drawer>
);

/**
 * Fetch-on-open, keyed by id.
 *
 * Kept generic because both drawers want the same behaviour: nothing happens
 * until the drawer is opened, a re-open of the same record reuses what is
 * already in memory, and a switch to a different record clears the old one so
 * the previous run's numbers are never shown under a new name.
 */
function useDrawerRecord<T>(
  open: boolean,
  id: string | null | undefined,
  fetcher: (id: string) => Promise<T>,
  failureMessage: string,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedId = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !id) return;
    if (loadedId.current === id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetcher(id)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        loadedId.current = id;
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.response?.data?.error || failureMessage);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `fetcher` is recreated per render by callers; the id is what identifies
    // the request, so it alone decides when to go back to the server.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  return { data, setData, loading, error, loadedId };
}

/* ── Test Run ──────────────────────────────────────────────────────────── */

const RESULT_TONE: Record<string, "green" | "red" | "amber" | "ash"> = {
  Pass: "green",
  Fail: "red",
  Blocked: "amber",
  "Not Executed": "ash",
};

/**
 * Chip label → what the run endpoint expects. "Not Executed" maps to `pending`
 * because the server treats that as "no result yet", which covers rows whose
 * status was never written as well as the literal value.
 */
const RESULT_FILTERS: Array<{ label: string; value: string }> = [
  { label: "All", value: "All" },
  { label: "Pass", value: "Pass" },
  { label: "Fail", value: "Fail" },
  { label: "Blocked", value: "Blocked" },
  { label: "Not Executed", value: "pending" },
];

const PAGE_SIZE = 25;

export function TestRunDrawer({
  runId,
  open,
  onClose,
  onOpenFull,
}: {
  runId: string | null;
  open: boolean;
  onClose: () => void;
  onOpenFull?: (id: string) => void;
}) {
  const [status, setStatus] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [rowsLoading, setRowsLoading] = useState(false);

  const fetchRun = useCallback(
    (id: string) => QaSubmissionService.getRunDetail(id, { page: 1, pageSize: PAGE_SIZE }),
    [],
  );
  const { data, loading, error, loadedId } = useDrawerRecord<any>(
    open,
    runId,
    fetchRun,
    "Could not load this test run",
  );

  // The filter row starts clean on every new run — a "Fail" filter left over
  // from the previous one would silently hide most of this one.
  useEffect(() => {
    setStatus("All");
    setSearch("");
    setDebounced("");
  }, [runId]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // The first page arrives with the run itself; later pages and any filtering
  // go back to the server, so a long run never ships in full.
  useEffect(() => {
    if (data?.results) {
      setRows(data.results);
      setPagination(data.pagination);
    }
  }, [data]);

  const refetchRows = useCallback(
    async (page: number, append: boolean) => {
      if (!runId) return;
      try {
        setRowsLoading(true);
        const res = await QaSubmissionService.getRunDetail(runId, {
          page,
          pageSize: PAGE_SIZE,
          search: debounced || undefined,
          status: status === "All" ? undefined : status,
        });
        setRows((prev) => (append ? [...prev, ...(res.results || [])] : res.results || []));
        setPagination(res.pagination);
      } catch {
        /* the list keeps whatever it already had rather than emptying out */
      } finally {
        setRowsLoading(false);
      }
    },
    [runId, debounced, status],
  );

  /**
   * Only re-queries once the run itself is in hand — otherwise the very first
   * open would fire two identical requests, one from here and one from the
   * record fetch that already returns page 1.
   */
  const isFiltered = status !== "All" || !!debounced;
  const skipFirst = useRef(true);
  useEffect(() => {
    if (!open || !runId || loadedId.current !== runId) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    refetchRows(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, status]);

  useEffect(() => {
    skipFirst.current = true;
  }, [runId]);

  const counts = data?.counts || {};
  const total = Number(counts.total || 0);
  const pass = Number(counts.pass || 0);
  const fail = Number(counts.fail || 0);
  const blocked = Number(counts.blocked || 0);
  const notExecuted = Math.max(0, total - pass - fail - blocked);
  const executed = pass + fail + blocked;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      width={1040}
      eyebrow="Test Run"
      title={data?.run_name || "Test Run"}
      openFullLabel="Open the full test run"
      onOpenFull={runId && onOpenFull ? () => onOpenFull(runId) : undefined}
      loading={loading}
      error={error}
      hasData={!!data}
      pills={
        data && (
          <>
            {data.status && <Pill tone={data.status === "Completed" ? "green" : "blue"}>{data.status}</Pill>}
            <Pill tone="ash">{data.execution_type || "Manual"}</Pill>
            {total > 0 && (
              <Pill tone={executed === total ? "green" : "blue"}>
                {Math.round(pct(executed))}% executed
              </Pill>
            )}
          </>
        )
      }
      meta={
        data && (
          <>
            <span>{data.suite_name || "No suite"}</span>
            <span>·</span>
            <span>{data.scope_name || "No scope"}</span>
            {data.created_by_name && (
              <>
                <span>·</span>
                <span>{data.created_by_name}</span>
              </>
            )}
          </>
        )
      }
    >
      {data && (
        <>
          <Sec icon={CheckCircle2} title="Execution">
            <div className="qd-bar">
              {pass > 0 && <span className="is-pass" style={{ width: `${pct(pass)}%` }} />}
              {fail > 0 && <span className="is-fail" style={{ width: `${pct(fail)}%` }} />}
              {blocked > 0 && <span className="is-blocked" style={{ width: `${pct(blocked)}%` }} />}
              {notExecuted > 0 && <span className="is-none" style={{ width: `${pct(notExecuted)}%` }} />}
            </div>
            <div className="qd-stats">
              <Stat label="Total" value={total} />
              <Stat label="Passed" value={pass} tone="green" />
              <Stat label="Failed" value={fail} tone="red" />
              <Stat label="Blocked" value={blocked} tone="amber" />
              <Stat label="Not run" value={notExecuted} />
              <Stat label="Executed" value={`${Math.round(pct(executed))}%`} tone="blue" />
            </div>
          </Sec>

          <Sec icon={Layers} title="Run details">
            <dl className="qd-facts">
              <Fact label="Suite" value={data.suite_name} />
              <Fact label="Scope" value={data.scope_name} />
              <Fact label="Scenario" value={data.scenario_title} />
              <Fact label="Execution" value={data.execution_type || "Manual"} />
              <Fact label="Executed by" value={data.created_by_name} />
              <Fact label="Started" value={fmtDate(data.started_at, true)} />
              <Fact label="Completed" value={data.completed_at ? fmtDate(data.completed_at, true) : "In progress"} />
              <Fact label="Created" value={fmtDate(data.created_at)} />
            </dl>
          </Sec>

          <Sec
            icon={FlaskConical}
            title="Test cases"
            count={
              pagination
                ? `${rows.length} of ${pagination.total}${isFiltered ? " matching" : ""}`
                : undefined
            }
          >
            <div className="qd-filters">
              {RESULT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`qd-filter${status === f.value ? " is-active" : ""}`}
                  onClick={() => setStatus(f.value)}
                >
                  {f.label}
                </button>
              ))}
              <Input
                className="qd-search"
                size="small"
                allowClear
                placeholder="Search cases…"
                prefix={<Search size={13} style={{ color: "var(--text-slate-400)" }} />}
                value={search}
                onChange={(ev) => setSearch(ev.target.value)}
              />
            </div>

            {rows.length === 0 ? (
              <div className="qd-empty">
                {rowsLoading ? "Loading…" : isFiltered ? "No cases match this filter." : "No test cases in this run."}
              </div>
            ) : (
              <>
                {rows.map((r: any) => (
                  <div key={r.id} className="qd-case">
                    <span className="qd-case__ref">{r.tc_ref_id || "—"}</span>
                    <div className="qd-case__body">
                      <div className="qd-case__name">{r.name || "Untitled case"}</div>
                      <div className="qd-case__meta">
                        <Pill tone={RESULT_TONE[r.status] || "ash"}>{r.status || "Not Executed"}</Pill>
                        {r.priority && <span>{r.priority}</span>}
                        {r.test_type && (
                          <>
                            <span>·</span>
                            <span>{r.test_type}</span>
                          </>
                        )}
                        {r.bug_number && (
                          <>
                            <span>·</span>
                            <span style={{ color: "#dc2626", fontWeight: 600 }}>{r.bug_number}</span>
                          </>
                        )}
                      </div>
                      {r.notes && <div className="qd-case__note">{r.notes}</div>}
                    </div>
                  </div>
                ))}
                {pagination && rows.length < pagination.total && (
                  <button
                    type="button"
                    className="qd-more"
                    disabled={rowsLoading}
                    onClick={() => refetchRows((pagination.page || 1) + 1, true)}
                  >
                    {rowsLoading ? "Loading…" : `Load ${Math.min(PAGE_SIZE, pagination.total - rows.length)} more`}
                  </button>
                )}
              </>
            )}
          </Sec>
        </>
      )}
    </DrawerShell>
  );
}

/* ── Test Scope ────────────────────────────────────────────────────────── */

/**
 * A scope stores its sprint as a release-plan id, so the id is all the scope
 * endpoint can return. The names live on the release-plans list, which is
 * fetched at most once per session and shared by every drawer — an id is not
 * something a reviewer can read.
 */
let sprintNamesPromise: Promise<Record<string, string>> | null = null;

const loadSprintNames = () => {
  if (!sprintNamesPromise) {
    sprintNamesPromise = axios
      .get("/api/release-plans")
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        const map: Record<string, string> = {};
        list.forEach((s: any) => {
          if (s?.id) map[String(s.id)] = s.name;
        });
        return map;
      })
      .catch(() => {
        // A failed lookup shouldn't be cached as the answer — the next drawer
        // that needs a sprint name gets to try again.
        sprintNamesPromise = null;
        return {} as Record<string, string>;
      });
  }
  return sprintNamesPromise;
};

const asList = (v: any): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === "string" ? x : x?.text || x?.label || x?.name || x?.value || ""))
      .filter(Boolean);
  }
  return typeof v === "string" && v.trim() ? [v] : [];
};

export function TestScopeDrawer({
  scopeId,
  open,
  onClose,
  onOpenFull,
}: {
  scopeId: string | null;
  open: boolean;
  onClose: () => void;
  onOpenFull?: (id: string) => void;
}) {
  const fetchScope = useCallback((id: string) => QaSubmissionService.getScopeDetail(id), []);
  const { data, loading, error } = useDrawerRecord<any>(
    open,
    scopeId,
    fetchScope,
    "Could not load this test scope",
  );

  const d = data?.details || {};
  const env = d.environment || {};

  // Resolved only when this scope actually names a sprint — the id on its own
  // means nothing to the person reading the drawer.
  const [sprintNames, setSprintNames] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!open || !d.sprint) return;
    let cancelled = false;
    loadSprintNames().then((map) => {
      if (!cancelled) setSprintNames(map);
    });
    return () => {
      cancelled = true;
    };
  }, [open, d.sprint]);
  const sprintLabel = d.sprint ? sprintNames[String(d.sprint)] || d.sprint : null;
  const refs: Array<[string, any]> = [
    ["PRD", d.reqReferences?.prd],
    ["Figma", d.reqReferences?.figma],
    ["API Doc", d.reqReferences?.apiDoc],
    ["User Story", d.reqReferences?.userStory],
    ["Epic", d.reqReferences?.epic],
  ];
  const linkedRefs = refs.filter(([, url]) => !!url);
  const hasInScope = hasRichText(d.inScope);
  const hasOutScope = hasRichText(d.outScope);
  const acceptance = asList(d.acceptanceCriteria);
  const exitCriteria = asList(d.exitCriteria);
  const testingTypes = asList(d.testingTypes);

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      width={960}
      eyebrow="Test Scope"
      title={data?.name || "Test Scope"}
      openFullLabel="Open the full test scope"
      onOpenFull={scopeId && onOpenFull ? () => onOpenFull(scopeId) : undefined}
      loading={loading}
      error={error}
      hasData={!!data}
      pills={
        data && (
          <>
            {data.status && <Pill tone={data.status === "Approved" ? "green" : "blue"}>{data.status}</Pill>}
            {data.type && <Pill tone="ash">{data.type}</Pill>}
            {data.priority && <Pill tone="ash">{data.priority}</Pill>}
          </>
        )
      }
      meta={
        data && (
          <>
            <span>{data.qa_owner || "Unassigned"}</span>
            <span>·</span>
            <span>
              {fmtDate(data.start_date)} → {data.end_date ? fmtDate(data.end_date) : "open"}
            </span>
          </>
        )
      }
    >
      {data && (
        <>
          <Sec icon={Target} title="Product">
            <dl className="qd-facts">
              <Fact label="Product" value={d.product} />
              <Fact label="Release" value={d.releaseVersion} />
              <Fact label="Sprint" value={sprintLabel} />
              <Fact label="QA Owner" value={data.qa_owner} />
              <Fact label="Modules" value={asList(d.modules).join(", ") || "—"} wide />
              <Fact label="Features" value={asList(d.features).join(", ") || "—"} wide />
            </dl>
          </Sec>

          {hasRichText(d.description) && (
            <Sec icon={Layers} title="Description">
              <div className="qd-panel">
                <RichText value={d.description} />
              </div>
            </Sec>
          )}

          {(hasInScope || hasOutScope) && (
            <Sec icon={CircleSlash} title="Scope definition">
              {hasInScope && (
                <div className="qd-panel">
                  <div className="qd-sub">In scope</div>
                  <RichText value={d.inScope} />
                </div>
              )}
              {hasOutScope && (
                <div className="qd-panel">
                  <div className="qd-sub">Out of scope</div>
                  <RichText value={d.outScope} />
                </div>
              )}
            </Sec>
          )}

          {testingTypes.length > 0 && (
            <Sec icon={FlaskConical} title="Testing types" count={testingTypes.length}>
              <div className="qd-chips">
                {testingTypes.map((t) => (
                  <span key={t} className="qd-chip">
                    {t}
                  </span>
                ))}
              </div>
            </Sec>
          )}

          <Sec icon={Monitor} title="Environment">
            <div className="qd-env">
              {/* Single-value settings read as a grid; the multi-value ones are
                  chip rows, because a browser matrix joined by commas is a wall
                  of text nobody scans. */}
              <div className="qd-env__grid">
                {[
                  { label: "Environment", value: env.type },
                  { label: "Build version", value: env.buildVersion },
                  { label: "API version", value: env.apiVersion },
                  { label: "Database", value: env.database },
                ].map((f) => (
                  <div key={f.label} className="qd-env__cell">
                    <span className="qd-env__label">{f.label}</span>
                    <span className="qd-env__value">{f.value || "—"}</span>
                  </div>
                ))}
              </div>
              {[
                { label: "Browser", items: asList(env.browser) },
                { label: "OS", items: asList(env.os) },
                { label: "Device", items: asList(env.device) },
              ]
                .filter((r) => r.items.length > 0)
                .map((r) => (
                  <div key={r.label} className="qd-env__row">
                    <span className="qd-env__rowlabel">{r.label}</span>
                    <div className="qd-chips">
                      {r.items.map((v) => (
                        <span key={v} className="qd-chip qd-chip--ash">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </Sec>

          {Array.isArray(d.dependencies) && d.dependencies.length > 0 && (
            <Sec icon={AlertTriangle} title="Dependencies" count={d.dependencies.length}>
              <ul className="qd-list">
                {d.dependencies.map((dep: any, i: number) => (
                  <li key={i} style={{ justifyContent: "space-between" }}>
                    <span>{dep.name || dep}</span>
                    {dep.status && (
                      <Pill tone={dep.status === "ready" ? "green" : dep.status === "blocked" ? "red" : "amber"}>
                        {dep.status}
                      </Pill>
                    )}
                  </li>
                ))}
              </ul>
            </Sec>
          )}

          {acceptance.length > 0 && (
            <Sec icon={CheckCircle2} title="Acceptance criteria" count={acceptance.length}>
              <ul className="qd-list">
                {acceptance.map((t, i) => (
                  <li key={i}>
                    <span className="qd-list__dot" />
                    {t}
                  </li>
                ))}
              </ul>
            </Sec>
          )}

          {exitCriteria.length > 0 && (
            <Sec icon={CheckCircle2} title="Exit criteria" count={exitCriteria.length}>
              <ul className="qd-list">
                {exitCriteria.map((t, i) => (
                  <li key={i}>
                    <span className="qd-list__dot" />
                    {t}
                  </li>
                ))}
              </ul>
            </Sec>
          )}

          {linkedRefs.length > 0 && (
            <Sec icon={Link2} title="Requirement references" count={linkedRefs.length}>
              <div className="qd-chips">
                {linkedRefs.map(([label, url]) => (
                  <a
                    key={label}
                    className="qd-chip"
                    href={String(url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={11} />
                    {label}
                  </a>
                ))}
              </div>
            </Sec>
          )}

          <Sec icon={CalendarRange} title="Schedule">
            <dl className="qd-facts">
              <Fact label="Planned start" value={fmtDate(data.start_date)} />
              <Fact label="Planned end" value={fmtDate(data.end_date)} />
              <Fact label="Created" value={fmtDate(data.created_at)} />
              <Fact label="Updated" value={fmtDate(data.updated_at)} />
            </dl>
          </Sec>
        </>
      )}
    </DrawerShell>
  );
}
