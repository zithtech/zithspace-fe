// src/components/performance-report/ticketPoints.ts
//
// Ticket Points — the quality score for a ticket worked in the report window,
// based on how far its tracked time ran over its estimate. Within (or under)
// estimate = full 100; overage erodes points on a stepped scale. A ticket that
// is missing an estimate or has no tracked time can't be measured, so it takes a
// flat penalty instead of being ignored.
//
// EVERY worked ticket is scored (completion is NOT required) — a delayed ticket
// must lower the average whether or not it's marked Done.
//
// Pure + dependency-free so the month-end cron can port the same table server-side.

export interface TicketPointInput {
  status: string;
  estimateHours: number; // estimate in hours
  trackedSeconds: number; // total tracked seconds (summed across the range)
}

// Overage thresholds (minutes over estimate) → points. First bucket whose upper
// bound the overage falls within wins; anything beyond the last falls to FLOOR.
const POINT_STEPS: Array<{ maxOverMin: number; points: number }> = [
  { maxOverMin: 30, points: 94 }, //   0–30 min
  { maxOverMin: 60, points: 90 }, //  30–60 min
  { maxOverMin: 90, points: 85 }, //  1h–1h30
  { maxOverMin: 120, points: 78 }, // 1h30–2h
  { maxOverMin: 180, points: 70 }, // 2h–3h
  { maxOverMin: 240, points: 62 }, // 3h–4h
  { maxOverMin: 300, points: 54 }, // 4h–5h
  { maxOverMin: 360, points: 46 }, // 5h–6h
  { maxOverMin: 420, points: 38 }, // 6h–7h
];
const FLOOR_POINTS = 30; // 7h+ over estimate
const GRACE_SECONDS = 60; // up to a minute over still counts as on-time → 100

/** Penalty applied when a ticket has no estimate or no tracked time. */
export const MISSING_DATA_PENALTY = 15;

export interface PointRule {
  range: string;
  points: number;
}

// Human-readable view of the scale above (kept in sync with POINT_STEPS + FLOOR).
// Rendered by the "How points work" drawer.
export const POINT_RULES: PointRule[] = [
  { range: 'Completed within estimate', points: 100 },
  { range: 'Up to 30 min over', points: 94 },
  { range: '30 min – 1 hr over', points: 90 },
  { range: '1 hr – 1 hr 30 min over', points: 85 },
  { range: '1 hr 30 min – 2 hr over', points: 78 },
  { range: '2 hr – 3 hr over', points: 70 },
  { range: '3 hr – 4 hr over', points: 62 },
  { range: '4 hr – 5 hr over', points: 54 },
  { range: '5 hr – 6 hr over', points: 46 },
  { range: '6 hr – 7 hr over', points: 38 },
  { range: 'More than 7 hr over', points: 30 },
];

// Per-tenant cap: normalized status → maximum achievable points. The tenant's
// END status is 100; earlier pipeline stages are reduced. Configured in Settings.
export type StatusMarks = Record<string, number>;

export function normalizeStatus(status: string): string {
  return (status || '').trim().toLowerCase();
}

/**
 * Suggested cap for a status — a keyword heuristic used ONLY to pre-fill the
 * Settings editor (delivered/end states → 100, earlier stages reduced). Admins
 * override per their own workflow; the saved marks are what scoring uses. Order
 * matters: more specific stages are checked before broader keywords.
 */
export function suggestStatusMark(status: string): number {
  const s = normalizeStatus(status);
  if (/dev\s*complete|development complete|ready for (review|qa|test)/.test(s)) return 85;
  if (/review/.test(s)) return 88;
  if (/test|qa|uat/.test(s)) return 92;
  if (/done|completed|live|deployed|closed|resolved|shipped/.test(s)) return 100;
  if (/progress|started|active|doing|wip|ongoing/.test(s)) return 65;
  if (/block|hold|paused/.test(s)) return 45;
  if (/to.?do|open|backlog|not.?started|^new$/.test(s)) return 50;
  return 80; // unknown → conservative default
}

/** The efficiency score (0–100) from tracked-vs-estimate, before any status cap. */
function efficiencyPoints(input: TicketPointInput): number {
  const hasEst = input.estimateHours > 0;
  const hasTracked = input.trackedSeconds > 0;

  // Can't measure efficiency without both → flat −15.
  if (!hasEst || !hasTracked) return 100 - MISSING_DATA_PENALTY;

  const overSec = input.trackedSeconds - input.estimateHours * 3600;
  if (overSec <= GRACE_SECONDS) return 100;

  const overMin = overSec / 60;
  for (const step of POINT_STEPS) {
    if (overMin <= step.maxOverMin) return step.points;
  }
  return FLOOR_POINTS;
}

/**
 * Final points (0–100) for one worked ticket: efficiency capped by the ticket's
 * status. `statusMarks` is the tenant's saved status→cap map; a status not in it
 * (or no map at all) is uncapped (cap 100), so scoring is unchanged until the
 * tenant configures marks.
 */
export function ticketPoints(input: TicketPointInput, statusMarks?: StatusMarks): number {
  const base = efficiencyPoints(input);
  const cap = statusMarks ? statusMarks[normalizeStatus(input.status)] ?? 100 : 100;
  return Math.min(base, cap);
}
