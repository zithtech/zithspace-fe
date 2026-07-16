"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import TimelineSection from "./TimelineSection";
import ScopeChangeSection from "./ScopeChangeSection";
import VelocitySection from "./VelocitySection";
import BottlenecksSection from "./BottlenecksSection";
import HotspotsSection from "./HotspotsSection";
import QualitySection from "./QualitySection";
import AiNarrativeSection from "./AiNarrativeSection";
import { SnapshotContext } from "./_shared";
import { SprintReportsService } from "@/services/sprintReportsService";
import { downloadReportPdf, downloadReportDocx } from "./reportExport";

type DistRow = { label: string; count: number; points?: number };

type AssigneeRow = {
  assigneeId: string | null;
  assigneeName: string;
  total: number;
  completed: number;
  points: number;
  completedPoints: number;
};

type ContributorRow = {
  userId: string | null;
  userName: string;
  totalAssigned: number;
  ticketsCompleted: number;
  pointsDelivered: number;
  bugsFixed: number;
  criticalHandled: number;
  avgCompletionDays: number | null;
};

interface SprintReport {
  overview: {
    sprintId: string;
    sprintName: string | null;
    goal: string | null;
    status: string | null;
    projectId: string | null;
    projectName: string | null;
    projectCode: string | null;
    startDate: string | null;
    endDate: string | null;
    durationDays: number | null;
    // Planned vs actual dates + sprint-level slip (added to the API; older stored
    // snapshots may not have them, so all are optional).
    plannedStartDate?: string | null;
    plannedEndDate?: string | null;
    actualStartDate?: string | null;
    actualEndDate?: string | null;
    delayDays?: number | null;
    teamSize: number;
    totalTickets: number;
    plannedStoryPoints: number;
    completedStoryPoints: number;
    completionPct: number;
    pointCompletionPct: number;
    spilloverPct: number;
    addedAfterStart: number;
    addedAfterStartPct: number;
    bugCount: number;
    featureCount: number;
    bugRatioPct: number;
    qaTickets: number;
    blockedTickets: number;
    healthScore: number;
    healthBand: "Healthy" | "Moderate Risk" | "High Risk" | "Critical Sprint";
  };
  ticketDistribution: {
    byType: DistRow[];
    byStatus: DistRow[];
    byPriority: DistRow[];
    byStoryPointBucket: DistRow[];
    byAssignee: AssigneeRow[];
  };
  contribution: ContributorRow[];
}

const ACCENT = "#6366f1"; // indigo-500
const PIE_PALETTE_LIGHT = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"];
const PIE_PALETTE_DARK = ["#818cf8", "#38bdf8", "#34d399", "#fbbf24", "#f87171", "#c084fc", "#2dd4bf"];

const HEALTH_BAND_STYLES: Record<
  SprintReport["overview"]["healthBand"],
  { text: string; bg: string; border: string; dot: string }
