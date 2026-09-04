/**
 * Shared types and styling for the QA Playbooks surface — the catalog, the
 * reader, and the generate drawer.
 *
 * Palette follows the QA Space convention: blue for the primary accent, green
 * for anything confirmed or selected, ash and light grey for structure. Red is
 * reserved for destructive actions, so risk levels use amber and a deep rose
 * only as text/border accents rather than as filled destructive states.
 */

export type PlaybookLevel = "junior" | "intermediate" | "senior" | "expert";
export type PlaybookRisk = "low" | "medium" | "high" | "critical";

/**
 * public     free, every workspace can use it
 * premium    every workspace sees it; the body needs an unlock
 * workspace  this workspace's own playbook, invisible to everyone else
 */
export type PlaybookVisibility = "public" | "premium" | "workspace";
export type PlaybookStatus = "draft" | "published" | "archived";

export interface PlaybookSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  version: string;
  visibility: PlaybookVisibility;
  status: PlaybookStatus;
  /** Owned by the viewing workspace. */
  isOwn: boolean;
  /** Premium and not unlocked — listed, but the body is withheld. */
  locked: boolean;
  priceCredits: number | null;
  priceAmount: string | null;
  priceCurrency: string;
  lastUpdatedAt: string;
  itemCount: number;
  levelCounts: Record<string, number>;
  categories: string[];
}

/** Where a recommendation points the reader next. See constants.ts on the API. */
export type PlaybookReferenceType =
  | "qa_guide"
  | "security_standard"
  | "real_test_cases"
  | "real_application"
  | "tutorial"
  | "standard";

export interface PlaybookReference {
  type: PlaybookReferenceType;
  name: string;
  description?: string;
  /** Optional: "OWASP ASVS §2.1" is a reference with nothing to click. */
  url?: string | null;
}

export const REFERENCE_TYPE_ORDER: PlaybookReferenceType[] = [
  "qa_guide",
  "security_standard",
  "real_test_cases",
  "real_application",
  "tutorial",
  "standard",
];

export const REFERENCE_TYPES: Record<
  PlaybookReferenceType,
  { label: string; emoji: string; hint: string }
> = {
  qa_guide: {
    label: "QA Guide",
    emoji: "📚",
    hint: "A written walkthrough of testing this feature",
  },
  security_standard: {
    label: "Security Standard",
    emoji: "🔐",
    hint: "OWASP and friends — the security position on it",
  },
  real_test_cases: {
    label: "Real Test Cases",
    emoji: "🧪",
    hint: "A published list of cases to compare yours against",
  },
  real_application: {
    label: "Real Application",
    emoji: "🌐",
    hint: "Something live to try the check on",
  },
  tutorial: { label: "Tutorial", emoji: "🎥", hint: "A video or course covering it" },
  standard: {
    label: "Standard",
    emoji: "📋",
    hint: "The spec itself — RFC, WCAG, an API standard",
  },
};

export interface PlaybookItem {
  id: string;
  key: string;
  sectionId: string;
  title: string;
  whatToTest: string | null;
  examples: (string | { input: string; verdict: string })[];
  expected: string | null;
  steps: string[];
  level: PlaybookLevel;
  category: string;
  risk: PlaybookRisk;
  whyItMatters: string | null;
  /** The state the system must be in before the check means anything. */
  preconditions: string[];
  /** Variants worth a second pass — empty, maximum, unicode, concurrent. */
  edgeCases: string[];
  references: PlaybookReference[];
  appliesWhen: Record<string, string[]>;
}

export interface PlaybookSection {
  id: string;
  key: string;
  parentSectionId: string | null;
  title: string;
  description: string | null;
  /** Empty on a locked playbook — `itemCount` still reports what is behind it. */
  items: PlaybookItem[];
  itemCount: number;
  sections: PlaybookSection[];
}

export interface PlaybookDetail extends Omit<PlaybookSummary, "categories"> {
  overview: string | null;
  categories: string[];
  sections: PlaybookSection[];
  versions: { version: string; changelog: string | null; itemCount: number; publishedAt: string }[];
  /** This workspace has asked for access and no decision has been made yet. */
  pendingRequest: boolean;
}

/** What the author form posts — the draft shape, before it has database ids. */
export interface DraftItem {
  key?: string;
  title: string;
  what_to_test: string;
  examples: (string | { input: string; verdict: string })[];
  expected: string;
  steps: string[];
  level: PlaybookLevel;
  category: string;
  risk: PlaybookRisk;
  why_it_matters: string;
  preconditions: string[];
  edge_cases: string[];
  references: PlaybookReference[];
  applies_when: Record<string, string[]>;
}

export interface DraftSection {
  key?: string;
  title: string;
  description?: string | null;
  items: DraftItem[];
  sections: DraftSection[];
}

export const LEVEL_ORDER: PlaybookLevel[] = ["junior", "intermediate", "senior", "expert"];

export const LEVEL_LABELS: Record<PlaybookLevel, string> = {
  junior: "Junior",
  intermediate: "Intermediate",
  senior: "Senior",
  expert: "Expert",
};

export const RISK_LABELS: Record<PlaybookRisk, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  critical: "Critical risk",
};

export const VISIBILITY_LABELS: Record<PlaybookVisibility, string> = {
  public: "Public",
  premium: "Premium",
  workspace: "My workspace",
};

/** How a price reads on a card. Credits win when both are set. */
export function priceLabel(p: {
  priceCredits: number | null;
  priceAmount: string | null;
  priceCurrency: string;
}): string {
  if (p.priceCredits != null) return `${p.priceCredits} credits`;
  if (p.priceAmount != null) return `${p.priceCurrency} ${p.priceAmount}`;
  return "On request";
}

/** An empty playbook the author form starts from. */
export function emptyDraftSection(title = "New section"): DraftSection {
  return { title, description: "", items: [], sections: [] };
}

export function emptyDraftItem(title = "New recommendation"): DraftItem {
  return {
    title,
    what_to_test: "",
    examples: [],
    expected: "",
    steps: [],
    level: "junior",
    category: "functional",
    risk: "medium",
    why_it_matters: "",
    preconditions: [],
    edge_cases: [],
    references: [],
    applies_when: {},
  };
}

/** Every item in a section tree, depth first — used for select-all and counts. */
export function flattenItems(sections: PlaybookSection[]): PlaybookItem[] {
  return sections.flatMap((s) => [...s.items, ...flattenItems(s.sections)]);
}

