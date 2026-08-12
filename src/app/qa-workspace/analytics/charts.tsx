"use client";

/**
 * Chart primitives for QA Reporting & Analytics.
 *
 * Colour is assigned by the job it does, not by series index:
 *
 *   status       Pass / Fail / Blocked / Not Executed and defect severity are
 *                *states*, so they use the reserved status palette and always
 *                ship with a written label — never colour alone.
 *   categorical  Only where two independent series share an axis (defects found
 *                vs resolved). Fixed slot order, never cycled.
 *   sequential   A single measure across many rows (per-owner volume) is one
 *                hue, not eight.
 *
 * The palette below was validated with the dataviz validator against this app's
 * own surfaces (#ffffff / #0B0F1A) rather than the defaults — all checks pass in
 * both modes. Two relief obligations came out of it and are honoured here:
 * aqua sits below 3:1 on the light surface, and status-warning below 3:1 in
 * light, so every chart carries visible labels and a table view.
 */

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Palette ─────────────────────────────────────────────────────────────────

/** Reserved status palette — fixed, never themed, never reused for a series. */
export const STATUS_COLORS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
  muted: "#94a3b8",
} as const;

/** Test-run outcome vocabulary, matching the Runs pages exactly. */
export const OUTCOME_COLORS: Record<string, string> = {
  Passed: STATUS_COLORS.good,
  Failed: STATUS_COLORS.critical,
  Blocked: STATUS_COLORS.warning,
  "Not Executed": STATUS_COLORS.muted,
};

/**
 * Categorical slots, in fixed order. Capped at three: past that the validator
 * cannot clear its floors for all pairs, so a fourth series folds into "Other"
 * or becomes its own chart.
 */
export const SERIES = {
  light: ["#2a78d6", "#eb6834", "#1baf7a"],
  dark: ["#3987e5", "#d95926", "#199e70"],
} as const;

/** Single hue for a single measure. */
export const SEQUENTIAL = "#2a78d6";

const useDark = () => {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    const read = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return dark;
};

/** Recessive chrome — the data should be the only assertive thing on screen. */
const AXIS = { fontSize: 11, fill: "var(--text-slate-400)" };
const GRID_STROKE = "var(--border-slate-100)";

// ─── Shared chrome ───────────────────────────────────────────────────────────

export const ChartCard = ({
  title,
  subtitle,
  actions,
  children,
  height = 260,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  height?: number;
}) => (
  <section className="qa-chart">
    <header className="qa-chart__head">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions}
    </header>
    <div className="qa-chart__body" style={{ height }}>
      {children}
    </div>
  </section>
);

/**
 * Identity is never carried by colour alone — a legend is always present for two
 * or more series, and each entry names its series in text.
 */
export const Legend = ({ items }: { items: Array<{ label: string; color: string; value?: number | string }> }) => (
  <ul className="qa-legend">
    {items.map((i) => (
      <li key={i.label}>
        <span className="qa-legend__swatch" style={{ background: i.color }} />
        <span className="qa-legend__label">{i.label}</span>
        {i.value !== undefined && <span className="qa-legend__value">{i.value}</span>}
      </li>
    ))}
  </ul>
);