> = {
  Healthy: {
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  "Moderate Risk": {
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },
  "High Risk": {
    text: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-500/10",
    border: "border-orange-200 dark:border-orange-500/30",
    dot: "bg-orange-500",
  },
  "Critical Sprint": {
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
};

function fmtDate(d: string | null): string {
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

function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n}%`;
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

interface SprintReportViewProps {
  sprintId: string;
}

/** Tab order = on-page render order. `id` is the scroll anchor + spy target. */
const SECTIONS: { id: string; label: string }[] = [
  { id: "narrative", label: "AI Sprint Narrative" },
  { id: "bottlenecks", label: "Bottlenecks" },
  { id: "distribution", label: "Ticket Distribution" },
  { id: "contribution", label: "Contribution" },
  { id: "scope", label: "Scope Change" },
  { id: "velocity", label: "Velocity Progression" },
  { id: "timeline", label: "Delay & Timeline" },
  { id: "hotspots", label: "Hot Features & Modules" },
  { id: "quality", label: "Quality & Complexity" },
  { id: "conclusion", label: "Conclusion" },
];

/** Nearest scrollable ancestor, or null when the document/window scrolls. */
function getScrollParent(node: Element | null): HTMLElement | null {
  let el = node?.parentElement ?? null;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      el.scrollHeight > el.clientHeight
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * Scroll-spy: returns the id of the section currently below the sticky header.
 * `offset` is the sticky chrome height so a section activates as its top clears it.
 * `root` is the scroll container (null = window) so rootMargin is measured correctly.
 */
function useScrollSpy(ids: string[], offset: number, root: HTMLElement | null): string {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join(",");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      { root, rootMargin: `-${Math.round(offset)}px 0px -62% 0px`, threshold: 0 }
    );
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key, offset, root]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}

function SectionTabs({
  sections,
  activeId,
  offset,
  scrollRoot,
}: {
  sections: { id: string; label: string }[];
  activeId: string;
  offset: number;
  scrollRoot: HTMLElement | null;
}) {
  const navRef = useRef<HTMLElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const animRef = useRef<number | null>(null);

  // Keep the active tab in view as the user scrolls the page (horizontal only).
  useEffect(() => {
    const btn = btnRefs.current[activeId];
    if (btn) btn.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  // Cancel any in-flight scroll animation on unmount.
  useEffect(() => {
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleClick = (id: string) => {
    if (animRef.current != null) cancelAnimationFrame(animRef.current);

    const desired = offset + 12; // where the section top should sit below the bar
    const scroller: HTMLElement | Window = scrollRoot ?? window;
    const getTop = () => (scrollRoot ? scrollRoot.scrollTop : window.scrollY);
    const setTop = (top: number) =>
      scrollRoot ? scrollRoot.scrollTo({ top }) : window.scrollTo({ top });

    // Target scrollTop that puts the section top at `desired` below the container top.
    const targetFor = (el: HTMLElement): number => {
      const rootTop = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
      return getTop() + (el.getBoundingClientRect().top - rootTop - desired);
    };

    const cancel = () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      scroller.removeEventListener("wheel", cancel);
      scroller.removeEventListener("touchstart", cancel);
    };
    // Hand control back to the user the moment they scroll themselves.
    scroller.addEventListener("wheel", cancel, { passive: true });
    scroller.addEventListener("touchstart", cancel, { passive: true });

    let frames = 0;
    let settled = 0;
    // Single eased animation. The target is recomputed every frame, so it glides
    // smoothly even as lazy sections load and shift the layout underneath it.
    const tick = () => {
      const el = document.getElementById(id);
      if (!el) {
        cancel();
        return;
      }
      const diff = targetFor(el) - getTop();
      frames += 1;
      if (Math.abs(diff) <= 1.5) {
        settled += 1;
        if (settled >= 5 || frames > 220) {
          setTop(getTop() + diff);
          cancel();
          return;
        }
      } else {
        settled = 0;
      }
      setTop(getTop() + diff * 0.2);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  };

  return (
    <nav
      ref={navRef}
      className="flex gap-0.5 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {sections.map((s) => {
        const active = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            ref={(el) => {
              btnRefs.current[s.id] = el;
            }}
            onClick={() => handleClick(s.id)}
            className={[
              "relative whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors",
              "border-b-2 -mb-px",
              active
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200",
            ].join(" ")}
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

function SectionAnchor({
  id,
  offset,
  children,
}: {
  id: string;
  offset: number;
  children: React.ReactNode;
}) {
  return (
    <div id={id} style={{ scrollMarginTop: offset + 12 }}>
      {children}
    </div>
  );
}

export default function SprintReportView({ sprintId }: SprintReportViewProps) {
  const { user } = useAuth();
  const hasPrime = !user?.subscriptionFeatures ? true : user.subscriptionFeatures.includes('work_tickets_reports_prime');
  
  const activeSections = useMemo(() => {
    return SECTIONS.filter(s => s.id !== "narrative" || hasPrime);
  }, [hasPrime]);

  const [data, setData] = useState<SprintReport | null>(null);
  // The full stored snapshot (report_data) for a generated report, or null when
  // none exists yet (active/ungenerated sprint → sections fetch live).
  const [snapshot, setSnapshot] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSnapshot(null);

    (async () => {
      try {
        const { data: report, snapshot: snap } = await fetchSprintReport(sprintId);
        if (!cancelled) {
          setSnapshot(snap);
          setData(report);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load sprint report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sprintId]);

  return <SprintReportContent data={data} snapshot={snapshot} loading={loading} error={error} sprintId={sprintId} hasPrime={hasPrime} activeSections={activeSections} />;
}

function SprintReportContent({
  data,
  snapshot,
  loading,
  error,
  sprintId,
  hasPrime,
  activeSections,
}: {
  data: SprintReport | null;
  snapshot: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  sprintId: string;
  hasPrime: boolean;
  activeSections: { id: string; label: string }[];
}) {
  // Measure the sticky chrome (header + tabs) so scroll-spy + anchor offsets stay
  // accurate even as the header height changes (long goal text, wrapping chips).
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickyH, setStickyH] = useState(148);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  // Export: setting a format mounts the offscreen export layout; the effect below
  // waits for it to finish loading/rendering, then captures it to PDF or DOCX.
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

  useEffect(() => {
    if (!exporting || !data) return;
    let cancelled = false;
    const run = async () => {
      const el = exportRef.current;
      if (!el) return;
      await waitForExportReady(el);
      if (cancelled) return;
      const filename = exportFilename(data, exporting);
      try {
        if (exporting === "pdf") await downloadReportPdf(sprintId, el, filename);
        else await downloadReportDocx(el, filename);
      } catch (err) {
        console.error("Sprint report export failed", err);
      } finally {
        if (!cancelled) setExporting(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [exporting, data]);

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    setScrollRoot(getScrollParent(el));
    const update = () => setStickyH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  const activeId = useScrollSpy(
    activeSections.map((s) => s.id),
    stickyH + 4,
    scrollRoot
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <ErrorState message="No data available" />;

  return (
    <SnapshotContext.Provider value={snapshot}>
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0B0F1A]">
        <div
          ref={stickyRef}
          className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-[#0B0F1A]/90 backdrop-blur-md w-full"
        >
          <div className="mx-auto max-w-7xl px-6 pt-3 pb-2.5">
            <Header
              overview={data.overview}
              onExport={(fmt) => setExporting(fmt)}
              exporting={exporting}
            />
          </div>
          <div className="border-t border-zinc-200/70 dark:border-zinc-800/70">
            <div className="mx-auto max-w-7xl">
              <SectionTabs
                sections={activeSections}
                activeId={activeId}
                offset={stickyH}
                scrollRoot={scrollRoot}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-4 space-y-4">
          <KpiStrip overview={data.overview} />
          {hasPrime && (
            <SectionAnchor id="narrative" offset={stickyH}>
              <AiNarrativeSection sprintId={sprintId} />
            </SectionAnchor>
          )}
          <SectionAnchor id="bottlenecks" offset={stickyH}>
            <BottlenecksSection sprintId={sprintId} />
          </SectionAnchor>
          <SectionAnchor id="distribution" offset={stickyH}>
            <DistributionSection
              dist={data.ticketDistribution}
              contribution={data.contribution}
            />
          </SectionAnchor>
          <SectionAnchor id="contribution" offset={stickyH}>
            <ContributionSection rows={data.contribution} />
          </SectionAnchor>
          <SectionAnchor id="scope" offset={stickyH}>
            <ScopeChangeSection sprintId={sprintId} />
          </SectionAnchor>
          <SectionAnchor id="velocity" offset={stickyH}>
            <VelocitySection sprintId={sprintId} />
          </SectionAnchor>
          <SectionAnchor id="timeline" offset={stickyH}>
            <TimelineSection sprintId={sprintId} />
          </SectionAnchor>
          <SectionAnchor id="hotspots" offset={stickyH}>
            <HotspotsSection sprintId={sprintId} />
          </SectionAnchor>
          <SectionAnchor id="quality" offset={stickyH}>
            <QualitySection sprintId={sprintId} />
          </SectionAnchor>
          <SectionAnchor id="conclusion" offset={stickyH}>
            <ConclusionSection overview={data.overview} />
          </SectionAnchor>
          <FooterMeta sprintId={data.overview.sprintId} />
        </div>

        {/* Offscreen export layout — rendered only while exporting, captured to file. */}
        {exporting ? (
          <div
            aria-hidden
            style={{
              position: "fixed",
              top: 0,
              left: -10000,
              width: EXPORT_WIDTH,
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            <div ref={exportRef} className="bg-zinc-50 dark:bg-[#0B0F1A]">
              <SprintReportExport data={data} sprintId={sprintId} hasPrime={hasPrime} />
            </div>
          </div>
        ) : null}
      </div>
    </SnapshotContext.Provider>
  );
}

/** Width of the offscreen export layout — wide enough to trigger desktop (lg) grids. */
// 794px is exactly 210mm at 96dpi (A4 width). This prevents right-side clipping in html2pdf.
const EXPORT_WIDTH = 794;
/** One A4 page height at EXPORT_WIDTH (A4 ratio 297/210) — used to size the cover. */
const EXPORT_PAGE_HEIGHT = Math.round(EXPORT_WIDTH * (297 / 210));

/**
 * Resolves once the offscreen export layout has loaded its sections (skeletons
 * gone) and charts have had time to finish their entry animation.
 */
function waitForExportReady(el: HTMLElement, timeoutMs = 9000): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      const stillLoading = el.querySelector(".animate-pulse") != null;
      if (!stillLoading || performance.now() - start > timeoutMs) {
        // Settle delay so Recharts SVGs are fully painted before capture.
        setTimeout(resolve, 1300);
      } else {
        setTimeout(check, 150);
      }
    };
    check();
  });
}

function SprintReportExport({
  data,
  sprintId,
  hasPrime,
}: {
  data: SprintReport;
  sprintId: string;
  hasPrime: boolean;
}) {
  return (
    <div className="bg-zinc-50 dark:bg-[#0B0F1A]">
      <div className="px-8 pt-8 pb-4">
        <ExportCover overview={data.overview} hasPrime={hasPrime} />
      </div>
      <div className="html2pdf__page-break" />
      <div className="px-8 py-4 space-y-6">
        {hasPrime && <AiNarrativeSection sprintId={sprintId} printMode />}
        <BottlenecksSection sprintId={sprintId} />
        <DistributionSection
          dist={data.ticketDistribution}
          contribution={data.contribution}
          printMode
        />
        <ContributionSection rows={data.contribution} />
      </div>
      <div className="html2pdf__page-break" />
      <div className="px-8 py-4 space-y-6">
        <ScopeChangeSection sprintId={sprintId} />
        <VelocitySection sprintId={sprintId} printMode />
        <TimelineSection sprintId={sprintId} printMode />
        <HotspotsSection sprintId={sprintId} />
        <QualitySection sprintId={sprintId} />
        <ConclusionSection overview={data.overview} />
        
        <div className="pt-8 pb-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Generated from <span className="text-[#3b82f6]">Zukvo</span>
        </div>
      </div>
    </div>
  );
}

function ExportCover({ overview, hasPrime }: { overview: SprintReport["overview"]; hasPrime: boolean }) {
  const activeSections = SECTIONS.filter(s => s.id !== "narrative" || hasPrime);
  return (
    <section className="flex flex-col gap-5">
      <Header overview={overview} printMode />
      <KpiStrip overview={overview} />
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6">
        <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400 mb-4">
          Contents
        </div>
        <ol className="space-y-2.5">
          {activeSections.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center gap-3 text-sm text-zinc-800 dark:text-zinc-200"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tabular-nums">
                {i + 1}
              </span>
              <span className="font-medium">{s.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Header({
  overview,
  printMode = false,
  onExport,
  exporting = null,
}: {
  overview: SprintReport["overview"];
  printMode?: boolean;
  onExport?: (format: "pdf" | "docx") => void;
  exporting?: "pdf" | "docx" | null;
}) {
  const router = useRouter();

  // Planned dates fall back to the legacy combined fields for older snapshots.
  const plannedStart = overview.plannedStartDate ?? overview.startDate;
  const plannedEnd = overview.plannedEndDate ?? overview.endDate;
  const plannedRange =
    plannedStart || plannedEnd
      ? `${fmtDate(plannedStart)} – ${fmtDate(plannedEnd)}`
      : "Dates not set";

  const actualStart = overview.actualStartDate ?? null;
  const actualEnd = overview.actualEndDate ?? null;
  const actualRange =
    actualStart || actualEnd
      ? `${fmtDate(actualStart)} – ${actualEnd ? fmtDate(actualEnd) : "in progress"}`
      : null;

  const delayDays = overview.delayDays ?? null;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/tickets");
    }
  };

  return (
    <div>
      {!printMode ? (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 -ml-1.5 px-1.5 py-1 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <ArrowLeftIcon />
            <span>Back</span>
          </button>
          {onExport ? <ExportMenu onExport={onExport} exporting={exporting} /> : null}
        </div>
      ) : null}
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
        <span>Sprint Report</span>
        {overview.projectCode ? (
          <>
            <ChevronSep />
            <span className="text-zinc-700 dark:text-zinc-300">{overview.projectCode}</span>
          </>
        ) : null}
        {overview.projectName ? (
          <>
            <ChevronSep />
            <span className="text-zinc-600 dark:text-zinc-400 normal-case tracking-normal text-xs">
              {overview.projectName}
            </span>
          </>
        ) : null}
      </div>

      <div className="mt-1.5 flex items-start justify-between gap-5 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <h1 className="text-[19px] leading-tight font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {overview.sprintName ?? "Unnamed sprint"}
            </h1>
            {overview.status ? <StatusPill status={overview.status} /> : null}
          </div>
          {overview.goal ? (
            <p className="mt-1 max-w-2xl text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-1">
              {overview.goal}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <HeaderChip icon={<CalendarIcon />} label="Planned">
              {plannedRange}
            </HeaderChip>
            {actualRange ? (
              <HeaderChip icon={<CalendarIcon />} label="Actual">
                {actualRange}
              </HeaderChip>
            ) : null}
            <HeaderChip icon={<ClockIcon />}>
              {overview.durationDays != null ? `${overview.durationDays} days` : "Duration —"}
            </HeaderChip>
            {delayDays != null ? <DelayChip days={delayDays} /> : null}
            <HeaderChip icon={<UsersIcon />}>
              {overview.teamSize} {overview.teamSize === 1 ? "member" : "members"}
            </HeaderChip>
            <HeaderChip icon={<TicketIcon />}>
              {overview.totalTickets} {overview.totalTickets === 1 ? "ticket" : "tickets"}
            </HeaderChip>
          </div>
        </div>

        <HealthCard score={overview.healthScore} band={overview.healthBand} />
      </div>
    </div>
  );
}

function ExportMenu({
  onExport,
  exporting,
}: {
  onExport: (format: "pdf" | "docx") => void;
  exporting: "pdf" | "docx" | null;
}) {
  const busy = exporting != null;
  return (
    <div className="inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <span className="px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] font-medium text-zinc-400 dark:text-zinc-500 border-r border-zinc-200 dark:border-zinc-800">
        Download
      </span>
      <ExportButton
        label="PDF"
        busy={exporting === "pdf"}
        disabled={busy}
        onClick={() => onExport("pdf")}
      />
      <span className="w-px self-stretch bg-zinc-200 dark:bg-zinc-800" />
      <ExportButton
        label="DOC"
        busy={exporting === "docx"}
        disabled={busy}
        onClick={() => onExport("docx")}
      />
    </div>
  );
}

function ExportButton({
  label,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {busy ? <SpinnerIcon /> : <DownloadIcon />}
      {label}
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function HealthCard({
  score,
  band,
}: {
  score: number;
  band: SprintReport["overview"]["healthBand"];
}) {
  const styles = HEALTH_BAND_STYLES[band];
  const meterColor =
    band === "Healthy"
      ? "bg-emerald-500"
      : band === "Moderate Risk"
        ? "bg-amber-500"
        : band === "High Risk"
          ? "bg-orange-500"
          : "bg-rose-500";
  return (
    <div
      className={`flex items-center rounded-xl border ${styles.border} ${styles.bg} overflow-hidden break-inside-avoid`}
    >
      <div className="px-4 py-2 flex flex-col items-end justify-center min-w-[80px]">
        <span
          className={`text-[10px] uppercase tracking-[0.14em] font-medium ${styles.text}`}
        >
          Health
        </span>
        <span className="text-[22px] font-semibold tabular-nums mt-0.5 text-zinc-900 dark:text-zinc-50">
          {score}
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal ml-0.5">
            /100
          </span>
        </span>
      </div>
      <div
        className={`border-l ${styles.border} px-3.5 py-2 flex flex-col justify-center min-w-[132px]`}
      >
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${styles.text}`}
        >
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${styles.dot}`} />
          {band}
        </span>
        <div className="mt-1.5 h-1 w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
          <div
            className={`h-full ${meterColor}`}
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase();
  const styles =
    key === "completed" || key === "closed"
      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-500/30"
      : key === "active" || key === "in_progress"
        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-indigo-200 dark:ring-indigo-500/30"
        : key === "blocked" || key === "cancelled"
          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-500/30"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ring-zinc-200 dark:ring-zinc-700";
  const dot =
    key === "completed" || key === "closed"
      ? "bg-emerald-500"
      : key === "active" || key === "in_progress"
        ? "bg-indigo-500"
        : key === "blocked" || key === "cancelled"
          ? "bg-rose-500"
          : "bg-zinc-400";
  return (
    <div
      className={`flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 capitalize ${styles}`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {status.replace(/_/g, " ")}
    </div>
  );
}

function HeaderChip({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-fit items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-xs text-zinc-700 dark:text-zinc-300">
      <span className="text-zinc-400 dark:text-zinc-500 flex-shrink-0">{icon}</span>
      {label ? (
        <span className="text-[10px] uppercase tracking-[0.1em] font-medium text-zinc-400 dark:text-zinc-500 flex-shrink-0">
          {label}
        </span>
      ) : null}
      <span className="font-medium tabular-nums">{children}</span>
    </div>
  );
}

function DelayChip({ days }: { days: number }) {
  const onTime = days <= 0;
  const styles = onTime
    ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return (
    <div
      className={`flex w-fit items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium ${styles}`}
    >
      <ClockIcon />
      <span className="tabular-nums">
        {onTime ? "On time" : `${days} ${days === 1 ? "day" : "days"} delayed`}
      </span>
    </div>
  );
}

function ChevronSep() {
  return <span className="text-zinc-300 dark:text-zinc-700">›</span>;
}

function ArrowLeftIcon() {
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
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 100-4V8z" />
      <line x1="13" y1="6" x2="13" y2="18" strokeDasharray="2 3" />
    </svg>
  );
}

function KpiStrip({ overview }: { overview: SprintReport["overview"] }) {
  const notDone =
    overview.totalTickets - Math.round((overview.completionPct / 100) * overview.totalTickets);

  const items: { label: string; value: string; sub?: string }[] = [
    {
      label: "Completion",
      value: fmtPct(overview.completionPct),
      sub: `${overview.totalTickets} tickets`,
    },
    {
      label: "Story Points",
      value: `${fmtNum(overview.completedStoryPoints)} / ${fmtNum(overview.plannedStoryPoints)}`,
      sub: fmtPct(overview.pointCompletionPct),
    },
    {
      label: "Spillover",
      value: fmtPct(overview.spilloverPct),
      sub: `${notDone} not done`,
    },
    {
      label: "Added After Start",
      value: fmtPct(overview.addedAfterStartPct),
      sub: `${overview.addedAfterStart} tickets`,
    },
    {
      label: "Bug Ratio",
      value: fmtPct(overview.bugRatioPct),
      sub: `${overview.bugCount} bugs · ${overview.featureCount} features`,
    },
    {
      label: "Blocked",
      value: fmtNum(overview.blockedTickets),
      sub: `${overview.qaTickets} in QA/review`,
    },
  ];

  return (
    <div className="grid grid-cols-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden break-inside-avoid">
      {items.map((it, idx) => (
        <KpiCell key={it.label} item={it} idx={idx} total={items.length} />
      ))}
    </div>
  );
}

function KpiCell({
  item,
  idx,
  total,
}: {
  item: { label: string; value: string; sub?: string };
  idx: number;
  total: number;
}) {
  const cols = { base: 2, sm: 3, lg: 6 };
  const isLastInRow = (per: number) => (idx + 1) % per === 0;
  const isLastRow = (per: number) => idx >= total - (total % per === 0 ? per : total % per);

  const rightBorder = [
    !isLastInRow(cols.base) ? "border-r" : "",
    isLastInRow(cols.base) && !isLastInRow(cols.sm) ? "sm:border-r" : "",
    isLastInRow(cols.sm) && !isLastInRow(cols.lg) ? "lg:border-r" : "",
    isLastInRow(cols.base) ? "sm:border-r" : "",
    isLastInRow(cols.sm) ? "lg:border-r" : "",
  ];
  const bottomBorder = [
    !isLastRow(cols.base) ? "border-b" : "",
    isLastRow(cols.base) && !isLastRow(cols.sm) ? "sm:border-b" : "sm:border-b-0",
    isLastRow(cols.sm) && !isLastRow(cols.lg) ? "lg:border-b" : "lg:border-b-0",
  ];

  return (
    <div
      className={[
        "px-4 py-2.5 border-zinc-200 dark:border-zinc-800 transition-colors",
        "hover:bg-zinc-50 dark:hover:bg-zinc-900",
        ...rightBorder,
        ...bottomBorder,
      ].join(" ")}
    >
      <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
        {item.label}
      </div>
      <div className="mt-1 text-[20px] font-semibold leading-none text-zinc-900 dark:text-zinc-50 tabular-nums">
        {item.value}
      </div>
      {item.sub ? (
        <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{item.sub}</div>
      ) : null}
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
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

function Panel({
  title,
  children,
  hint,
}: {
  title: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 break-inside-avoid">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-3">
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{title}</span>
        {hint ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

type SortKey =
  | "tickets_desc"
  | "tickets_asc"
  | "points"
  | "completed"
  | "bugs"
  | "critical"
  | "completion_rate";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "tickets_desc", label: "Ticket count (high → low)" },
  { value: "tickets_asc", label: "Ticket count (low → high)" },
  { value: "completed", label: "Status: Completed" },
  { value: "points", label: "Story points delivered" },
  { value: "bugs", label: "Type: Bugs fixed" },
  { value: "critical", label: "Priority: High / Critical" },
  { value: "completion_rate", label: "Completion rate" },
];

type MergedUser = {
  userId: string | null;
  userName: string;
  totalAssigned: number;
  ticketsCompleted: number;
  assignedPoints: number;
  pointsDelivered: number;
  bugsFixed: number;
  criticalHandled: number;
  avgCompletionDays: number | null;
  completionRate: number;
};

function mergeAssignees(
  byAssignee: SprintReport["ticketDistribution"]["byAssignee"],
  contribution: ContributorRow[]
): MergedUser[] {
  const map = new Map<string, MergedUser>();
  const keyFor = (id: string | null, name: string) => id ?? `name:${name}`;

  for (const a of byAssignee) {
    const k = keyFor(a.assigneeId, a.assigneeName);
    map.set(k, {
      userId: a.assigneeId,
      userName: a.assigneeName,
      totalAssigned: a.total,
      ticketsCompleted: a.completed,
      assignedPoints: a.points,
      pointsDelivered: a.completedPoints,
      bugsFixed: 0,
      criticalHandled: 0,
      avgCompletionDays: null,
      completionRate: a.total > 0 ? Math.round((a.completed / a.total) * 100) : 0,
    });
  }

  for (const c of contribution) {
    const k = keyFor(c.userId, c.userName);
    const existing = map.get(k);
    if (existing) {
      existing.bugsFixed = c.bugsFixed;
      existing.criticalHandled = c.criticalHandled;
      existing.avgCompletionDays = c.avgCompletionDays;
      if (existing.pointsDelivered === 0 && c.pointsDelivered > 0) {
        existing.pointsDelivered = c.pointsDelivered;
      }
    } else {
      map.set(k, {
        userId: c.userId,
        userName: c.userName,
        totalAssigned: c.totalAssigned,
        ticketsCompleted: c.ticketsCompleted,
        assignedPoints: c.pointsDelivered,
        pointsDelivered: c.pointsDelivered,
        bugsFixed: c.bugsFixed,
        criticalHandled: c.criticalHandled,
        avgCompletionDays: c.avgCompletionDays,
        completionRate:
          c.totalAssigned > 0 ? Math.round((c.ticketsCompleted / c.totalAssigned) * 100) : 0,
      });
    }
  }

  return Array.from(map.values()).filter((u) => u.userName !== "Unassigned" || u.totalAssigned > 0);
}

function sortUsers(rows: MergedUser[], key: SortKey): MergedUser[] {
  const sorted = [...rows];
  switch (key) {
    case "tickets_desc":
      sorted.sort((a, b) => b.totalAssigned - a.totalAssigned);
      break;
    case "tickets_asc":
      sorted.sort((a, b) => a.totalAssigned - b.totalAssigned);
      break;
    case "completed":
      sorted.sort((a, b) => b.ticketsCompleted - a.ticketsCompleted);
      break;
    case "points":
      sorted.sort((a, b) => b.pointsDelivered - a.pointsDelivered);
      break;
    case "bugs":
      sorted.sort((a, b) => b.bugsFixed - a.bugsFixed);
      break;
    case "critical":
      sorted.sort((a, b) => b.criticalHandled - a.criticalHandled);
      break;
    case "completion_rate":
      sorted.sort((a, b) => b.completionRate - a.completionRate);
      break;
  }
  return sorted;
}

function DistributionSection({
  dist,
  contribution,
  printMode = false,
}: {
  dist: SprintReport["ticketDistribution"];
  contribution: ContributorRow[];
  printMode?: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("tickets_desc");

  const merged = useMemo(
    () => mergeAssignees(dist.byAssignee, contribution),
    [dist.byAssignee, contribution]
  );

  const sorted = useMemo(() => sortUsers(merged, sortKey), [merged, sortKey]);

  const topPerformers = useMemo(() => {
    const byTickets = [...merged].sort((a, b) => b.totalAssigned - a.totalAssigned)[0];
    const byPoints = [...merged].sort((a, b) => b.pointsDelivered - a.pointsDelivered)[0];
    const byBugs = [...merged].sort((a, b) => b.bugsFixed - a.bugsFixed)[0];
    const byPriority = [...merged].sort((a, b) => b.criticalHandled - a.criticalHandled)[0];
    return { byTickets, byPoints, byBugs, byPriority };
  }, [merged]);

  if (merged.length === 0) {
    return (
      <section className="space-y-3">
        <SectionTitle title="Ticket Distribution" />
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No assignees in this sprint yet.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Ticket Distribution
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Per-assignee breakdown — {merged.length}{" "}
            {merged.length === 1 ? "contributor" : "contributors"}
          </p>
        </div>
        {!printMode && (
          <GroupBySelect value={sortKey} onChange={setSortKey} printMode={printMode} />
        )}
      </div>

      <div className={`grid gap-3 ${printMode ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        <TopPerformerCard
          eyebrow="Top by Type"
          subEyebrow="Bugs fixed"
          user={topPerformers.byBugs}
          accent="rose"
          icon={<BugIcon />}
          primary={(u) => `${u.bugsFixed}`}
          primarySuffix="bugs"
          secondary={(u) =>
            `${u.totalAssigned} ticket${u.totalAssigned === 1 ? "" : "s"} assigned`
          }
          emptyMetric="bugsFixed"
        />
        <TopPerformerCard
          eyebrow="Top by Ticket Count"
          subEyebrow="Completed"
          user={topPerformers.byTickets}
          accent="indigo"
          icon={<TicketIcon />}
          primary={(u) => `${u.ticketsCompleted}/${u.totalAssigned}`}
          primarySuffix={null}
          secondary={(u) => `${u.completionRate}% completion rate`}
          emptyMetric="totalAssigned"
          showBar
        />
        <TopPerformerCard
          eyebrow="Top by Story Points"
          subEyebrow="Delivered"
          user={topPerformers.byPoints}
          accent="emerald"
          icon={<TrendUpIcon />}
          primary={(u) => `${u.pointsDelivered}`}
          primarySuffix="pts"
          secondary={(u) =>
            u.assignedPoints > 0 && u.assignedPoints !== u.pointsDelivered
              ? `of ${u.assignedPoints} assigned`
              : `${u.ticketsCompleted} tickets done`
          }
          emptyMetric="pointsDelivered"
        />
        <TopPerformerCard
          eyebrow="Top by Priority"
          subEyebrow="High / Critical"
          user={topPerformers.byPriority}
          accent="amber"
          icon={<FlagIcon />}
          primary={(u) => `${u.criticalHandled}`}
          primarySuffix="high pri"
          secondary={(u) =>
            `${u.totalAssigned} total · ${u.ticketsCompleted} done`
          }
          emptyMetric="criticalHandled"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
        <AssigneeFullTable rows={sorted} sortKey={sortKey} />
      </div>
    </section>
  );
}