export const PLAYBOOK_STYLES = `
.dh-shell { display: flex; height: calc(100vh - 64px); background: var(--bg-pure-white); overflow: hidden; position: relative; }
.dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
.dh-main-scroll { flex: 1; overflow-y: auto; padding: 14px 16px 24px; background: transparent; }

/* ── Header row, matched to the rest of QA Space ────────────────────────── */
.sc-header {
  position: sticky; top: 0; z-index: 100;
  margin: 0; padding: 11px 16px;
  min-height: 54px;
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: var(--bg-pure-white);
  border-bottom: 1px solid var(--border-slate-200);
  flex-shrink: 0;
}
/* The back button is the page's own title, so it carries a title's weight
   rather than reading as one more small control. */
.sc-header .ant-btn-text {
  height: 32px; padding: 0 10px 0 6px; border-radius: 8px;
  font-size: 13.5px; font-weight: 800; letter-spacing: -.01em; color: var(--text-slate-900);
}
[data-theme='dark'] .sc-header .ant-btn-text { color: #f1f5f9; }
.sc-header .ant-btn-text:hover { color: #2563eb !important; background: rgba(59,130,246,.07) !important; }
[data-theme='dark'] .sc-header { background: #0f1419; border-bottom-color: #1f2937; }
.sc-header-controls { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; flex-wrap: wrap; }
.sc-header-right { flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px; }

/* ── Filter pills ───────────────────────────────────────────────────────── */
.pb-pills { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pb-pill {
  height: 26px; padding: 0 11px; border-radius: 999px; cursor: pointer;
  font-size: 11.5px; font-weight: 600; letter-spacing: -.005em;
  color: var(--text-slate-500); background: transparent;
  border: 1px solid var(--border-slate-200);
  transition: color .15s ease, background .15s ease, border-color .15s ease;
}
.pb-pill:hover { color: #2563eb; border-color: rgba(59,130,246,.35); }
.pb-pill.is-on { color: #2563eb; background: rgba(59,130,246,.09); border-color: rgba(59,130,246,.28); }
[data-theme='dark'] .pb-pill { border-color: #1f2937; color: #94a3b8; }

/* ── Catalog hero ───────────────────────────────────────────────────────── */
.pb-hero {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; flex-shrink: 0;
  /* A faint blue wash behind the badge and title, fading out well before the
     stats — enough to lift the band off the page without becoming a colour. */
  background: linear-gradient(90deg, rgba(59,130,246,.06), rgba(59,130,246,0) 42%),
              var(--bg-slate-50);
  border-bottom: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-hero {
  background: linear-gradient(90deg, rgba(59,130,246,.1), rgba(59,130,246,0) 42%), #0f1419;
  border-bottom-color: #1f2937;
}
.pb-hero__badge {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2);
}
/* min-width:0 is what lets the one-line summary ellipsise instead of forcing
   the row wider than the pane. */
.pb-hero__text { flex: 1; min-width: 0; }
.pb-hero__title { font-size: 15px; font-weight: 800; letter-spacing: -.015em; color: var(--text-slate-900); margin: 0; }
[data-theme='dark'] .pb-hero__title { color: #f1f5f9; }
.pb-hero__sub {
  font-size: 12px; line-height: 1.5; color: var(--text-slate-500); margin: 2px 0 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* Total recommendations, held at the right end of the hero row. */
.pb-hero__stat {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px;
  height: 34px; padding: 0 12px; border-radius: 9px;
  color: var(--text-slate-400);
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-hero__stat { background: #0b0f14; border-color: #1f2937; }
.pb-hero__stat b {
  font-size: 14px; font-weight: 800; letter-spacing: -.02em; color: var(--text-slate-900);
}
[data-theme='dark'] .pb-hero__stat b { color: #f1f5f9; }
.pb-hero__stat span {
  font-size: 9.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
  color: var(--text-slate-500);
}
.pb-hero__stats { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; }
@media (max-width: 900px) { .pb-hero__stats { display: none; } }
@media (max-width: 700px) { .pb-hero__stat { display: none; } }

/* Reader search — sized to sit level with the segmented control and the
   category pill, both of which are 30px tall. */
.pb-search.ant-input-affix-wrapper {
  width: 216px; height: 30px; border-radius: 8px;
  border-color: var(--border-slate-200); background: var(--bg-pure-white);
}
.pb-search.ant-input-affix-wrapper:hover { border-color: rgba(59,130,246,.4); }
.pb-search.ant-input-affix-wrapper-focused {
  border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,.12);
}
.pb-search .ant-input { font-size: 12px; background: transparent; }
[data-theme='dark'] .pb-search.ant-input-affix-wrapper { background: #0b0f14; border-color: #1f2937; }
.pb-search.is-wide.ant-input-affix-wrapper { width: 300px; }
@media (max-width: 900px) { .pb-search.ant-input-affix-wrapper { width: 150px; } .pb-search.is-wide.ant-input-affix-wrapper { width: 200px; } }

/* ── Catalog toolbar (under the hero) ───────────────────────────────────── */
.pb-toolbar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 16px; flex-shrink: 0;
  background: var(--bg-pure-white);
  border-bottom: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-toolbar { background: #0b0f14; border-bottom-color: #1f2937; }
/* The sort control is a peer of the search box: the dropdown's own compact
   trigger is 30px, so this only has to hold the width and match the type size. */
.pb-toolbar__sort { width: 190px; }
.pb-toolbar__sort .sd-trigger { height: 30px; padding: 0 10px; }
.pb-toolbar__sort .sd-trigger-value { font-size: 12px; }
.pb-toolbar__actions { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; }
@media (max-width: 700px) { .pb-toolbar__actions { margin-left: 0; } }

/* Buttons in the playbook surface: one height, one radius, and a hover that
   moves toward blue rather than antd's default grey. */
.pb-btn.ant-btn {
  height: 32px; padding: 0 13px; border-radius: 8px;
  font-size: 12px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 6px;
  transition: color .15s ease, border-color .15s ease, background .15s ease, box-shadow .15s ease;
}
.pb-btn.ant-btn .anticon, .pb-btn.ant-btn svg { display: block; }
.pb-btn.ant-btn-default {
  color: var(--text-slate-500); border-color: var(--border-slate-200); background: var(--bg-pure-white);
}
.pb-btn.ant-btn-default:hover {
  color: #2563eb !important; border-color: rgba(59,130,246,.45) !important;
  background: rgba(59,130,246,.05) !important;
}
[data-theme='dark'] .pb-btn.ant-btn-default { background: #0f1419; border-color: #1f2937; color: #94a3b8; }
.pb-btn.is-sm.ant-btn { height: 28px; padding: 0 10px; font-size: 11.5px; }
.pb-group__action { margin-left: auto; }
.pb-btn.ant-btn-primary { box-shadow: 0 1px 2px rgba(37,99,235,.28); }
.pb-btn.ant-btn-primary:hover { box-shadow: 0 2px 8px rgba(37,99,235,.28); }

/* Request-queue table cells: details wrap to a readable column instead of
   stretching the table, and a decision note reads as a footnote to its tag. */
.pb-cell__wrap { display: inline-block; max-width: 340px; white-space: normal; line-height: 1.5; color: var(--text-slate-500); }
.pb-cell__note { display: block; margin-top: 3px; font-size: 11px; color: var(--text-slate-400); max-width: 260px; }

/* ── Import playbooks ───────────────────────────────────────────────────── */
.pb-import { display: flex; flex-direction: column; gap: 12px; }
.pb-import__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pb-import__box {
  width: 100%; min-height: 190px; max-height: 300px; resize: vertical;
  padding: 12px 13px; border-radius: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px; line-height: 1.6; color: var(--text-slate-900);
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
  outline: none; transition: border-color .15s ease, box-shadow .15s ease;
}
.pb-import__box:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }
[data-theme='dark'] .pb-import__box { background: #0b0f14; border-color: #1f2937; color: #e2e8f0; }
.pb-import__hint { margin: 0; font-size: 11.5px; line-height: 1.55; color: var(--text-slate-400); }
.pb-import__error {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 12px; border-radius: 9px;
  font-size: 12px; font-weight: 600; color: #b42318;
  background: rgba(239,68,68,.07); border: 1px solid rgba(239,68,68,.2);
}
[data-theme='dark'] .pb-import__error { color: #fca5a5; background: rgba(239,68,68,.1); }

/* Paste JSON, or hand Zai a PRD. */
.pb-import__tabs { align-self: flex-start; }
.pb-import__drop {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  position: relative; padding: 22px 16px; border-radius: 12px; cursor: pointer;
  text-align: center;
  background: var(--bg-slate-50); border: 1px dashed var(--border-slate-200);
  transition: border-color .15s ease, background .15s ease;
}
[data-theme='dark'] .pb-import__drop { background: #0b0f14; border-color: #1f2937; }
.pb-import__drop:hover { border-color: rgba(59,130,246,.45); background: rgba(59,130,246,.04); }
.pb-import__drop.is-set { border-style: solid; border-color: rgba(59,130,246,.35); background: rgba(59,130,246,.05); }
.pb-import__dropicon {
  width: 40px; height: 40px; border-radius: 12px; margin-bottom: 4px;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2);
}
.pb-import__drop b { font-size: 12.5px; font-weight: 800; color: var(--text-slate-900); }
[data-theme='dark'] .pb-import__drop b { color: #e2e8f0; }
.pb-import__drop em { font-style: normal; font-size: 11px; color: var(--text-slate-400); }
.pb-import__dropclear {
  position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 7px;
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  color: var(--text-slate-400); background: transparent; border: none;
}
.pb-import__dropclear:hover { color: #ef4444; background: rgba(239,68,68,.08); }

/* Type it: the brief, and the optional dials under a document. */
.pb-import__brief {
  width: 100%; min-height: 130px; max-height: 260px; resize: vertical;
  padding: 12px 13px; border-radius: 10px;
  font-size: 12.5px; line-height: 1.65; color: var(--text-slate-900);
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
  outline: none; transition: border-color .15s ease, box-shadow .15s ease;
}
.pb-import__brief::placeholder { color: var(--text-slate-400); }
.pb-import__brief:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }
[data-theme='dark'] .pb-import__brief { background: #0b0f14; border-color: #1f2937; color: #e2e8f0; }

/* Said once, at the top of the block, instead of hedging every field. */
.pb-import__optional {
  display: flex; flex-direction: column; gap: 14px;
  padding: 12px 13px; border-radius: 11px;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-import__optional { background: #0b0f14; border-color: #1f2937; }
.pb-import__optionalhead {
  display: flex; align-items: center; gap: 6px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: var(--text-slate-500);
}
.pb-import__optionalhead svg { color: #93a5bd; }
.pb-import__optionalhead span {
  margin-left: 2px; padding: 2px 6px; border-radius: 4px; letter-spacing: .04em;
  font-size: 9px; color: var(--text-slate-400); background: rgba(100,116,139,.12);
}
.pb-import__countwrap { display: flex; flex-direction: column; gap: 6px; }
.pb-import__count { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pb-import__count .pb-ask__label { margin-bottom: 0; }
.pb-import__countright { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; }
/* Type a number when the presets do not fit — up to a hundred. */
.pb-import__countnum {
  display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 9px;
  border-radius: 9px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
  transition: border-color .15s ease, box-shadow .15s ease;
}
[data-theme='dark'] .pb-import__countnum { background: #0f1419; border-color: #1f2937; }
.pb-import__countnum:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,.12); }
.pb-import__countnum.is-on { border-color: rgba(59,130,246,.45); background: rgba(59,130,246,.06); }
.pb-import__countnum input {
  width: 42px; border: none; outline: none; background: transparent; text-align: right;
  font-size: 12.5px; font-weight: 800; color: var(--text-slate-900);
  font-variant-numeric: tabular-nums;
}
[data-theme='dark'] .pb-import__countnum input { color: #e2e8f0; }
.pb-import__countnum span { font-size: 10.5px; font-weight: 700; color: var(--text-slate-400); }
.pb-import__countwarn { color: #b45309; font-weight: 700; }
[data-theme='dark'] .pb-import__countwarn { color: #fbbf24; }

.pb-import__hub { display: flex; flex-direction: column; gap: 14px; }

/* ── Import in progress ─────────────────────────────────────────────────── */
/* Same language as the Zai draft panel — a header, a track, and the work
   itemised — but the progress here is REAL: one request per playbook. */
.pb-import__running { display: flex; flex-direction: column; gap: 12px; }
.pb-import__runhead { display: flex; align-items: center; gap: 11px; }
.pb-import__runspin {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.22);
  animation: pb-imppulse 1.6s ease-in-out infinite;
}
@keyframes pb-imppulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,.22); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(59,130,246,0); }
}
.pb-import__runtext { min-width: 0; flex: 1; }
.pb-import__runtitle { font-size: 13.5px; font-weight: 800; letter-spacing: -.015em; color: var(--text-slate-900); }
[data-theme='dark'] .pb-import__runtitle { color: #f1f5f9; }
.pb-import__runsub {
  font-size: 11.5px; line-height: 1.5; color: var(--text-slate-500); margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pb-import__runpct {
  margin-left: auto; font-size: 15px; font-weight: 800; letter-spacing: -.02em; color: #2563eb;
  font-variant-numeric: tabular-nums;
}
/* The Zai track and shimmer, in blue — this is the product's own work, not Zai's. */
.pb-zai__trackfill.is-blue { background: linear-gradient(90deg, #60a5fa, #2563eb); }
.pb-zai__stagelines.is-blue span {
  background: linear-gradient(90deg, rgba(59,130,246,.1), rgba(59,130,246,.28), rgba(59,130,246,.1));
  background-size: 220% 100%;
}
.pb-zai__stagedots.is-blue { background: #2563eb; color: #2563eb; }

.pb-import__stages { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; max-height: 320px; overflow-y: auto; }
.pb-import__stage {
  position: relative; display: flex; align-items: flex-start; gap: 10px;
  padding: 9px 11px; border-radius: 10px; border: 1px solid transparent;
  transition: background .25s ease, border-color .25s ease, opacity .25s ease;
}
.pb-import__stage::before {
  content: ""; position: absolute; left: 24px; top: 30px; bottom: -2px;
  border-left: 1px solid var(--border-slate-200);
}
.pb-import__stage:last-child::before { display: none; }
[data-theme='dark'] .pb-import__stage::before { border-left-color: #253243; }
.pb-import__stageicon {
  width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0; z-index: 1;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--text-slate-400); background: var(--bg-slate-100);
  border: 1px solid var(--border-slate-200);
  transition: color .25s ease, background .25s ease, border-color .25s ease;
}
.pb-import__stagetext { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.pb-import__stagetext b {
  display: flex; align-items: center; gap: 7px; min-width: 0;
  font-size: 12.5px; font-weight: 700; color: var(--text-slate-500);
}
.pb-import__stagetext em { font-style: normal; font-size: 11px; line-height: 1.45; color: var(--text-slate-400); }

.pb-import__stage.is-pending { opacity: .5; }
.pb-import__stage.is-active { background: rgba(59,130,246,.06); border-color: rgba(59,130,246,.2); }
.pb-import__stage.is-active .pb-import__stageicon {
  color: #2563eb; background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.3);
  animation: pb-imppulse 1.6s ease-in-out infinite;
}
.pb-import__stage.is-active .pb-import__stagetext b { color: #1d4ed8; font-weight: 800; }
.pb-import__stage.is-done .pb-import__stageicon {
  color: #047857; background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.26);
}
.pb-import__stage.is-done .pb-import__stagetext b { color: var(--text-slate-900); }
[data-theme='dark'] .pb-import__stage.is-done .pb-import__stagetext b { color: #e2e8f0; }
.pb-import__stage.is-failed { background: rgba(239,68,68,.05); border-color: rgba(239,68,68,.2); }
.pb-import__stage.is-failed .pb-import__stageicon {
  color: #b42318; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.26);
}
.pb-import__stage.is-failed .pb-import__stagetext em { color: #b42318; }
.pb-import__runfoot { margin: 2px 0 0; text-align: center; font-size: 11px; line-height: 1.5; color: var(--text-slate-400); }

/* Add or replace — the only real decision when a paste lands in an open draft. */
.pb-import__modes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
@media (max-width: 640px) { .pb-import__modes { grid-template-columns: 1fr; } }
.pb-import__mode {
  display: flex; flex-direction: column; align-items: flex-start; gap: 3px;
  padding: 10px 12px; border-radius: 10px; cursor: pointer; text-align: left;
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
  transition: border-color .15s ease, background .15s ease, box-shadow .15s ease;
}
[data-theme='dark'] .pb-import__mode { background: #0f1419; border-color: #1f2937; }
.pb-import__mode:hover { border-color: rgba(59,130,246,.4); }
.pb-import__mode svg { color: var(--text-slate-400); }
.pb-import__mode b { font-size: 12.5px; font-weight: 800; color: var(--text-slate-900); }
[data-theme='dark'] .pb-import__mode b { color: #e2e8f0; }
.pb-import__mode em { font-style: normal; font-size: 11px; line-height: 1.45; color: var(--text-slate-400); }
.pb-import__mode.is-on {
  border-color: rgba(59,130,246,.45); background: rgba(59,130,246,.06);
  box-shadow: inset 2px 0 0 #2563eb;
}
.pb-import__mode.is-on svg, .pb-import__mode.is-on b { color: #2563eb; }

/* Exactly which fields the API refused, pointed at by path into the paste. */
.pb-import__rejected {
  display: flex; flex-direction: column; gap: 5px;
  padding: 10px 12px; border-radius: 10px;
  background: rgba(239,68,68,.06); border: 1px solid rgba(239,68,68,.2);
}
.pb-import__rejected h4 {
  display: flex; align-items: center; gap: 6px; margin: 0 0 2px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: #b42318;
}
.pb-import__reject { display: flex; align-items: baseline; gap: 8px; font-size: 11.5px; line-height: 1.5; }
.pb-import__reject code {
  flex-shrink: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px; color: #b42318; background: rgba(239,68,68,.1);
  border-radius: 4px; padding: 1px 5px;
}
.pb-import__reject span { color: var(--text-slate-500); }

/* Category › Playbook › Recommendations, counted before anything is created. */
.pb-import__totals {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 9px 12px; border-radius: 9px;
  font-size: 11.5px; color: var(--text-slate-500);
  background: rgba(59,130,246,.06); border: 1px solid rgba(59,130,246,.18);
}
.pb-import__totals b { font-size: 13px; font-weight: 800; color: #2563eb; margin-right: 3px; }
.pb-import__totals i { font-style: normal; color: var(--text-slate-400); }

.pb-import__preview, .pb-import__done { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }
.pb-import__group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.pb-import__group h4 {
  display: flex; align-items: center; gap: 6px; margin: 0 0 2px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: #047857;
}
.pb-import__group h4.is-bad { color: #b42318; }
.pb-import__row {
  display: flex; align-items: center; gap: 9px; width: 100%; text-align: left;
  padding: 9px 11px; border-radius: 9px;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-import__row { background: #0b0f14; border-color: #1f2937; }
button.pb-import__row { cursor: pointer; transition: border-color .15s ease, background .15s ease; }
button.pb-import__row:hover { border-color: rgba(59,130,246,.4); background: rgba(59,130,246,.05); }
.pb-import__row.is-ok { border-color: rgba(16,185,129,.28); }
.pb-import__row.is-bad { border-color: rgba(239,68,68,.24); background: rgba(239,68,68,.05); }
.pb-import__row b { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); min-width: 0; }
[data-theme='dark'] .pb-import__row b { color: #e2e8f0; }
.pb-import__row em {
  display: inline-flex; align-items: center; gap: 4px; margin-left: auto;
  font-style: normal; font-size: 11px; color: var(--text-slate-400); text-align: right;
}
.pb-import__row.is-bad em { color: #b42318; margin-left: auto; max-width: 60%; }
.pb-import__row svg { flex-shrink: 0; color: var(--text-slate-400); }
.pb-import__cat {
  flex-shrink: 0; height: 20px; padding: 0 8px; border-radius: 6px;
  display: inline-flex; align-items: center;
  font-size: 9.5px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2);
  max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── Requested Playbooks list ───────────────────────────────────────────── */
.pb-reqlist { display: flex; flex-direction: column; gap: 10px; max-width: 1080px; }
.pb-req {
  border: 1px solid var(--border-slate-200); border-radius: 12px;
  background: var(--bg-pure-white); padding: 13px 14px;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.pb-req:hover { border-color: #cbd5e1; box-shadow: 0 4px 16px rgba(15,23,42,.05); }
[data-theme='dark'] .pb-req { background: #0f1419; border-color: #1f2937; }
.pb-req__top { display: flex; align-items: center; gap: 10px; }
/* The state, before you have read a word of it. */
.pb-req__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: var(--text-slate-400); }
.pb-req__dot.is-pending { background: #3b82f6; }
.pb-req__dot.is-planned { background: #f59e0b; }
.pb-req__dot.is-published { background: #10b981; }
.pb-req__dot.is-declined { background: #94a3b8; }
.pb-req__id { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
.pb-req__title { font-size: 13px; font-weight: 800; letter-spacing: -.01em; color: var(--text-slate-900); }
[data-theme='dark'] .pb-req__title { color: #f1f5f9; }
.pb-req__meta { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
.pb-req__status {
  flex-shrink: 0; height: 20px; padding: 0 8px; border-radius: 6px;
  display: inline-flex; align-items: center;
  font-size: 9.5px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase;
  color: var(--text-slate-500); background: rgba(100,116,139,.1); border: 1px solid rgba(100,116,139,.22);
}
.pb-req__status.is-pending { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.26); }
.pb-req__status.is-planned { color: #b45309; background: rgba(245,158,11,.1); border-color: rgba(245,158,11,.28); }
.pb-req__status.is-published { color: #047857; background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.28); }
.pb-req__body {
  font-size: 12px; line-height: 1.6; color: var(--text-slate-500);
  margin: 9px 0 0; padding-left: 18px; white-space: pre-wrap; max-width: 820px;
}
.pb-req__foot {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-top: 10px; padding-left: 18px;
}
.pb-req__state { font-size: 11.5px; color: var(--text-slate-400); }
.pb-req__open {
  display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
  border: none; background: transparent; padding: 0;
  font-size: 11.5px; font-weight: 700; color: #2563eb;
}
.pb-req__open:hover { color: #1d4ed8; text-decoration: underline; }
.pb-req__actions { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; }

/* The asking workspace, on the card and in the drawer. */
.pb-req.is-clickable { cursor: pointer; }
.pb-req__ws {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; max-width: 210px;
  height: 24px; padding: 0 9px 0 3px; border-radius: 999px;
  font-size: 11px; font-weight: 700; color: var(--text-slate-500);
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
}
[data-theme='dark'] .pb-req__ws { background: #0b0f14; border-color: #1f2937; }
.pb-req__wsav {
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 8.5px; font-weight: 800; letter-spacing: .02em;
  color: #2563eb; background: rgba(59,130,246,.14);
}
@media (max-width: 800px) { .pb-req__ws { display: none; } }

/* ── Request detail drawer ──────────────────────────────────────────────── */
.pb-reqdrawer .ant-drawer-header { padding: 14px 18px; border-bottom: 1px solid var(--border-slate-200); }
.pb-reqdrawer .ant-drawer-body { padding: 16px 18px; }
.pb-reqdrawer .ant-drawer-footer { padding: 12px 18px; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
[data-theme='dark'] .pb-reqdrawer .ant-drawer-footer { background: #0f1419; border-top-color: #1f2937; }
.pb-reqdrawer__head { display: flex; align-items: center; gap: 10px; }
.pb-reqdrawer__title { font-size: 14px; font-weight: 800; letter-spacing: -.015em; color: var(--text-slate-900); }
[data-theme='dark'] .pb-reqdrawer__title { color: #f1f5f9; }
.pb-reqdrawer__sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; font-weight: 500; }
.pb-reqdrawer__head .pb-req__status { margin-left: auto; }
.pb-reqdrawer__actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }

.pb-reqdetail { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
.pb-reqdetail__who {
  display: flex; align-items: center; gap: 11px; width: 100%;
  padding: 11px 12px; border-radius: 10px;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-reqdetail__who { background: #0f1419; border-color: #1f2937; }
.pb-reqdetail__av {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; color: #2563eb;
  background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.2);
}
.pb-reqdetail__ws { display: flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 800; color: var(--text-slate-900); }
[data-theme='dark'] .pb-reqdetail__ws { color: #f1f5f9; }
.pb-reqdetail__by { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-slate-400); margin-top: 2px; }
.pb-reqdetail__ws svg, .pb-reqdetail__by svg { color: #93a5bd; flex-shrink: 0; }

.pb-reqdetail__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; margin: 0; }
.pb-reqdetail__grid dt {
  font-size: 9.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
  color: var(--text-slate-400); margin-bottom: 3px;
}
.pb-reqdetail__grid dd { margin: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); }
[data-theme='dark'] .pb-reqdetail__grid dd { color: #e2e8f0; }

.pb-reqdetail__block { width: 100%; }
.pb-reqdetail__block h4 {
  font-size: 9.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
  color: var(--text-slate-400); margin: 0 0 5px;
}
.pb-reqdetail__block p {
  margin: 0; font-size: 12.5px; line-height: 1.65; color: var(--text-slate-500);
  white-space: pre-wrap;
}

/* ── Request-a-playbook modal ───────────────────────────────────────────── */
.pb-modal .ant-modal-content { border-radius: 14px; padding: 0; overflow: hidden; }
.pb-modal .ant-modal-header {
  margin: 0; padding: 16px 18px 14px; border-bottom: 1px solid var(--border-slate-200);
  background: linear-gradient(90deg, rgba(59,130,246,.07), rgba(59,130,246,0) 60%),
              var(--bg-slate-50);
}
[data-theme='dark'] .pb-modal .ant-modal-header {
  background: linear-gradient(90deg, rgba(59,130,246,.12), rgba(59,130,246,0) 60%), #0f1419;
  border-bottom-color: #1f2937;
}
.pb-modal .ant-modal-body { padding: 16px 18px; }
.pb-modal .ant-modal-footer {
  margin: 0; padding: 12px 18px; border-top: 1px solid var(--border-slate-200);
  background: var(--bg-slate-50);
}
[data-theme='dark'] .pb-modal .ant-modal-footer { background: #0f1419; border-top-color: #1f2937; }

.pb-modal__head { display: flex; align-items: flex-start; gap: 11px; }
.pb-modal__badge {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2);
}
.pb-modal__title { font-size: 14.5px; font-weight: 800; letter-spacing: -.015em; color: var(--text-slate-900); }
[data-theme='dark'] .pb-modal__title { color: #f1f5f9; }
.pb-modal__sub { font-size: 11.5px; line-height: 1.5; color: var(--text-slate-500); margin-top: 2px; font-weight: 500; max-width: 430px; }
.pb-modal__foot { display: flex; align-items: center; gap: 8px; }
.pb-modal__hint {
  margin-right: auto; text-align: left; font-size: 11px; color: var(--text-slate-400);
  max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* The three fields */
.pb-ask { display: flex; flex-direction: column; gap: 16px; }
.pb-ask__field { display: block; }
.pb-ask__label {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
  font-size: 11px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase;
  color: var(--text-slate-500);
}
.pb-ask__label svg { color: #93a5bd; }
.pb-ask__label em {
  font-style: normal; font-size: 9px; letter-spacing: .05em; padding: 2px 5px; border-radius: 4px;
  color: #2563eb; background: rgba(59,130,246,.1);
}
.pb-ask__count { margin-left: auto; font-size: 10px; font-weight: 700; color: var(--text-slate-400); letter-spacing: 0; }
.pb-ask__input.ant-input, .pb-ask__input.ant-input-affix-wrapper, .pb-ask textarea.ant-input {
  border-radius: 9px; font-size: 12.5px; border-color: var(--border-slate-200);
}
.pb-ask__input.ant-input:focus, .pb-ask textarea.ant-input:focus,
.pb-ask__input.ant-input-focused {
  border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,.12);
}
.pb-ask__help { display: block; margin-top: 6px; font-size: 11px; line-height: 1.5; color: var(--text-slate-400); }

/* Suggestions — the catalog's own categories, and the features it has no
   playbook for yet. One click fills the field. */
.pb-ask__suggest { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.pb-ask__suggestlabel {
  font-size: 9.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
  color: var(--text-slate-400); margin-right: 2px;
}
.pb-ask__chip {
  height: 24px; padding: 0 9px; border-radius: 999px; cursor: pointer;
  font-size: 11px; font-weight: 600; color: var(--text-slate-500);
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
  transition: color .15s ease, background .15s ease, border-color .15s ease;
}
.pb-ask__chip:hover { color: #2563eb; border-color: rgba(59,130,246,.4); background: rgba(59,130,246,.06); }
.pb-ask__chip.is-on { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.32); }
[data-theme='dark'] .pb-ask__chip { background: #0f1419; border-color: #1f2937; color: #94a3b8; }

/* Asking for something already in the library is the one mistake this form can
   make for you, so it is called out where the suggestions would have been. */
.pb-ask__note {
  display: inline-flex; align-items: center; gap: 5px; margin-top: 8px;
  padding: 6px 10px; border-radius: 8px;
  font-size: 11.5px; font-weight: 600; color: #2563eb;
  background: rgba(59,130,246,.07); border: 1px solid rgba(59,130,246,.2);
}
.pb-ask__note:hover { background: rgba(59,130,246,.12); color: #1d4ed8; }

/* ── Level segmented control ────────────────────────────────────────────── */
.pb-seg {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 2px; border-radius: 9px;
  background: var(--bg-slate-100); border: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-seg { background: #111820; border-color: #1f2937; }
.pb-seg__btn {
  display: inline-flex; align-items: center; gap: 5px;
  height: 24px; padding: 0 9px; border: none; border-radius: 7px;
  background: transparent; cursor: pointer; white-space: nowrap;
  font-size: 11.5px; font-weight: 600; color: var(--text-slate-500);
  transition: color .15s ease, background .15s ease, box-shadow .15s ease;
}
.pb-seg__btn:hover:not(:disabled):not(.is-on) { color: var(--text-slate-900); background: rgba(100,116,139,.08); }
[data-theme='dark'] .pb-seg__btn:hover:not(:disabled):not(.is-on) { color: #e2e8f0; }
.pb-seg__btn.is-on {
  color: #2563eb; background: var(--bg-pure-white);
  box-shadow: 0 1px 2px rgba(15,23,42,.08);
}
[data-theme='dark'] .pb-seg__btn.is-on { background: #0b0f14; color: #60a5fa; }
.pb-seg__btn.is-empty { opacity: .45; cursor: not-allowed; }
.pb-seg__btn.is-empty:hover { color: var(--text-slate-500); background: transparent; }
.pb-seg__n {
  font-size: 9.5px; font-weight: 800; line-height: 1; padding: 3px 4px; border-radius: 4px;
  color: var(--text-slate-400); background: rgba(100,116,139,.12);
}
.pb-seg__btn.is-on .pb-seg__n { color: #2563eb; background: rgba(59,130,246,.12); }
[data-theme='dark'] .pb-seg__btn.is-on .pb-seg__n { color: #60a5fa; background: rgba(59,130,246,.18); }
@media (max-width: 900px) { .pb-seg__n { display: none; } }

/* ── Catalog grid ───────────────────────────────────────────────────────── */
.pb-group { margin-bottom: 22px; }
.pb-group__head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.pb-group__title {
  font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: var(--text-slate-500); margin: 0;
}
.pb-group__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 5px;
  font-size: 10px; font-weight: 800; color: var(--text-slate-500);
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
}
.pb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
.pb-card {
  display: flex; flex-direction: column; gap: 10px; width: 100%; text-align: left;
  padding: 14px; cursor: pointer;
  border: 1px solid var(--border-slate-200); border-radius: 12px;
  background: var(--bg-pure-white);
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
}
.pb-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 16px rgba(15,23,42,.05); transform: translateY(-1px); }
[data-theme='dark'] .pb-card { background: #0f1419; border-color: #1f2937; }
/* The tile that adds to the grid. Dashed and unfilled so it reads as an empty
   slot rather than a sixth playbook. */
.pb-card--add {
  align-items: center; justify-content: center; text-align: center; gap: 6px;
  min-height: 168px; border-style: dashed; background: transparent;
  color: var(--text-slate-500);
}
.pb-card--add:hover {
  border-color: rgba(59,130,246,.45); background: rgba(59,130,246,.04);
  box-shadow: none; transform: none;
}
.pb-card--add__badge {
  width: 36px; height: 36px; border-radius: 10px;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2);
  transition: transform .18s ease;
}
.pb-card--add:hover .pb-card--add__badge { transform: scale(1.06); }
.pb-card--add__title { font-size: 13px; font-weight: 800; letter-spacing: -.01em; color: var(--text-slate-900); }
[data-theme='dark'] .pb-card--add__title { color: #f1f5f9; }
.pb-card--add__sub { font-size: 11.5px; line-height: 1.5; color: var(--text-slate-400); max-width: 230px; }

.pb-card__top { display: flex; align-items: center; gap: 10px; }
.pb-card__av {
  width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.18);
}
.pb-card__id { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
.pb-card__name {
  font-size: 13.5px; font-weight: 800; letter-spacing: -.01em; color: var(--text-slate-900);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
[data-theme='dark'] .pb-card__name { color: #f1f5f9; }
.pb-card__meta { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
.pb-card__go {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 26px; height: 26px; border-radius: 8px; color: var(--text-slate-300);
  transition: color .15s ease, background .15s ease, transform .15s ease;
}
.pb-card:hover .pb-card__go { color: #2563eb; background: rgba(59,130,246,.1); transform: translateX(2px); }
.pb-card__summary {
  font-size: 12px; line-height: 1.55; color: var(--text-slate-500); margin: 0;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.pb-card__foot {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding-top: 10px; border-top: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-card__foot { border-top-color: #1f2937; }
.pb-card__total {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: var(--text-slate-500);
}

/* ── Level chips ────────────────────────────────────────────────────────── */
.pb-levels { display: inline-flex; align-items: center; gap: 4px; }
.pb-level {
  display: inline-flex; align-items: center; gap: 3px;
  height: 19px; padding: 0 6px; border-radius: 5px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .03em;
  border: 1px solid transparent;
}
.pb-level b { font-size: 10px; font-weight: 800; }
.pb-level--junior       { color: #2563eb; background: rgba(59,130,246,.1);  border-color: rgba(59,130,246,.2); }
.pb-level--intermediate { color: #0f766e; background: rgba(13,148,136,.1);  border-color: rgba(13,148,136,.2); }
.pb-level--senior       { color: #b45309; background: rgba(217,119,6,.1);   border-color: rgba(217,119,6,.2); }
.pb-level--expert       { color: #475569; background: rgba(100,116,139,.12); border-color: rgba(100,116,139,.24); }

/* ── Reader layout ──────────────────────────────────────────────────────── */
.pb-reader { display: flex; flex: 1; min-height: 0; }
.pb-nav {
  width: 264px; flex-shrink: 0; overflow-y: auto;
  padding: 14px 10px 24px;
  border-right: 1px solid var(--border-slate-200);
  background: var(--bg-slate-50);
}
[data-theme='dark'] .pb-nav { background: #0f1419; border-right-color: #1f2937; }
@media (max-width: 1000px) { .pb-nav { display: none; } }
.pb-nav__group { margin-bottom: 6px; }
.pb-nav__link {
  display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
  padding: 7px 10px; border-radius: 8px; cursor: pointer;
  font-size: 12px; font-weight: 600; color: var(--text-slate-500);
  background: transparent; border: none;
  transition: color .15s ease, background .15s ease;
}
.pb-nav__link:hover { color: #2563eb; background: rgba(59,130,246,.07); }
.pb-nav__link.is-on { color: #2563eb; background: rgba(59,130,246,.1); }
/* A parent whose sub-section is the one on screen: coloured, but not filled —
   only one entry is ever "here", and it is the child. */
.pb-nav__link.is-within { color: #2563eb; }
/* The marker on the current entry, so the position reads at a glance rather
   than only through a tint. */
.pb-nav__link.is-on { position: relative; }
.pb-nav__link.is-on:not(.is-sub)::after {
  content: ""; position: absolute; left: 0; top: 6px; bottom: 6px; width: 2px;
  border-radius: 2px; background: #2563eb;
}
/* A sub-link's ::after is its tree elbow, so its marker is an inset edge
   instead — the elbow stays drawn. */
.pb-nav__link.is-sub.is-on { box-shadow: inset 2px 0 0 #2563eb; }
.pb-nav__label { min-width: 0; }
.pb-nav__count { margin-left: auto; flex-shrink: 0; font-size: 10px; font-weight: 700; color: var(--text-slate-400); }

/* Sub-topics hang off their parent topic on a tree line, so it reads as
   "Positive / Negative live inside Functional Testing" at a glance. */
.pb-nav__children { position: relative; margin: 1px 0 2px; padding-left: 21px; }
.pb-nav__link.is-sub { position: relative; padding-left: 8px; font-size: 11.5px; font-weight: 500; }
.pb-nav__link.is-sub::before,
.pb-nav__link.is-sub::after {
  content: ""; position: absolute; left: -10px; width: 9px;
  border-color: var(--border-slate-200); border-style: solid; border-width: 0;
  pointer-events: none;
}
/* vertical trunk through each row */
.pb-nav__link.is-sub::before { top: 0; bottom: 0; border-left-width: 1px; }
/* elbow into the row */
.pb-nav__link.is-sub::after { top: 50%; border-top-width: 1px; }
/* last row curves out and stops, instead of running past the group */
.pb-nav__link.is-sub:last-child::before {
  bottom: 50%; border-bottom-width: 1px; border-bottom-left-radius: 7px;
}
.pb-nav__link.is-sub:last-child::after { display: none; }
.pb-nav__link.is-sub:hover::before,
.pb-nav__link.is-sub:hover::after,
.pb-nav__link.is-sub.is-on::before,
.pb-nav__link.is-sub.is-on::after { border-color: rgba(37,99,235,.45); }
[data-theme='dark'] .pb-nav__link.is-sub::before,
[data-theme='dark'] .pb-nav__link.is-sub::after { border-color: #253243; }

.pb-body { flex: 1; min-width: 0; overflow-y: auto; padding: 16px 18px 120px; }

/* Catalog rail: the cross-cutting entries (All playbooks, My workspace) lead,
   the categories under them read as their children — same tree language as the
   reader's section nav. */
.pb-nav__link.is-on .pb-nav__count { color: #2563eb; }
.pb-nav__sep {
  margin: 8px 10px 6px; font-size: 9.5px; font-weight: 800; letter-spacing: .07em;
  text-transform: uppercase; color: var(--text-slate-400);
}

/* Edit / delete on a catalog card. Always visible — an action you have to
   hover to discover is an action half the people who need it never find. */
.pb-card__actions { display: inline-flex; align-items: center; gap: 2px; flex-shrink: 0; }
.pb-card__actions .pb-iconbtn { opacity: .75; }
.pb-card:hover .pb-card__actions .pb-iconbtn,
.pb-card__actions .pb-iconbtn:hover,
.pb-card:focus-within .pb-card__actions .pb-iconbtn { opacity: 1; }
.pb-card__actions .pb-iconbtn:disabled { opacity: .35; cursor: not-allowed; }

/* Why a save was refused, pinned under the header so it cannot be missed. */
.pb-saveerror {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 14px; font-size: 12px; font-weight: 600; color: #b42318;
  background: rgba(239,68,68,.07); border-bottom: 1px solid rgba(239,68,68,.2);
}
[data-theme='dark'] .pb-saveerror { color: #fca5a5; background: rgba(239,68,68,.1); }
.pb-saveerror__close {
  margin-left: auto; display: inline-flex; align-items: center;
  border: none; background: transparent; color: inherit; cursor: pointer;
  opacity: .7; padding: 2px; border-radius: 4px;
}
.pb-saveerror__close:hover { opacity: 1; background: rgba(239,68,68,.12); }

/* ── Overview block ─────────────────────────────────────────────────────── */
.pb-overview {
  border: 1px solid var(--border-slate-200); border-radius: 12px;
  background: var(--bg-slate-50); padding: 14px 16px; margin-bottom: 18px;
}
[data-theme='dark'] .pb-overview { background: #0f1419; border-color: #1f2937; }
.pb-overview p { font-size: 12.5px; line-height: 1.65; color: var(--text-slate-500); margin: 0 0 10px; }
.pb-overview p:last-child { margin-bottom: 0; }
.pb-overview strong { color: var(--text-slate-900); font-weight: 700; }
[data-theme='dark'] .pb-overview strong { color: #f1f5f9; }
.pb-overview li { font-size: 12.5px; line-height: 1.65; color: var(--text-slate-500); margin-bottom: 4px; }
.pb-overview ul { margin: 0 0 10px; padding-left: 18px; }
.pb-overview code, .pb-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px; color: #0f766e;
  background: rgba(13,148,136,.08); border: 1px solid rgba(13,148,136,.18);
  border-radius: 5px; padding: 1px 5px;
}
.pb-pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px; line-height: 1.6; color: var(--text-slate-900);
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
  border-radius: 8px; padding: 10px 12px; margin: 0 0 10px; overflow-x: auto; white-space: pre;
}
[data-theme='dark'] .pb-pre { background: #0b0f14; border-color: #1f2937; color: #e2e8f0; }

/* ── Sections and recommendation cards ──────────────────────────────────── */
.pb-section { margin-bottom: 26px; scroll-margin-top: 12px; }
.pb-section__head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.pb-section__title { font-size: 14px; font-weight: 800; letter-spacing: -.01em; color: var(--text-slate-900); margin: 0; }
[data-theme='dark'] .pb-section__title { color: #f1f5f9; }
.pb-section__title.is-sub { font-size: 12.5px; }
.pb-section__desc { font-size: 12px; line-height: 1.6; color: var(--text-slate-500); margin: 0 0 12px; max-width: 820px; white-space: pre-wrap; }
.pb-section__sub { margin-top: 16px; padding-left: 12px; border-left: 2px solid var(--border-slate-200); }
[data-theme='dark'] .pb-section__sub { border-left-color: #1f2937; }
.pb-selectall {
  display: inline-flex; align-items: center; gap: 6px; margin-left: auto;
  height: 24px; padding: 0 9px; border-radius: 6px; cursor: pointer;
  font-size: 11px; font-weight: 600; color: var(--text-slate-500);
  background: transparent; border: 1px solid var(--border-slate-200);
  transition: color .15s ease, border-color .15s ease, background .15s ease;
}
.pb-selectall:hover { color: #0f766e; border-color: rgba(13,148,136,.35); background: rgba(13,148,136,.06); }

.pb-item {
  border: 1px solid var(--border-slate-200); border-radius: 12px;
  background: var(--bg-pure-white); padding: 13px 14px; margin-bottom: 10px;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.pb-item:hover { border-color: #cbd5e1; box-shadow: 0 3px 12px rgba(15,23,42,.04); }
.pb-item.is-picked { border-color: rgba(13,148,136,.45); background: rgba(13,148,136,.03); }
[data-theme='dark'] .pb-item { background: #0f1419; border-color: #1f2937; }
.pb-item__head { display: flex; align-items: flex-start; gap: 10px; }
.pb-item__title {
  font-size: 13px; font-weight: 700; letter-spacing: -.005em;
  color: var(--text-slate-900); margin: 0; flex: 1 1 auto; min-width: 0;
}
[data-theme='dark'] .pb-item__title { color: #f1f5f9; }
.pb-item__tags { display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; flex-wrap: wrap; }
.pb-item__body { margin-top: 9px; display: flex; flex-direction: column; gap: 9px; }
/* ── Preconditions, edge cases and references on a recommendation ───────── */
/* Setup reads as a checklist: each line is a state to put the system in. */
.pb-pre-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.pb-pre-list li {
  position: relative; padding-left: 18px;
  font-size: 12.5px; line-height: 1.55; color: var(--text-slate-500);
}
.pb-pre-list li::before {
  content: ""; position: absolute; left: 4px; top: 7px;
  width: 6px; height: 6px; border-radius: 2px;
  border: 1px solid rgba(59,130,246,.45); background: rgba(59,130,246,.14);
}

/* Edge cases are things to go and check off, one at a time — a tick each,
   rather than a row of chips that reads as tags. */
.pb-edges { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.pb-edge {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 5px 8px; border-radius: 8px;
  font-size: 12.5px; line-height: 1.55; color: var(--text-slate-500);
  transition: background .15s ease;
}
.pb-edge:hover { background: var(--bg-slate-50); }
[data-theme='dark'] .pb-edge:hover { background: #0b0f14; }
.pb-edge svg { flex-shrink: 0; margin-top: 2px; color: #3b82f6; opacity: .75; }
.pb-edge:hover svg { opacity: 1; }

/* References carry their type, because a QA guide and a security standard are
   different kinds of answer and the reader chooses between them. */
.pb-refs { display: flex; flex-direction: column; gap: 6px; }
.pb-ref {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 8px 10px; border-radius: 9px;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
  text-decoration: none;
  transition: border-color .15s ease, background .15s ease;
}
[data-theme='dark'] .pb-ref { background: #0b0f14; border-color: #1f2937; }
.pb-ref.is-link:hover { border-color: rgba(59,130,246,.4); background: rgba(59,130,246,.05); }
.pb-ref__type {
  display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
  height: 20px; padding: 0 8px; border-radius: 6px;
  font-size: 9.5px; font-weight: 800; letter-spacing: .03em; text-transform: uppercase;
  color: var(--text-slate-500); background: var(--bg-pure-white);
  border: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-ref__type { background: #0f1419; border-color: #1f2937; }
.pb-ref__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.pb-ref__text b { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); }
[data-theme='dark'] .pb-ref__text b { color: #e2e8f0; }
.pb-ref.is-link .pb-ref__text b { color: #2563eb; }
.pb-ref__text em { font-style: normal; font-size: 11.5px; line-height: 1.5; color: var(--text-slate-400); }
.pb-ref__go { flex-shrink: 0; color: var(--text-slate-400); margin-top: 3px; }
.pb-ref.is-link:hover .pb-ref__go { color: #2563eb; }

/* Authoring a reference: type, name, link, description on their own rows. */
.pb-ref__row + .pb-ref__row { margin-top: 6px; }
.pb-ref__grid { display: grid; grid-template-columns: 200px 1fr; gap: 8px; flex: 1; min-width: 0; }
.pb-ref__grid > *:nth-child(3), .pb-ref__grid > *:nth-child(4) { grid-column: 1 / -1; }
@media (max-width: 900px) { .pb-ref__grid { grid-template-columns: 1fr; } }

.pb-field__label {
  font-size: 9.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: var(--text-slate-400); margin-bottom: 3px; display: block;
}
.pb-field__value { font-size: 12.5px; line-height: 1.6; color: var(--text-slate-500); margin: 0; }
.pb-field__value b { color: var(--text-slate-900); font-weight: 700; }
/* Steps are walked in order, so each one carries its number in a badge and a
   rail joins them — a plain ol marker got lost against the fields around it. */
.pb-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.pb-steps li {
  position: relative; display: flex; align-items: flex-start; gap: 9px;
  padding: 4px 0; font-size: 12.5px; line-height: 1.6; color: var(--text-slate-500);
}
.pb-steps li::before {
  content: ""; position: absolute; left: 10px; top: 26px; bottom: -2px;
  border-left: 1px solid var(--border-slate-200);
}
.pb-steps li:last-child::before { display: none; }
[data-theme='dark'] .pb-steps li::before { border-left-color: #253243; }
.pb-steps__n {
  width: 21px; height: 21px; border-radius: 50%; flex-shrink: 0; z-index: 1;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.22);
}
.pb-steps__text { min-width: 0; padding-top: 1px; }
.pb-examples { display: flex; flex-direction: column; gap: 4px; }
.pb-example {
  display: flex; align-items: baseline; gap: 8px;
  font-size: 12px; line-height: 1.5; color: var(--text-slate-500);
}
.pb-example__in {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px; color: var(--text-slate-900);
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
  border-radius: 5px; padding: 1px 6px; word-break: break-word;
}
[data-theme='dark'] .pb-example__in { background: #0b0f14; border-color: #1f2937; color: #e2e8f0; }
.pb-example__verdict { font-weight: 600; }
.pb-why {
  font-size: 12px; line-height: 1.6; color: var(--text-slate-500);
  border-left: 2px solid rgba(59,130,246,.3); padding-left: 10px; margin: 0;
}
.pb-applies {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #b45309;
  background: rgba(217,119,6,.08); border: 1px solid rgba(217,119,6,.2);
  border-radius: 6px; padding: 3px 8px;
}

/* ── Tag chips shared by items ──────────────────────────────────────────── */
.pb-tag {
  display: inline-flex; align-items: center; height: 22px; padding: 0 8px;
  font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase;
  line-height: 1; border-radius: 6px;
  border: 1px solid rgba(100,116,139,.28); color: var(--text-slate-500);
  background: var(--bg-slate-50);
}
[data-theme='dark'] .pb-tag { background: #0b0f14; border-color: #1f2937; }
.pb-tag--risk-low      { color: #475569; border-color: rgba(100,116,139,.3); }
.pb-tag--risk-medium   { color: #2563eb; border-color: rgba(59,130,246,.35); }
.pb-tag--risk-high     { color: #b45309; border-color: rgba(217,119,6,.4); }
.pb-tag--risk-critical { color: #be123c; border-color: rgba(190,18,60,.4); }

/* ── Selection bar ──────────────────────────────────────────────────────── */
.pb-selbar {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 120;
  display: flex; align-items: center; gap: 12px;
  padding: 11px 16px;
  background: var(--bg-pure-white);
  border-top: 1px solid var(--border-slate-200);
  box-shadow: 0 -6px 24px rgba(15,23,42,.06);
}
[data-theme='dark'] .pb-selbar { background: #0f1419; border-top-color: #1f2937; }
.pb-selbar__count { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); }
[data-theme='dark'] .pb-selbar__count { color: #f1f5f9; }
.pb-selbar__hint { font-size: 11.5px; color: var(--text-slate-500); }
.pb-selbar__actions { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; }

/* ── Tier badges ────────────────────────────────────────────────────────── */
/* Same chip shape as .pb-tag, coloured by tier: ash for public (the default,
   so it stays quiet), amber for premium, green for your own workspace. */
.pb-tier {
  display: inline-flex; align-items: center; gap: 4px;
  height: 22px; padding: 0 8px; flex-shrink: 0;
  font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase;
  line-height: 1; border-radius: 4px; border: 1px solid transparent;
}
.pb-tier--public    { color: var(--text-slate-500); border-color: rgba(100,116,139,.32); }
.pb-tier--premium   { color: #b45309; background: rgba(217,119,6,.09);  border-color: rgba(217,119,6,.28); }
.pb-tier--workspace { color: #0f766e; background: rgba(13,148,136,.09); border-color: rgba(13,148,136,.26); }
.pb-tier--draft     { color: #475569; background: rgba(100,116,139,.1); border-color: rgba(100,116,139,.28); }

/* ── Locked card + locked reader ────────────────────────────────────────── */
.pb-card.is-locked .pb-card__av { color: #b45309; background: rgba(217,119,6,.1); border-color: rgba(217,119,6,.2); }
.pb-card__price {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700; color: #b45309;
}

.pb-lock {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  gap: 10px; padding: 26px 20px; margin-bottom: 18px;
  border: 1px dashed rgba(217,119,6,.4); border-radius: 12px;
  background: rgba(217,119,6,.04);
}
[data-theme='dark'] .pb-lock { background: rgba(217,119,6,.06); }
.pb-lock__badge {
  width: 38px; height: 38px; border-radius: 11px;
  display: inline-flex; align-items: center; justify-content: center;
  color: #b45309; background: rgba(217,119,6,.12); border: 1px solid rgba(217,119,6,.26);
}
.pb-lock__title { font-size: 14px; font-weight: 800; color: var(--text-slate-900); margin: 0; }
[data-theme='dark'] .pb-lock__title { color: #f1f5f9; }
.pb-lock__sub { font-size: 12.5px; line-height: 1.6; color: var(--text-slate-500); margin: 0; max-width: 560px; }
.pb-lock__price { font-size: 13px; font-weight: 800; color: #b45309; }

/* A locked section still shows its heading and how much sits behind it. */
.pb-ghost {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 14px; margin-bottom: 8px;
  border: 1px dashed var(--border-slate-200); border-radius: 10px;
  font-size: 12px; color: var(--text-slate-400);
}
[data-theme='dark'] .pb-ghost { border-color: #1f2937; }

/* ── Author form ────────────────────────────────────────────────────────── */
.pb-edit { display: flex; flex: 1; min-height: 0; }
.pb-edit__nav {
  width: 292px; flex-shrink: 0; overflow-y: auto;
  /* 14px on all three columns: the outline, the form's title bar and the
     preview's header start on the same line across the screen. */
  padding: 14px 10px 24px;
  border-right: 1px solid var(--border-slate-200);
  background: var(--bg-slate-50);
}
[data-theme='dark'] .pb-edit__nav { background: #0f1419; border-right-color: #1f2937; }
.pb-edit__body { flex: 1; min-width: 0; overflow-y: auto; padding: 14px 18px 60px; }
@media (max-width: 1000px) { .pb-edit { flex-direction: column; } .pb-edit__nav { width: 100%; border-right: none; border-bottom: 1px solid var(--border-slate-200); } }

.pb-tree__head {
  padding: 0 8px 10px; font-size: 9.5px; font-weight: 800; letter-spacing: .07em;
  text-transform: uppercase; color: var(--text-slate-400);
}
.pb-tree__row {
  position: relative;
  display: flex; align-items: center; gap: 6px; width: 100%;
  padding: 6px 8px; border-radius: 8px; cursor: pointer;
  font-size: 12px; font-weight: 600; color: var(--text-slate-500);
  background: transparent; border: none; text-align: left;
  transition: color .15s ease, background .15s ease;
}
.pb-tree__row svg { color: #93a5bd; flex-shrink: 0; }
.pb-tree__row:hover { color: #2563eb; background: rgba(59,130,246,.07); }
.pb-tree__row:hover svg { color: #2563eb; }
.pb-tree__row.is-on { color: #2563eb; background: rgba(59,130,246,.1); }
.pb-tree__row.is-on svg { color: #2563eb; }
/* The same "you are here" marker the reader's outline uses. */
.pb-tree__row.is-on::after {
  content: ""; position: absolute; left: 0; top: 6px; bottom: 6px; width: 2px;
  border-radius: 2px; background: #2563eb;
}
.pb-tree__row.is-item { padding-left: 24px; font-weight: 500; font-size: 11.5px; }
.pb-tree__row.is-sub { padding-left: 20px; }
.pb-tree__row.is-subitem { padding-left: 36px; font-weight: 500; font-size: 11.5px; }
/* Guides, so a recommendation reads as living inside its section rather than
   as a row that happens to be indented. */
.pb-tree__row.is-item::before,
.pb-tree__row.is-sub::before,
.pb-tree__row.is-subitem::before {
  content: ""; position: absolute; top: 0; bottom: 0;
  border-left: 1px solid var(--border-slate-200);
}
.pb-tree__row.is-item::before { left: 13px; }
.pb-tree__row.is-sub::before { left: 11px; }
.pb-tree__row.is-subitem::before { left: 25px; }
[data-theme='dark'] .pb-tree__row.is-item::before,
[data-theme='dark'] .pb-tree__row.is-sub::before,
[data-theme='dark'] .pb-tree__row.is-subitem::before { border-left-color: #253243; }
.pb-tree__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Adding is a quieter act than navigating: no border, a small plus chip, and
   the row only colours on hover. The old dashed boxes gave three "add"
   buttons the same weight as the content they sit under. */
.pb-tree__add {
  display: inline-flex; align-items: center; gap: 6px;
  width: 100%; padding: 5px 8px; margin-top: 1px;
  border-radius: 8px; border: none; background: transparent; cursor: pointer;
  font-size: 11px; font-weight: 700; color: var(--text-slate-400);
  transition: color .15s ease, background .15s ease;
}
.pb-tree__add svg {
  width: 16px; height: 16px; padding: 2px; border-radius: 5px; flex-shrink: 0;
  color: var(--text-slate-400); background: rgba(100,116,139,.1);
  transition: color .15s ease, background .15s ease;
}
.pb-tree__add:hover { color: #2563eb; background: rgba(59,130,246,.06); }
.pb-tree__add:hover svg { color: #2563eb; background: rgba(59,130,246,.14); }
.pb-tree__add.is-sub { margin-left: 20px; width: calc(100% - 20px); }
/* Adding a SECTION is the one structural act on this rail — it is the level a
   reader navigates by — so it is a block with an explanation rather than a
   third identical "+" row. */
.pb-tree__addmain {
  display: flex; align-items: flex-start; gap: 9px; width: 100%; text-align: left;
  margin-top: 10px; padding: 10px 11px; cursor: pointer;
  border: 1px dashed rgba(59,130,246,.4); border-radius: 11px;
  background: rgba(59,130,246,.05);
  transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.pb-tree__addmain:hover {
  background: rgba(59,130,246,.09); border-color: rgba(59,130,246,.6);
  box-shadow: 0 2px 10px rgba(37,99,235,.1);
}
.pb-tree__addmain__badge {
  width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; background: #2563eb;
}
.pb-tree__addmain__text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.pb-tree__addmain__text b {
  font-size: 12px; font-weight: 800; letter-spacing: -.01em; color: #1d4ed8;
}
.pb-tree__addmain__text em {
  font-style: normal; font-size: 10.5px; line-height: 1.45; color: var(--text-slate-500);
}
[data-theme='dark'] .pb-tree__addmain { background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.35); }
[data-theme='dark'] .pb-tree__addmain__text b { color: #60a5fa; }

.pb-tree__group { margin-bottom: 8px; }

/* ── Live preview column ────────────────────────────────────────────────── */
/* Renders the real reader components, so the author is looking at the actual
   card rather than an approximation of it. */
.pb-preview {
  width: 460px; flex-shrink: 0; overflow-y: auto;
  padding: 14px 14px 60px;
  border-left: 1px solid var(--border-slate-200);
  background: var(--bg-slate-50);
}
[data-theme='dark'] .pb-preview { background: #0f1419; border-left-color: #1f2937; }
.pb-preview__head {
  display: flex; align-items: center; gap: 7px;
  position: sticky; top: 0; z-index: 2;
  /* 22px of clearance below: the editing ring's badge sits 8px ABOVE its node,
     and with a tighter gap the sticky header cropped it. */
  margin: -14px -14px 22px; padding: 14px 14px 10px;
  background: var(--bg-slate-50); border-bottom: 1px solid var(--border-slate-200);
  box-shadow: 0 6px 12px -10px rgba(15,23,42,.35);
}
[data-theme='dark'] .pb-preview__head { background: #0f1419; border-bottom-color: #1f2937; }
.pb-preview__head svg { color: #2563eb; }
.pb-preview__title {
  font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: var(--text-slate-500);
}
.pb-preview__what { margin-left: auto; font-size: 11px; color: var(--text-slate-400); }
/* The preview shows one card at natural width; the catalog grid does not apply. */
.pb-preview .pb-card { cursor: default; }
.pb-preview .pb-card.is-static:hover { border-color: var(--border-slate-200); box-shadow: none; transform: none; }
.pb-preview .pb-card.is-static .pb-card__go { display: none; }
.pb-preview .pb-item:hover { border-color: var(--border-slate-200); box-shadow: none; }
.pb-preview__empty {
  padding: 18px 16px; margin-bottom: 10px; text-align: center;
  font-size: 12px; line-height: 1.6; color: var(--text-slate-400);
  border: 1px dashed var(--border-slate-200); border-radius: 10px;
}

/* ── The node currently being edited ────────────────────────────────────── */
/* Every previewable node is wrapped, so the ring can sit around a card, a
   section heading or the catalog card without each of them needing its own
   selected state. */
.pb-pnode {
  position: relative; border-radius: 12px;
  /* Keeps the ring clear of the sticky preview header when scrolled to. */
  scroll-margin-top: 52px; scroll-margin-bottom: 16px;
  transition: box-shadow .2s ease, background .2s ease;
}
.pb-pnode.is-editing {
  box-shadow: 0 0 0 2px rgba(59,130,246,.38);
  background: rgba(59,130,246,.035);
}
[data-theme='dark'] .pb-pnode.is-editing { background: rgba(59,130,246,.07); }
/* A small marker so the ring reads as "you are here" rather than an error. */
.pb-pnode.is-editing::after {
  content: "Editing";
  position: absolute; top: -8px; right: 10px;
  padding: 1px 6px; border-radius: 4px;
  font-size: 8.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
  color: #fff; background: #2563eb;
}
[data-theme='dark'] .pb-preview__empty { border-color: #1f2937; }
@media (max-width: 1400px) { .pb-preview { width: 380px; } }
@media (max-width: 1180px) { .pb-preview { display: none; } }

.pb-form { max-width: 880px; }
.pb-form__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 720px) { .pb-form__grid { grid-template-columns: 1fr; } }
.pb-form__hint { font-size: 11.5px; line-height: 1.55; color: var(--text-slate-400); margin: 4px 0 0; }

/* ── Editor body header ─────────────────────────────────────────────────── */
/* Sticky, so the author always knows which node they are editing and how much
   of it is still blank while they scroll a long recommendation. */
.pb-bhead {
  position: sticky; top: 0; z-index: 3;
  /* Sits a touch higher than the outline and preview eyebrows on purpose: this
     bar is a title block, not a one-line label, so matching their text baseline
     left it reading low against them.
     20px of clearance below, so the first field-group card is not against it. */
  margin: -14px -18px 20px; padding: 9px 18px 11px;
  /* Same faint blue wash as the reader's hero, so the thing you are editing is
     titled the way it will be read. */
  background: linear-gradient(90deg, rgba(59,130,246,.05), rgba(59,130,246,0) 40%),
              var(--bg-pure-white);
  border-bottom: 1px solid var(--border-slate-200);
  box-shadow: 0 6px 12px -12px rgba(15,23,42,.4);
}
[data-theme='dark'] .pb-bhead { background: #0b0f14; border-bottom-color: #1f2937; }
.pb-bhead__crumb {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  font-size: 9.5px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase;
  color: var(--text-slate-400); margin-bottom: 3px; line-height: 1;
}
.pb-bhead__crumb b { color: var(--text-slate-500); font-weight: 800; }
.pb-bhead__row { display: flex; align-items: center; gap: 12px; }
.pb-bhead__title {
  font-size: 15px; font-weight: 800; letter-spacing: -.015em;
  color: var(--text-slate-900); margin: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
[data-theme='dark'] .pb-bhead__title { color: #f1f5f9; }
.pb-bhead__desc { font-size: 12px; line-height: 1.55; color: var(--text-slate-500); margin: 4px 0 0; max-width: 700px; }
.pb-bhead__actions { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; }

/* Completeness meter — how much of the card a reader will actually get. */
.pb-meter { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; }
.pb-meter__bar {
  width: 92px; height: 6px; border-radius: 999px; overflow: hidden;
  background: var(--bg-slate-100); border: 1px solid var(--border-slate-200);
}
.pb-meter__fill { height: 100%; background: #3b82f6; transition: width .25s ease, background .25s ease; }
/* Green only when it is actually done — a half-green bar reads as "fine". */
.pb-meter__fill.is-full { background: #10b981; }
.pb-meter__label { min-width: 74px; }
.pb-meter__label { font-size: 10.5px; font-weight: 700; color: var(--text-slate-400); white-space: nowrap; }

/* ── Field-group card ───────────────────────────────────────────────────── */
.pb-gcard {
  border: 1px solid var(--border-slate-200); border-radius: 12px;
  background: var(--bg-pure-white); margin-bottom: 14px; overflow: hidden;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.pb-gcard:hover { border-color: #cbd5e1; box-shadow: 0 2px 10px rgba(15,23,42,.035); }
[data-theme='dark'] .pb-gcard { background: #0f1419; border-color: #1f2937; }
.pb-gcard__head {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px; border-bottom: 1px solid var(--border-slate-200);
  background: linear-gradient(90deg, rgba(59,130,246,.045), rgba(59,130,246,0) 55%),
              var(--bg-slate-50);
}
[data-theme='dark'] .pb-gcard__head { background: #0b0f14; border-bottom-color: #1f2937; }
.pb-gcard__badge {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.18);
}
.pb-gcard__title { font-size: 12.5px; font-weight: 800; letter-spacing: -.005em; color: var(--text-slate-900); margin: 0; }
[data-theme='dark'] .pb-gcard__title { color: #f1f5f9; }
.pb-gcard__desc { font-size: 11.5px; line-height: 1.5; color: var(--text-slate-500); margin: 2px 0 0; }
.pb-gcard__body { padding: 14px; display: flex; flex-direction: column; gap: 14px; }
.pb-gcard__body > .pb-form__grid { gap: 14px; }

/* ── Field ──────────────────────────────────────────────────────────────── */
.pb-field { display: flex; flex-direction: column; }
.pb-field__top { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; }
.pb-field__name {
  font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: var(--text-slate-500);
}
.pb-field__req {
  font-size: 8.5px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2);
  border-radius: 3px; padding: 1px 4px; line-height: 1.3;
}
.pb-field__count { margin-left: auto; font-size: 10.5px; font-weight: 600; color: var(--text-slate-300); }
.pb-field__hint { font-size: 11.5px; line-height: 1.55; color: var(--text-slate-400); margin: 5px 0 0; }

/* Square inputs are the product's language; the focus ring is what makes them
   feel considered rather than unstyled. */
.pb-edit__body .ant-input,
.pb-edit__body .ant-input-affix-wrapper,
.pb-edit__body .sd-trigger {
  transition: border-color .15s ease, box-shadow .15s ease;
}
/* Rounded like every other input in the product — the author form used to be
   the one square-cornered surface in it. */
.pb-edit__body .ant-input,
.pb-edit__body .ant-input-affix-wrapper,
.pb-edit__body textarea.ant-input {
  border-radius: 9px; font-size: 12.5px; border-color: var(--border-slate-200);
}
.pb-edit__body .ant-input-lg, .pb-edit__body .ant-input-affix-wrapper-lg { font-size: 13px; }
.pb-edit__body .ant-input:hover,
.pb-edit__body .ant-input-affix-wrapper:hover { border-color: rgba(59,130,246,.4); }
.pb-edit__body .ant-input:focus,
.pb-edit__body .ant-input-focused,
.pb-edit__body .ant-input-affix-wrapper:focus-within {
  border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.12);
}

/* ── Chip picker — a closed set small enough to show all at once ─────────── */
.pb-chips { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pb-chip {
  height: 30px; padding: 0 12px; border-radius: 8px; cursor: pointer;
  font-size: 11.5px; font-weight: 700; letter-spacing: -.005em;
  color: var(--text-slate-500); background: var(--bg-pure-white);
  border: 1px solid var(--border-slate-200);
  transition: color .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.pb-chip:hover { border-color: #cbd5e1; }
[data-theme='dark'] .pb-chip { background: #0b0f14; border-color: #1f2937; }
/* Selected chips carry the same colour the reader gives that value, so the
   author is picking the badge they are about to publish. */
.pb-chip.is-on { box-shadow: 0 1px 4px rgba(15,23,42,.06); }
.pb-chip.is-on.tone-junior       { color: #2563eb; background: rgba(59,130,246,.1);  border-color: rgba(59,130,246,.32); }
.pb-chip.is-on.tone-intermediate { color: #0f766e; background: rgba(13,148,136,.1);  border-color: rgba(13,148,136,.32); }
.pb-chip.is-on.tone-senior       { color: #b45309; background: rgba(217,119,6,.1);   border-color: rgba(217,119,6,.34); }
.pb-chip.is-on.tone-expert       { color: #475569; background: rgba(100,116,139,.14); border-color: rgba(100,116,139,.36); }
.pb-chip.is-on.tone-low          { color: #475569; background: rgba(100,116,139,.12); border-color: rgba(100,116,139,.34); }
.pb-chip.is-on.tone-medium       { color: #2563eb; background: rgba(59,130,246,.1);  border-color: rgba(59,130,246,.32); }
.pb-chip.is-on.tone-high         { color: #b45309; background: rgba(217,119,6,.1);   border-color: rgba(217,119,6,.34); }
.pb-chip.is-on.tone-critical     { color: #be123c; background: rgba(190,18,60,.08);  border-color: rgba(190,18,60,.3); }

/* ── Zai ────────────────────────────────────────────────────────────────── */
/* Purple is Zai's colour everywhere in the product, so it is the one accent
   here that steps outside the QA Space palette — on purpose, and only for Zai. */
.pb-zai { display: flex; flex-direction: column; gap: 16px; }
/* Level then Category, one per row: side by side squeezed the level chips onto
   two lines and put the category picker in half the width it reads best at. */
.pb-zai__row { display: flex; flex-direction: column; gap: 16px; }

/* ── Zai modal chrome ───────────────────────────────────────────────────── */
.pb-zaimodal .ant-modal-content { border-radius: 14px; padding: 0; overflow: hidden; }
.pb-zaimodal .ant-modal-header {
  margin: 0; padding: 15px 18px 13px; border-bottom: 1px solid var(--border-slate-200);
  background: linear-gradient(90deg, rgba(147,51,234,.08), rgba(147,51,234,0) 62%),
              var(--bg-slate-50);
}
[data-theme='dark'] .pb-zaimodal .ant-modal-header {
  background: linear-gradient(90deg, rgba(147,51,234,.14), rgba(147,51,234,0) 62%), #0f1419;
  border-bottom-color: #1f2937;
}
/* The header is a 34px badge plus a step rail, so antd's default close sat high
   and tight against the step chips. Squared off, centred on the header, with
   room reserved for it on the right. */
.pb-zaimodal .ant-modal-header { padding-right: 54px; }
.pb-zaimodal .ant-modal-close,
.pb-modal .ant-modal-close {
  top: 14px; inset-inline-end: 14px; width: 30px; height: 30px;
  border-radius: 8px; color: var(--text-slate-400);
  transition: color .15s ease, background .15s ease;
}
.pb-zaimodal .ant-modal-close:hover,
.pb-modal .ant-modal-close:hover { color: var(--text-slate-900); background: rgba(100,116,139,.12); }
.pb-modal .ant-modal-header { padding-right: 54px; }
.pb-zaimodal .ant-modal-body { padding: 16px 18px; }
.pb-zaimodal .ant-modal-footer {
  margin: 0; padding: 12px 18px; border-top: 1px solid var(--border-slate-200);
  background: var(--bg-slate-50);
}
[data-theme='dark'] .pb-zaimodal .ant-modal-footer { background: #0f1419; border-top-color: #1f2937; }

.pb-zai__head { display: flex; align-items: center; gap: 11px; }
.pb-zai__avatar {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #9333ea; background: rgba(147,51,234,.12); border: 1px solid rgba(147,51,234,.24);
}
.pb-zai__headtext { min-width: 0; }
.pb-zai__sub { font-size: 11.5px; line-height: 1.45; color: var(--text-slate-500); font-weight: 500; margin-top: 2px; }
/* Which of the two steps you are on. */
.pb-zai__steps { margin-left: auto; margin-right: 2px; display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
.pb-zai__step {
  display: inline-flex; align-items: center; gap: 5px;
  height: 24px; padding: 0 9px; border-radius: 999px;
  font-size: 10.5px; font-weight: 700; color: var(--text-slate-400);
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
}
.pb-zai__step b {
  width: 15px; height: 15px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 8.5px; font-weight: 800; color: var(--text-slate-400); background: rgba(100,116,139,.14);
}
.pb-zai__step.is-on { color: #9333ea; border-color: rgba(147,51,234,.32); background: rgba(147,51,234,.08); }
.pb-zai__step.is-on b { color: #fff; background: #9333ea; }
.pb-zai__steparrow { color: var(--text-slate-400); font-size: 12px; }
@media (max-width: 640px) { .pb-zai__steps { display: none; } }

.pb-zai__foot { display: flex; align-items: center; gap: 8px; }
.pb-zai__foothint { margin-right: auto; text-align: left; font-size: 11px; color: var(--text-slate-400); }
/* Zai's own action keeps Zai's colour; every other button stays neutral. */
.pb-btn.is-zai.ant-btn-primary {
  background: #9333ea; border-color: #9333ea; box-shadow: 0 1px 2px rgba(147,51,234,.3);
}
.pb-btn.is-zai.ant-btn-primary:hover { background: #7e22ce !important; border-color: #7e22ce !important; }
.pb-btn.is-zai.ant-btn-primary:disabled { background: rgba(147,51,234,.35); border-color: transparent; color: #fff; }

/* The point you are asking for, and the shape of a good one. */
.pb-zai__tip {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 12px; border-radius: 10px;
  font-size: 12px; line-height: 1.55; color: var(--text-slate-500);
  background: rgba(147,51,234,.06); border: 1px solid rgba(147,51,234,.16);
}
.pb-zai__tip svg { color: #9333ea; flex-shrink: 0; margin-top: 1px; }
.pb-zai__tip em { font-style: normal; font-weight: 700; color: var(--text-slate-900); }
[data-theme='dark'] .pb-zai__tip em { color: #f1f5f9; }

/* ── The wait: the card being built, part by part ───────────────────────── */
.pb-zai--waiting { gap: 12px; padding: 2px 0 4px; }
.pb-zai__waithead { display: flex; align-items: center; gap: 11px; }
.pb-zai__spinner {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #9333ea; background: rgba(147,51,234,.1); border: 1px solid rgba(147,51,234,.22);
  animation: pb-zaipulse 1.6s ease-in-out infinite;
}
@keyframes pb-zaipulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(147,51,234,.22); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(147,51,234,0); }
}
.pb-zai__waittext { min-width: 0; }
.pb-zai__waittitle { font-size: 13.5px; font-weight: 800; letter-spacing: -.015em; color: var(--text-slate-900); }
[data-theme='dark'] .pb-zai__waittitle { color: #f1f5f9; }
.pb-zai__waitsub { font-size: 11.5px; line-height: 1.5; color: var(--text-slate-500); margin-top: 2px; }
.pb-zai__waitpct {
  margin-left: auto; font-size: 15px; font-weight: 800; letter-spacing: -.02em; color: #9333ea;
  font-variant-numeric: tabular-nums;
}
.pb-zai__track {
  height: 5px; border-radius: 999px; overflow: hidden;
  background: rgba(100,116,139,.14);
}
.pb-zai__trackfill {
  display: block; height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #a855f7, #7e22ce);
  transition: width .6s cubic-bezier(.22,.61,.36,1);
}

.pb-zai__stages { list-style: none; margin: 2px 0 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.pb-zai__stage {
  position: relative; display: flex; align-items: flex-start; gap: 10px;
  padding: 9px 11px; border-radius: 10px;
  border: 1px solid transparent;
  transition: background .25s ease, border-color .25s ease, opacity .25s ease;
}
/* A rail down the icons, so the parts read as one card being assembled. */
.pb-zai__stage::before {
  content: ""; position: absolute; left: 24px; top: 30px; bottom: -2px;
  border-left: 1px solid var(--border-slate-200);
}
.pb-zai__stage:last-child::before { display: none; }
[data-theme='dark'] .pb-zai__stage::before { border-left-color: #253243; }
.pb-zai__stageicon {
  width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0; z-index: 1;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--text-slate-400); background: var(--bg-slate-100);
  border: 1px solid var(--border-slate-200);
  transition: color .25s ease, background .25s ease, border-color .25s ease;
}
.pb-zai__stagetext { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.pb-zai__stagetext b { font-size: 12.5px; font-weight: 700; color: var(--text-slate-500); }
.pb-zai__stagetext em { font-style: normal; font-size: 11px; line-height: 1.45; color: var(--text-slate-400); }

/* Done */
.pb-zai__stage.is-done .pb-zai__stageicon {
  color: #047857; background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.26);
}
.pb-zai__stage.is-done .pb-zai__stagetext b { color: var(--text-slate-900); }
[data-theme='dark'] .pb-zai__stage.is-done .pb-zai__stagetext b { color: #e2e8f0; }

/* Being written now */
.pb-zai__stage.is-live {
  background: rgba(147,51,234,.06); border-color: rgba(147,51,234,.18);
}
.pb-zai__stage.is-live .pb-zai__stageicon {
  color: #9333ea; background: rgba(147,51,234,.12); border-color: rgba(147,51,234,.3);
  animation: pb-zaipulse 1.6s ease-in-out infinite;
}
.pb-zai__stage.is-live .pb-zai__stagetext b { color: #7e22ce; font-weight: 800; }
[data-theme='dark'] .pb-zai__stage.is-live .pb-zai__stagetext b { color: #c084fc; }

/* Not started */
.pb-zai__stage.is-next { opacity: .5; }

/* The lines under the part currently being written. */
.pb-zai__stagelines { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.pb-zai__stagelines span {
  height: 8px; border-radius: 4px;
  background: linear-gradient(90deg, rgba(147,51,234,.1), rgba(147,51,234,.26), rgba(147,51,234,.1));
  background-size: 220% 100%;
  animation: pb-zaishimmer 1.5s linear infinite;
}
/* Three dots that keep moving even while a long part is still out. */
.pb-zai__stagedots {
  /* Two of the three dots are box-shadows to the right, so the row reserves
     their width instead of letting them run into the padding. */
  width: 4px; height: 4px; border-radius: 50%; margin: 11px 18px 0 0; flex-shrink: 0;
  background: #9333ea; color: #9333ea;
  box-shadow: 8px 0 0 currentColor, 16px 0 0 currentColor;
  animation: pb-zaidots 1.2s ease-in-out infinite;
}
@keyframes pb-zaidots {
  0%, 100% { opacity: .25; }
  50% { opacity: 1; }
}
@keyframes pb-zaishimmer {
  0% { background-position: 120% 0; }
  100% { background-position: -120% 0; }
}
.pb-zai__waitfoot {
  margin: 2px 0 0; text-align: center; font-size: 11px; color: var(--text-slate-400);
}

/* The draft, once it is back. */
.pb-zai__ready {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 9px 12px; border-radius: 10px;
  font-size: 12px; line-height: 1.55; font-weight: 600; color: #047857;
  background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.22);
}
.pb-zai__ready svg { flex-shrink: 0; margin-top: 1px; }
.pb-zai__result {
  padding: 12px; border-radius: 12px;
  background: rgba(147,51,234,.04); border: 1px solid rgba(147,51,234,.16);
}

.pb-zai__title { display: inline-flex; align-items: center; gap: 7px; color: #9333ea; font-weight: 800; font-size: 14.5px; letter-spacing: -.015em; }
.pb-zai__badge {
  font-size: 9px; font-weight: 800; letter-spacing: .05em;
  color: #9333ea; background: #f3e8ff; border-radius: 4px; padding: 1px 5px;
}
[data-theme='dark'] .pb-zai__badge { background: rgba(147,51,234,.18); }
.pb-zai__lead { font-size: 12.5px; line-height: 1.6; color: var(--text-slate-500); margin: 0; }
.pb-zai__lead em { color: var(--text-slate-900); font-style: normal; font-weight: 600; }
.pb-zai__wait {
  font-size: 12px; font-weight: 600; color: #9333ea; margin: 0;
  padding: 8px 11px; border-radius: 8px;
  background: #faf5ff; border: 1px solid rgba(147,51,234,.22);
}
[data-theme='dark'] .pb-zai__wait { background: rgba(147,51,234,.12); }
[data-theme='dark'] .pb-zai__lead em { color: #f1f5f9; }
/* "Let Zai choose" — the one chip that lights purple rather than a level tone. */
.pb-chip.is-on.tone-auto { color: #9333ea; background: #f3e8ff; border-color: rgba(147,51,234,.3); }
[data-theme='dark'] .pb-chip.is-on.tone-auto { background: rgba(147,51,234,.18); }

.pb-zaibtn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 13px; border-radius: 8px; cursor: pointer;
  font-size: 12px; font-weight: 700;
  color: #9333ea; background: #faf5ff; border: 1px solid rgba(147,51,234,.28);
  transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.pb-zaibtn:hover { background: #f3e8ff; border-color: rgba(147,51,234,.45); box-shadow: 0 2px 8px rgba(147,51,234,.12); }
[data-theme='dark'] .pb-zaibtn { background: rgba(147,51,234,.12); }
/* Sits in a header row beside antd's small buttons, so it matches their height. */
.pb-zaibtn--sm { height: 24px; padding: 0 9px; font-size: 11.5px; gap: 5px; border-radius: 6px; }

/* ── List editor — steps, examples, conditions ──────────────────────────── */
.pb-list { border: 1px solid var(--border-slate-200); border-radius: 10px; overflow: hidden; }
[data-theme='dark'] .pb-list { border-color: #1f2937; }
.pb-list__head {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 11px; background: var(--bg-slate-50);
  border-bottom: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-list__head { background: #0b0f14; border-bottom-color: #1f2937; }
.pb-list__name {
  font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  color: var(--text-slate-500);
}
.pb-list__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 17px; height: 17px; padding: 0 5px; border-radius: 5px;
  font-size: 9.5px; font-weight: 800; color: var(--text-slate-500);
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
}
.pb-list__add { margin-left: auto; }
.pb-list__rows { padding: 10px 11px; display: flex; flex-direction: column; gap: 8px; }
.pb-list__empty {
  padding: 16px 12px; text-align: center;
  font-size: 11.5px; line-height: 1.55; color: var(--text-slate-400);
}
.pb-row { display: flex; align-items: center; gap: 8px; }
.pb-row__n {
  width: 22px; height: 22px; flex-shrink: 0; border-radius: 6px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; color: var(--text-slate-500);
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-row__n { background: #0b0f14; border-color: #1f2937; }
/* The delete stays quiet until the row is hovered — a row of red X's reads as
   a list of problems. */
.pb-row .pb-iconbtn { opacity: .35; }
.pb-row:hover .pb-iconbtn, .pb-row:focus-within .pb-iconbtn { opacity: 1; }

.pb-iconbtn {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 26px; height: 26px; border-radius: 7px; cursor: pointer;
  color: var(--text-slate-400); background: transparent; border: 1px solid transparent;
  transition: color .15s ease, background .15s ease, border-color .15s ease, opacity .15s ease;
}
.pb-iconbtn:hover { color: #2563eb; background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.2); }
/* Removal is the one destructive action here, so it is the one thing in red. */
.pb-iconbtn.is-danger:hover { color: #ef4444; background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.22); }

/* ── Generate drawer ────────────────────────────────────────────────────── */
/* ── Generate-test-cases drawer ─────────────────────────────────────────── */
/* Its own header, because the shared drawer props hide antd's. */
.pb-gen__head {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px 15px; margin: 0 0 16px;
  background: linear-gradient(90deg, rgba(59,130,246,.07), rgba(59,130,246,0) 58%),
              var(--bg-slate-50);
  border-bottom: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .pb-gen__head {
  background: linear-gradient(90deg, rgba(59,130,246,.12), rgba(59,130,246,0) 58%), #0f1419;
  border-bottom-color: #1f2937;
}
.pb-gen__badge {
  width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #2563eb; background: rgba(59,130,246,.12); border: 1px solid rgba(59,130,246,.22);
}
.pb-gen__headtext { min-width: 0; flex: 1; }
.pb-gen__title { margin: 0; font-size: 15.5px; font-weight: 800; letter-spacing: -.02em; color: var(--text-slate-900); }
[data-theme='dark'] .pb-gen__title { color: #f1f5f9; }
.pb-gen__sub {
  display: flex; align-items: center; gap: 5px; margin: 3px 0 0;
  font-size: 11.5px; font-weight: 600; color: var(--text-slate-500);
}
.pb-gen__sub svg { color: #93a5bd; flex-shrink: 0; }
.pb-gen__close {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--text-slate-400); background: transparent; border: none;
  transition: color .15s ease, background .15s ease;
}
.pb-gen__close:hover { color: var(--text-slate-900); background: rgba(100,116,139,.12); }

/* What is about to happen, drawn as the shape it happens in. */
.pb-gen__flow {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin: 0 20px 12px; padding: 12px 14px;
  border: 1px solid var(--border-slate-200); border-radius: 12px;
  background: var(--bg-pure-white);
}
[data-theme='dark'] .pb-gen__flow { background: #0f1419; border-color: #1f2937; }
.pb-gen__step { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 130px; }
.pb-gen__stepicon {
  width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--text-slate-400); background: var(--bg-slate-100); border: 1px solid var(--border-slate-200);
}
.pb-gen__step.is-out .pb-gen__stepicon {
  color: #047857; background: rgba(16,185,129,.1); border-color: rgba(16,185,129,.26);
}
.pb-gen__step b {
  font-size: 16px; font-weight: 800; letter-spacing: -.02em; color: var(--text-slate-900);
  font-variant-numeric: tabular-nums;
}
[data-theme='dark'] .pb-gen__step b { color: #f1f5f9; }
.pb-gen__step em {
  font-style: normal; font-size: 10px; font-weight: 800; letter-spacing: .05em;
  text-transform: uppercase; color: var(--text-slate-400);
}
.pb-gen__arrow { color: var(--text-slate-400); flex-shrink: 0; }

/* Where the cases land, filling in as the form is completed. */
.pb-gen__path {
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  margin: 0 20px 16px; padding: 8px 12px; border-radius: 9px;
  font-size: 11.5px; background: var(--bg-slate-50); border: 1px dashed var(--border-slate-200);
}
[data-theme='dark'] .pb-gen__path { background: #0b0f14; border-color: #1f2937; }
.pb-gen__path span { color: var(--text-slate-400); font-weight: 600; }
.pb-gen__path span.is-set { color: #2563eb; font-weight: 700; }
.pb-gen__path i { color: var(--text-slate-400); font-style: normal; opacity: .6; }

/* Footer: what happens on the left, the decision on the right. */
.pb-gen__foot {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 20px; border-top: 1px solid var(--border-slate-200);
  background: var(--bg-slate-50);
}
[data-theme='dark'] .pb-gen__foot { background: #0f1419; border-top-color: #1f2937; }
.pb-gen__footwhat {
  margin-right: auto; font-size: 11.5px; color: var(--text-slate-400);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px;
}
.pb-gen__footwhat b { color: var(--text-slate-900); font-weight: 700; }
[data-theme='dark'] .pb-gen__footwhat b { color: #e2e8f0; }

/* Rounded fields, matching the author form. */
.pb-gen .ant-input,
.pb-gen .ant-input-affix-wrapper,
.pb-gen .sd-trigger { border-radius: 9px !important; }
`;