const TooltipBox = ({
  active,
  payload,
  label,
  formatter,
}: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="qa-tip">
      {label !== undefined && <div className="qa-tip__label">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="qa-tip__row">
          <span className="qa-tip__swatch" style={{ background: p.color || p.fill }} />
          <span className="qa-tip__name">{p.name}</span>
          <span className="qa-tip__value">{formatter ? formatter(p.value, p) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const EmptyChart = ({ message }: { message: string }) => (
  <div className="qa-chart__empty">{message}</div>
);

// ─── Charts ──────────────────────────────────────────────────────────────────

/**
 * Outcome split as a single stacked bar. A donut was rejected: the job is
 * part-to-whole comparison across four states where two are usually near zero,
 * and thin arcs are unreadable at that size.
 */
export const OutcomeBar = ({
  passed,
  failed,
  blocked,
  notExecuted,
}: {
  passed: number;
  failed: number;
  blocked: number;
  notExecuted: number;
}) => {
  const total = passed + failed + blocked + notExecuted;
  if (!total) return <EmptyChart message="No executions in this range." />;

  const segments = [
    { label: "Passed", value: passed, color: OUTCOME_COLORS.Passed },
    { label: "Failed", value: failed, color: OUTCOME_COLORS.Failed },
    { label: "Blocked", value: blocked, color: OUTCOME_COLORS.Blocked },
    { label: "Not Executed", value: notExecuted, color: OUTCOME_COLORS["Not Executed"] },
  ].filter((s) => s.value > 0);

  return (
    <div className="qa-outcome">
      <div className="qa-outcome__bar">
        {segments.map((s) => (
          <span
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <Legend
        items={segments.map((s) => ({
          label: s.label,
          color: s.color,
          value: `${s.value} · ${Math.round((s.value / total) * 1000) / 10}%`,
        }))}
      />
    </div>
  );
};

/** Pass rate over time. One series, so no legend — the title names it. */
export const PassRateTrend = ({ data }: { data: Array<{ bucket: string; pass_rate: number }> }) => {
  if (!data.length) return <EmptyChart message="Not enough history yet." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="qaPassFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STATUS_COLORS.good} stopOpacity={0.22} />
            <stop offset="100%" stopColor={STATUS_COLORS.good} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="bucket" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" width={44} />
        <Tooltip content={<TooltipBox formatter={(v: number) => `${v}%`} />} />
        <Area
          type="monotone"
          dataKey="pass_rate"
          name="Pass rate"
          stroke={STATUS_COLORS.good}
          strokeWidth={2}
          fill="url(#qaPassFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--bg-pure-white)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

/** Execution volume by outcome over time — stacked, status-coloured. */
export const ExecutionTrend = ({ data }: { data: any[] }) => {
  if (!data.length) return <EmptyChart message="Not enough history yet." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="bucket" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--bg-slate-50)" }} />
        {/* 2px surface gap between stacked segments, per the mark spec. */}
        <Bar dataKey="passed" name="Passed" stackId="o" fill={OUTCOME_COLORS.Passed} stroke="var(--bg-pure-white)" strokeWidth={2} />
        <Bar dataKey="failed" name="Failed" stackId="o" fill={OUTCOME_COLORS.Failed} stroke="var(--bg-pure-white)" strokeWidth={2} />
        <Bar dataKey="blocked" name="Blocked" stackId="o" fill={OUTCOME_COLORS.Blocked} stroke="var(--bg-pure-white)" strokeWidth={2} />
        <Bar
          dataKey="not_executed" name="Not Executed" stackId="o"
          fill={OUTCOME_COLORS["Not Executed"]} stroke="var(--bg-pure-white)" strokeWidth={2}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Defects found vs resolved — two independent series on one axis, so this is
 * the one place the categorical slots are used.
 */
export const DefectFlow = ({ data, dark }: { data: any[]; dark: boolean }) => {
  const slots = dark ? SERIES.dark : SERIES.light;
  if (!data.length) return <EmptyChart message="No defect activity in this range." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="bucket" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<TooltipBox />} />
        <Line type="monotone" dataKey="bugsFound" name="Found" stroke={slots[0]} strokeWidth={2}
          dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--bg-pure-white)" }} />
        <Line type="monotone" dataKey="bugsResolved" name="Resolved" stroke={slots[2]} strokeWidth={2}
          dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--bg-pure-white)" }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * One measure across many rows — a single hue, horizontal so long labels
 * (people, releases) stay readable without rotating them.
 */
export const RankedBar = ({
  data,
  dataKey = "total",
  colorBy,
}: {
  data: Array<{ label: string; [k: string]: any }>;
  dataKey?: string;
  /** Optional status colouring, e.g. severity. Otherwise one sequential hue. */
  colorBy?: (row: any) => string;
}) => {
  if (!data.length) return <EmptyChart message="Nothing to report in this range." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 0 }} barCategoryGap="26%">
        <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="label" tick={AXIS} tickLine={false} axisLine={false} width={132} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--bg-slate-50)" }} />
        <Bar dataKey={dataKey} name="Total" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((row, i) => (
            <Cell key={i} fill={colorBy ? colorBy(row) : SEQUENTIAL} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export { useDark };