function GroupBySelect({
  value,
  onChange,
  printMode = false,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
  printMode?: boolean;
}) {
  const selectedLabel =
    SORT_OPTIONS.find((o) => o.value === value)?.label ?? String(value);

  if (printMode) {
    return (
      <div className="inline-flex items-center gap-2 text-xs">
        <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
          Group by
        </span>
        <div
          className="pl-3 pr-8 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-200 font-medium"
          style={{ minWidth: "180px" }}
        >
          {selectedLabel}
        </div>
      </div>
    );
  }

  return (
    <label className="relative inline-flex items-center gap-2 text-xs">
      <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
        Group by
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortKey)}
          className="appearance-none pl-3 pr-8 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-200 font-medium cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
          <ChevronDownIcon />
        </span>
      </div>
    </label>
  );
}

type AccentTone = "indigo" | "emerald" | "rose" | "amber";

const ACCENT_TONES: Record<
  AccentTone,
  { eyebrow: string; iconBg: string; iconFg: string; bar: string }
> = {
  indigo: {
    eyebrow: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-50 dark:bg-indigo-500/15",
    iconFg: "text-indigo-600 dark:text-indigo-400",
    bar: "bg-indigo-500",
  },
  emerald: {
    eyebrow: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/15",
    iconFg: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  rose: {
    eyebrow: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-50 dark:bg-rose-500/15",
    iconFg: "text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
  },
  amber: {
    eyebrow: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-500/15",
    iconFg: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
  },
};

function TopPerformerCard({
  eyebrow,
  subEyebrow,
  user,
  accent,
  icon,
  primary,
  primarySuffix,
  secondary,
  emptyMetric,
  showBar = false,
}: {
  eyebrow: string;
  subEyebrow?: string;
  user: MergedUser | undefined;
  accent: AccentTone;
  icon: React.ReactNode;
  primary: (u: MergedUser) => string;
  primarySuffix: string | null;
  secondary: (u: MergedUser) => string;
  emptyMetric: keyof MergedUser;
  showBar?: boolean;
}) {
  const tone = ACCENT_TONES[accent];
  const hasData = user && (user[emptyMetric] as number) > 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 break-inside-avoid">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className={`text-[10px] uppercase tracking-[0.14em] font-semibold ${tone.eyebrow}`}>
            {eyebrow}
          </div>
          {subEyebrow ? (
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {subEyebrow}
            </div>
          ) : null}
        </div>
        <div
          className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${tone.iconBg} ${tone.iconFg}`}
        >
          {icon}
        </div>
      </div>

      {hasData && user ? (
        <>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar name={user.userName} />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 whitespace-normal break-words">
              {user.userName}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums leading-none text-zinc-900 dark:text-zinc-50">
              {primary(user)}
            </span>
            {primarySuffix ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{primarySuffix}</span>
            ) : null}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{secondary(user)}</div>
          {showBar ? (
            <div className="mt-3 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${tone.bar}`}
                style={{ width: `${Math.min(100, user.completionRate)}%` }}
              />
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-3 text-sm text-zinc-400 dark:text-zinc-600">
          No data
        </div>
      )}
    </div>
  );
}

