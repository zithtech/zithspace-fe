"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/axios";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Panel,
  SectionTitle,
  EmptyChart,
  SectionSkeleton,
  SectionError,
  InsightCard,
  useChartColors,
  fmtDayShort,
  fmtNum,
  ACCENT,
  useSnapshotSection,
} from "./_shared";

interface VelocityData {
  days: { day: string; tickets: number; points: number }[];
  cumulative: { day: string; tickets: number; points: number }[];
  ideal: { day: string; points: number }[];
  totals: { tickets: number; points: number };
  plannedPoints: number;
  plannedTickets: number;
  insights: string[];
}

export default function VelocitySection({ sprintId }: { sprintId: string }) {
  const snapshot = useSnapshotSection<VelocityData>("velocity");
  const [data, setData] = useState<VelocityData | null>(null);
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
      .get<VelocityData>(`/api/sprint-report/${sprintId}/velocity`)
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err?.message ?? "Failed to load velocity"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sprintId, snapshot]);

  if (loading) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Velocity Progression" />
        <SectionSkeleton height={320} />
      </section>
    );
  }
  if (error) {
    return (
      <section className="space-y-4">
        <SectionTitle title="Velocity Progression" />
        <SectionError message={error} />
      </section>
    );
  }
  if (!data) return null;

  return (
    <section className="space-y-4">
      <SectionTitle title="Velocity Progression" hint="Day-by-day completion pace" />

      <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
        <VelStat
          label="Days Elapsed"
          value={`${data.days.length}`}
        />
        <VelStat
          label="Tickets Burned"
          value={fmtNum(data.totals.tickets)}
          sub={`of ${data.plannedTickets} planned`}
        />
        <VelStat
          label="Points Burned"
          value={fmtNum(data.totals.points)}
          sub={`of ${data.plannedPoints} planned`}
        />
        <VelStat
          label="Daily Avg"
          value={
            data.days.length > 0
              ? `${(data.totals.points / data.days.length).toFixed(1)} pts`
              : "—"
          }
          sub="points / day"
        />
      </div>

      <InsightCard title="Pace Insights" insights={data.insights} />

      <Panel title="Daily Completion & Burndown" hint="Bars = points done that day · Lines = cumulative">
        <BurndownChart data={data} />
      </Panel>

      <Panel title="Daily Detail">
        <DailyTable rows={data.days} cumulative={data.cumulative} />
      </Panel>
    </section>
  );
}

function VelStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-5 py-4 border-zinc-200 dark:border-zinc-800 [&:not(:last-child)]:border-r sm:[&:nth-child(4n)]:border-r-0 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
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

function BurndownChart({ data }: { data: VelocityData }) {
  const colors = useChartColors();
  const chartData = useMemo(() => {
    return data.days.map((d, idx) => ({
      day: fmtDayShort(d.day),
      pointsBurned: d.points,
      ticketsDone: d.tickets,
      cumulativePoints: data.cumulative[idx]?.points ?? 0,
      ideal: data.ideal[idx]?.points ?? null,
    }));
  }, [data]);

  if (chartData.length === 0) return <EmptyChart message="Sprint has not started" />;

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
          <CartesianGrid stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="day"
            stroke={colors.axis}
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: colors.grid }}
            tick={{ fill: colors.tick }}
          />
          <YAxis
            yAxisId="left"
            stroke={colors.axis}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: colors.tick }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={colors.axis}
            fontSize={11}
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
            labelStyle={{ color: colors.tooltipText, fontWeight: 500 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: colors.tick }}
            iconType="square"
            iconSize={10}
          />
          <Bar
            yAxisId="left"
            dataKey="pointsBurned"
            name="Points (daily)"
            fill={ACCENT}
            radius={[3, 3, 0, 0]}
            barSize={20}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativePoints"
            name="Cumulative"
            stroke={colors.isDark ? "#34d399" : "#10b981"}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
          {data.ideal.length > 0 ? (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ideal"
              name="Ideal (burndown)"
              stroke={colors.axis}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const PAGE_SIZE = 14;

function DailyTable({
  rows,
  cumulative,
}: {
  rows: VelocityData["days"];
  cumulative: VelocityData["cumulative"];
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, rows.length);
  const slice = rows.slice(start, end);

  if (rows.length === 0) return <EmptyChart message="No days to show" />;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-5">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500 dark:text-zinc-400">
              <th className="px-5 py-2.5 text-left">Day</th>
              <th className="px-5 py-2.5 text-right">Tickets</th>
              <th className="px-5 py-2.5 text-right">Points</th>
              <th className="px-5 py-2.5 text-right">Cumulative Tickets</th>
              <th className="px-5 py-2.5 text-right">Cumulative Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {slice.map((r, idx) => {
              const absoluteIdx = start + idx;
              const cum = cumulative[absoluteIdx];
              const isQuiet = r.tickets === 0;
              return (
                <tr
                  key={r.day}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                >
                  <td className="px-5 py-2.5 text-zinc-800 dark:text-zinc-200">
                    {fmtDayShort(r.day)}
                  </td>
                  <td
                    className={`px-5 py-2.5 text-right tabular-nums ${
                      isQuiet
                        ? "text-zinc-400 dark:text-zinc-600"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {r.tickets}
                  </td>
                  <td
                    className={`px-5 py-2.5 text-right tabular-nums ${
                      isQuiet
                        ? "text-zinc-400 dark:text-zinc-600"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {r.points}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {cum?.tickets ?? 0}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {cum?.points ?? 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length > PAGE_SIZE ? (
        <DailyPagination
          page={safePage}
          totalPages={totalPages}
          start={start}
          end={end}
          total={rows.length}
          onChange={setPage}
        />
      ) : null}
    </div>
  );
}

function DailyPagination({
  page,
  totalPages,
  start,
  end,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  start: number;
  end: number;
  total: number;
  onChange: (n: number) => void;
}) {
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
        Showing {start + 1}–{end} of {total} days
      </span>
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={!canPrev}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <PaginationChevron direction="left" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i).map((i) => {
          const isActive = i === page;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={`inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-md text-xs font-medium tabular-nums transition-colors ${
                isActive
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={!canNext}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <PaginationChevron direction="right" />
        </button>
      </div>
    </div>
  );
}

function PaginationChevron({ direction }: { direction: "left" | "right" }) {
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
      {direction === "left" ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}