function AssigneeFullTable({
  rows,
  sortKey,
}: {
  rows: MergedUser[];
  sortKey: SortKey;
}) {
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No assignees match.
      </div>
    );
  }

  const colHighlight = (col: SortKey): string =>
    col === sortKey
      ? "text-indigo-600 dark:text-indigo-400"
      : "text-zinc-500 dark:text-zinc-400";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50/60 dark:bg-zinc-900/40">
          <tr className="text-[11px] uppercase tracking-[0.12em] font-medium">
            <th className="px-5 py-2.5 text-left text-zinc-500 dark:text-zinc-400 w-12">#</th>
            <th className="px-5 py-2.5 text-left text-zinc-500 dark:text-zinc-400">Assignee</th>
            <th className={`px-5 py-2.5 text-right ${colHighlight("tickets_desc")}`}>
              Tickets
            </th>
            <th className={`px-5 py-2.5 text-right ${colHighlight("completed")}`}>Done</th>
            <th className={`px-5 py-2.5 text-right ${colHighlight("completion_rate")}`}>%</th>
            <th className={`px-5 py-2.5 text-right ${colHighlight("points")}`}>Points</th>
            <th className={`px-5 py-2.5 text-right ${colHighlight("bugs")}`}>Bugs</th>
            <th className={`px-5 py-2.5 text-right ${colHighlight("critical")}`}>High Pri</th>
            <th className="px-5 py-2.5 text-right text-zinc-500 dark:text-zinc-400">
              Avg Days
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
          {rows.map((u, idx) => (
            <tr
              key={u.userId ?? u.userName}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors break-inside-avoid"
            >
              <td className="px-5 py-3 text-zinc-400 dark:text-zinc-500 tabular-nums">
                {idx + 1}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.userName} />
                  <span className="text-zinc-800 dark:text-zinc-200 whitespace-normal break-words">{u.userName}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {u.totalAssigned}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {u.ticketsCompleted}
              </td>
              <td className="px-5 py-3 text-right">
                <CompletionPill rate={u.completionRate} />
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {u.pointsDelivered}
                {u.assignedPoints > 0 && u.assignedPoints !== u.pointsDelivered ? (
                  <span className="text-zinc-400 dark:text-zinc-600">
                    /{u.assignedPoints}
                  </span>
                ) : null}
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {u.bugsFixed > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    {u.bugsFixed}
                  </span>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-600">0</span>
                )}
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {u.criticalHandled > 0 ? (
                  <span className="text-amber-700 dark:text-amber-300 font-medium">
                    {u.criticalHandled}
                  </span>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-600">0</span>
                )}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                {u.avgCompletionDays == null ? "—" : u.avgCompletionDays.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompletionPill({ rate }: { rate: number }) {
  const tone =
    rate >= 80
      ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-200/60 dark:ring-emerald-500/30"
      : rate >= 50
        ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-200/60 dark:ring-amber-500/30"
        : rate > 0
          ? "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-200/60 dark:ring-rose-500/30"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 ring-zinc-200 dark:ring-zinc-700";
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[44px] px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ring-1 ${tone}`}
    >
      {rate}%
    </span>
  );
}

function BugIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.88 1.88" />
      <path d="M14.12 3.88L16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 116 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6z" />
      <path d="M12 20v-9" />
      <path d="M6.53 9l-2.53 1" />
      <path d="M17.47 9l2.53 1" />
      <path d="M6 14H2" />
      <path d="M22 14h-4" />
      <path d="M6.53 19l-2.53 1" />
      <path d="M17.47 19l2.53 1" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function useChartColors() {
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
    cursorFill: isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.10)",
    pieStroke: isDark ? "#18181b" : "#ffffff",
  };
}

function DonutChart({ rows }: { rows: DistRow[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const colors = useChartColors();
  if (total === 0) return <EmptyChart />;
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="flex-shrink-0 relative" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="label"
              innerRadius={56}
              outerRadius={82}
              strokeWidth={2}
              stroke={colors.pieStroke}
              paddingAngle={1}
              isAnimationActive={false}
            >
              {rows.map((_, i) => (
                <Cell key={i} fill={colors.palette[i % colors.palette.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: 8,
                fontSize: 12,
                color: colors.tooltipText,
                boxShadow: "none",
              }}
              itemStyle={{ color: colors.tooltipText }}
              labelStyle={{ color: colors.tooltipText }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {total}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            total
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {rows.map((r, i) => {
          const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
          return (
            <div key={r.label} className="flex items-center gap-3 text-sm">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: colors.palette[i % colors.palette.length] }}
              />
              <span className="text-zinc-800 dark:text-zinc-200 whitespace-normal break-words flex-1 capitalize">
                {r.label}
              </span>
              <span className="text-zinc-600 dark:text-zinc-400 tabular-nums">{r.count}</span>
              <span className="text-zinc-400 dark:text-zinc-500 tabular-nums w-10 text-right">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HorizontalBars({ rows }: { rows: DistRow[] }) {
  if (rows.length === 0) return <EmptyChart />;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const widthPct = max > 0 ? (r.count / max) * 100 : 0;
        return (
          <div key={r.label} className="space-y-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-zinc-700 dark:text-zinc-300 capitalize">
                {r.label.replace(/_/g, " ")}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                {r.count}
                {r.points ? (
                  <span className="text-zinc-400 dark:text-zinc-500 ml-2">{r.points} pts</span>
                ) : null}
              </span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all"
                style={{ width: `${widthPct}%`, background: ACCENT }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssigneeTable({ rows }: { rows: AssigneeRow[] }) {
  if (rows.length === 0) return <EmptyChart />;
  const maxTotal = Math.max(...rows.map((r) => r.total));
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
            <th className="px-5 py-2.5 text-left">Assignee</th>
            <th className="px-5 py-2.5 text-right">Tickets</th>
            <th className="px-5 py-2.5 text-right">Completed</th>
            <th className="px-5 py-2.5 text-right">Points</th>
            <th className="px-5 py-2.5 text-right">Done Pts</th>
            <th className="px-5 py-2.5 text-left w-1/4">Load</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((r) => {
            const widthPct = maxTotal > 0 ? (r.total / maxTotal) * 100 : 0;
            const donePct = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
            return (
              <tr
                key={r.assigneeId ?? r.assigneeName}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors break-inside-avoid"
              >
                <td className="px-5 py-3 text-zinc-800 dark:text-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.assigneeName} />
                    <span className="whitespace-normal break-words">{r.assigneeName}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {r.total}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {r.completed}
                  <span className="text-zinc-400 dark:text-zinc-500 ml-2">{donePct}%</span>
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {r.points}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {r.completedPoints}
                </td>
                <td className="px-5 py-3">
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${widthPct}%`, background: ACCENT }}
                    />
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

function Avatar({ name }: { name: string }) {
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

function ContributionSection({ rows }: { rows: ContributorRow[] }) {
  const insights = useMemo(() => buildContributionInsights(rows), [rows]);
  return (
    <section className="space-y-4">
      <SectionTitle title="Contribution" hint="Per-user delivery and quality signals" />
      {insights.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5">
          <div className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            Insights
          </div>
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
      ) : null}
      <Panel title="Ranked Contributors" hint="Sorted by tickets completed, then story points">
        <ContributorTable rows={rows} />
      </Panel>
      <Panel title="Story Points Delivered">
        <ContributorBarChart rows={rows} />
      </Panel>
    </section>
  );
}

function ContributorTable({ rows }: { rows: ContributorRow[] }) {
  if (rows.length === 0) return <EmptyChart />;
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
            <th className="px-5 py-2.5 text-left">User</th>
            <th className="px-5 py-2.5 text-right">Assigned</th>
            <th className="px-5 py-2.5 text-right">Completed</th>
            <th className="px-5 py-2.5 text-right">Points</th>
            <th className="px-5 py-2.5 text-right">Bugs Fixed</th>
            <th className="px-5 py-2.5 text-right">High/Critical</th>
            <th className="px-5 py-2.5 text-right">Avg Days</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((r, idx) => (
            <tr
              key={r.userId ?? r.userName}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors break-inside-avoid"
            >
              <td className="px-5 py-3 text-zinc-800 dark:text-zinc-200">
                <div className="flex items-center gap-2.5">
                  <RankBadge rank={idx + 1} />
                  <Avatar name={r.userName} />
                  <span className="whitespace-normal break-words">{r.userName}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {r.totalAssigned}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {r.ticketsCompleted}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {r.pointsDelivered}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {r.bugsFixed}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {r.criticalHandled}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                {r.avgCompletionDays == null ? "—" : r.avgCompletionDays.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const styles =
    rank === 1
      ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-500/30"
      : rank === 2
        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ring-zinc-200 dark:ring-zinc-700"
        : rank === 3
          ? "bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-200 dark:ring-orange-500/30"
          : "bg-transparent text-zinc-400 dark:text-zinc-500 ring-zinc-200 dark:ring-zinc-800";
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold tabular-nums ring-1 ${styles}`}
    >
      {rank}
    </span>
  );
}

function ContributorBarChart({ rows }: { rows: ContributorRow[] }) {
  const colors = useChartColors();
  const chartData = rows
    .filter((r) => r.pointsDelivered > 0)
    .map((r) => ({ name: r.userName, points: r.pointsDelivered }));
  if (chartData.length === 0) return <EmptyChart />;
  return (
    <div style={{ width: "100%", height: Math.max(180, chartData.length * 36) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid stroke={colors.grid} horizontal={false} />
          <XAxis
            type="number"
            stroke={colors.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: colors.tick }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke={colors.axis}
            fontSize={12}
            width={140}
            tickLine={false}
            axisLine={false}
            tick={{ fill: colors.tick }}
          />
          <Tooltip
            cursor={{ fill: colors.cursorFill }}
            contentStyle={{
              background: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
              color: colors.tooltipText,
              boxShadow: "none",
            }}
            itemStyle={{ color: colors.tooltipText }}
            labelStyle={{ color: colors.tooltipText }}
          />
          <Bar dataKey="points" fill={ACCENT} radius={[0, 3, 3, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function buildContributionInsights(rows: ContributorRow[]): string[] {
  const insights: string[] = [];
  const totalPoints = rows.reduce((s, r) => s + r.pointsDelivered, 0);
  const totalBugs = rows.reduce((s, r) => s + r.bugsFixed, 0);
  if (rows.length === 0) return insights;

  const top = [...rows].sort((a, b) => b.pointsDelivered - a.pointsDelivered)[0];
  if (top && totalPoints > 0 && top.pointsDelivered > 0) {
    const share = Math.round((top.pointsDelivered / totalPoints) * 100);
    if (share >= 30) {
      insights.push(
        `${top.userName} delivered ${share}% of total story points (${top.pointsDelivered} pts).`
      );
    }
  }

  const topBug = [...rows].sort((a, b) => b.bugsFixed - a.bugsFixed)[0];
  if (topBug && totalBugs > 0 && topBug.bugsFixed > 0) {
    const share = Math.round((topBug.bugsFixed / totalBugs) * 100);
    if (share >= 40) {
      insights.push(
        `${topBug.userName} closed ${topBug.bugsFixed} of ${totalBugs} bug${totalBugs === 1 ? "" : "s"
        } (${share}%).`
      );
    }
  }

  const idleContributors = rows.filter(
    (r) => r.totalAssigned > 0 && r.ticketsCompleted === 0
  );
  if (idleContributors.length > 0 && rows.length >= 3) {
    insights.push(
      `${idleContributors.length} user${idleContributors.length === 1 ? "" : "s"
      } had assigned work but zero completions this sprint.`
    );
  }

  const slowMovers = rows.filter(
    (r) => r.avgCompletionDays != null && r.avgCompletionDays >= 7 && r.ticketsCompleted >= 2
  );
  if (slowMovers.length > 0) {
    const worst = [...slowMovers].sort(
      (a, b) => (b.avgCompletionDays ?? 0) - (a.avgCompletionDays ?? 0)
    )[0];
    insights.push(
      `Slowest avg cycle: ${worst.userName} at ${worst.avgCompletionDays?.toFixed(1)} days per completed ticket.`
    );
  }

  return insights;
}

function EmptyChart() {
  return (
    <div className="h-32 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
      No data
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0B0F1A]">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <div className="h-8 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-24 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 animate-pulse" />
        <div className="h-64 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 animate-pulse" />
        <div className="h-96 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 animate-pulse" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0B0F1A]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-6">
          <div className="text-sm font-medium text-rose-800 dark:text-rose-300">
            Unable to load sprint report
          </div>
          <div className="mt-1 text-sm text-rose-700 dark:text-rose-400">{message}</div>
        </div>
      </div>
    </div>
  );
}

/** Loads a sprint report, preferring the stored snapshot, else computing live. */
export async function fetchSprintReport(
  sprintId: string
): Promise<{ data: SprintReport; snapshot: Record<string, any> | null }> {
  try {
    const detail = await SprintReportsService.getBySprint(sprintId);
    const report = (detail?.report ?? {}) as Record<string, any>;
    if (report.main) return { data: report.main as SprintReport, snapshot: report };
  } catch {
    // No snapshot (404) → fall through to live computation.
  }
  const live = await api.get<SprintReport>(`/api/sprint-report/${sprintId}`);
  return { data: live, snapshot: null };
}

function exportFilename(data: SprintReport, format: "pdf" | "docx"): string {
  const safe = (data.overview.sprintName || "sprint-report")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${safe || "sprint-report"}.${format === "pdf" ? "pdf" : "docx"}`;
}

/**
 * Headless export: fetches a sprint report, renders the export layout offscreen,
 * captures it to PDF/DOCX, then calls `onDone`. Used from the reports list so a
 * report can be downloaded without opening the detail page. Mount it only while
 * an export is in flight.
 */
export function SprintReportExportRunner({
  sprintId,
  format,
  onDone,
}: {
  sprintId: string;
  format: "pdf" | "docx";
  onDone: (ok: boolean) => void;
}) {
  const { user } = useAuth();
  const hasPrime = !user?.subscriptionFeatures ? true : user.subscriptionFeatures.includes('work_tickets_reports_prime');
  const [payload, setPayload] = useState<{
    data: SprintReport;
    snapshot: Record<string, any> | null;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const ranRef = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchSprintReport(sprintId);
        if (!cancelled) setPayload(res);
      } catch (err) {
        console.error("Sprint report export: fetch failed", err);
        if (!cancelled) doneRef.current(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sprintId]);

  useEffect(() => {
    if (!payload || ranRef.current) return;
    ranRef.current = true;
    (async () => {
      const el = ref.current;
      if (!el) {
        doneRef.current(false);
        return;
      }
      let ok = true;
      try {
        await waitForExportReady(el);
        const filename = exportFilename(payload.data, format);
        if (format === "pdf") await downloadReportPdf(sprintId, el, filename);
        else await downloadReportDocx(el, filename);
      } catch (err) {
        console.error("Sprint report export failed", err);
        ok = false;
      } finally {
        doneRef.current(ok);
      }
    })();
  }, [payload, format]);

  if (!payload) return null;
  return (
    <SnapshotContext.Provider value={payload.snapshot}>
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: -10000,
          width: EXPORT_WIDTH,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div ref={ref} className="bg-zinc-50 dark:bg-[#0B0F1A]">
          <SprintReportExport data={payload.data} sprintId={sprintId} hasPrime={hasPrime} />
        </div>
      </div>
    </SnapshotContext.Provider>
  );
}

function ConclusionSection({ overview }: { overview: SprintReport["overview"] }) {
  const styles = HEALTH_BAND_STYLES[overview.healthBand];

  const wins: string[] = [];
  const concerns: string[] = [];

  if (overview.completionPct >= 90) {
    wins.push(`Delivered ${fmtPct(overview.completionPct)} of committed tickets.`);
  } else if (overview.completionPct < 60) {
    concerns.push(
      `Only ${fmtPct(overview.completionPct)} of tickets reached done — significant carryover.`
    );
  }

  if (overview.pointCompletionPct >= 90) {
    wins.push(
      `Cleared ${fmtNum(overview.completedStoryPoints)} of ${fmtNum(
        overview.plannedStoryPoints
      )} story points (${fmtPct(overview.pointCompletionPct)}).`
    );
  } else if (overview.plannedStoryPoints > 0 && overview.pointCompletionPct < 60) {
    concerns.push(
      `Point completion at ${fmtPct(overview.pointCompletionPct)} — capacity or estimation gap.`
    );
  }

  if (overview.spilloverPct > 20) {
    concerns.push(`${fmtPct(overview.spilloverPct)} of work spilled over to the next sprint.`);
  } else if (overview.spilloverPct === 0 && overview.totalTickets > 0) {
    wins.push("Zero spillover — the full plan landed inside the sprint.");
  }

  if (overview.addedAfterStartPct >= 25) {
    concerns.push(
      `${fmtPct(overview.addedAfterStartPct)} of scope (${overview.addedAfterStart} ticket${overview.addedAfterStart === 1 ? "" : "s"
      }) was added after the sprint started.`
    );
  }

  if (overview.bugRatioPct >= 30) {
    concerns.push(
      `Bug ratio at ${fmtPct(overview.bugRatioPct)} (${overview.bugCount} bug${overview.bugCount === 1 ? "" : "s"
      }) — heavy reactive load.`
    );
  } else if (overview.bugCount === 0 && overview.totalTickets > 0) {
    wins.push("No bugs recorded across the sprint.");
  }

  if (overview.blockedTickets > 0) {
    concerns.push(
      `${overview.blockedTickets} ticket${overview.blockedTickets === 1 ? "" : "s"
      } ended the sprint blocked.`
    );
  }

  const verdict =
    overview.healthBand === "Healthy"
      ? "This sprint was healthy: delivery held up with limited risk signals. Carry the momentum into planning."
      : overview.healthBand === "Moderate Risk"
        ? "A solid sprint with a few pressure points. Address the concerns below before they compound next cycle."
        : overview.healthBand === "High Risk"
          ? "This sprint ran hot. Several signals need attention in retro to keep the next cycle on track."
          : "This was a critical sprint. The concerns below point to systemic planning or execution issues to resolve urgently.";

  return (
    <section className="space-y-4">
      <SectionTitle title="Conclusion" hint="Auto-summarized from sprint metrics" />

      <div
        className={`rounded-xl border ${styles.border} ${styles.bg} px-5 py-4 flex items-start gap-3`}
      >
        <span className={`mt-1 inline-block w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />
        <div>
          <div className={`text-sm font-semibold ${styles.text}`}>
            {overview.healthBand} · Health {overview.healthScore}/100
          </div>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {verdict}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ConclusionList
          title="What went well"
          tone="emerald"
          items={wins}
          empty="No standout positives surfaced from the metrics."
        />
        <ConclusionList
          title="What to watch"
          tone="rose"
          items={concerns}
          empty="No material concerns flagged by the metrics."
        />
      </div>
    </section>
  );
}

function ConclusionList({
  title,
  tone,
  items,
  empty,
}: {
  title: string;
  tone: "emerald" | "rose";
  items: string[];
  empty: string;
}) {
  const dot = tone === "emerald" ? "bg-emerald-500" : "bg-rose-500";
  const head =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-rose-700 dark:text-rose-300";
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 break-inside-avoid">
      <div className={`text-[11px] uppercase tracking-[0.12em] font-semibold mb-2.5 ${head}`}>
        {title}
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2 text-sm text-zinc-800 dark:text-zinc-200">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-2.5 leading-relaxed">
              <span
                className={`mt-1.5 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`}
              />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">{empty}</p>
      )}
    </div>
  );
}

function FooterMeta({ sprintId }: { sprintId: string }) {
  return (
    <div className="text-xs text-zinc-400 dark:text-zinc-500 pt-4 border-t border-zinc-200 dark:border-zinc-800">
      Sprint ID <span className="font-mono">{sprintId}</span>
    </div>
  );
}
