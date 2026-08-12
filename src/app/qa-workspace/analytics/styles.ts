/**
 * Analytics-only chrome, layered on top of the shared QA Space stylesheet.
 * Chart chrome stays recessive so the data is the only assertive thing on
 * screen — hairline grids, muted axis ink, no chart-junk borders.
 */
export const ANALYTICS_STYLES = `
/* Filter bar — outside the loading overlay, so it stays usable mid-refresh. */
.qa-filterbar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 20px; border-bottom: 1px solid var(--border-slate-200);
}
.qa-filterbar .ant-picker { height: 32px; border-radius: 8px; }
.qa-filterbar .sd-trigger { height: 32px !important; min-height: 32px !important; border-radius: 8px !important; padding-block: 0 !important; }
.qa-filterbar .sc-filters__field { min-width: 150px; }

.qa-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 1100px) { .qa-grid2 { grid-template-columns: 1fr; } }

.qa-chart { border: 1px solid var(--border-slate-200); background: transparent; margin-bottom: 12px; }
.qa-grid2 > .qa-chart { margin-bottom: 0; }
.qa-chart__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 11px 14px; border-bottom: 1px solid var(--border-slate-100);
}
.qa-chart__head h3 { margin: 0; font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -.01em; }
.qa-chart__head p { margin: 2px 0 0; font-size: 11.5px; line-height: 1.45; color: var(--text-slate-500); }
.qa-chart__body { padding: 12px 14px; }
.qa-chart__empty {
  display: flex; align-items: center; justify-content: center; height: 100%;
  min-height: 120px; font-size: 12.5px; color: var(--text-slate-400); text-align: center;
}

/* Recharts chrome — hairline, recessive. */
.qa-chart .recharts-cartesian-grid line { stroke: var(--border-slate-100); }
.qa-chart .recharts-text { fill: var(--text-slate-400); }

/* Stacked outcome bar */
.qa-outcome { display: flex; flex-direction: column; gap: 10px; }
.qa-outcome__bar { display: flex; height: 12px; border-radius: 999px; overflow: hidden; background: var(--border-slate-100); }
.qa-outcome__bar > span { display: block; height: 100%; }
/* 2px surface gap between adjacent fills, so segments never bleed together. */
.qa-outcome__bar > span + span { box-shadow: inset 2px 0 0 var(--bg-pure-white); }

/* Identity never rests on colour alone — every swatch is named. */
.qa-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 0; padding: 0; list-style: none; }
.qa-legend li { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; }
.qa-legend__swatch { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
.qa-legend__label { color: var(--text-slate-600); font-weight: 500; }
.qa-legend__value { color: var(--text-slate-900); font-weight: 700; font-variant-numeric: tabular-nums; }

/* Tooltip */
.qa-tip {
  padding: 8px 10px; border-radius: 8px; min-width: 150px;
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
  box-shadow: 0 10px 28px rgba(15,23,42,.14);
}
.qa-tip__label { font-size: 11px; font-weight: 700; color: var(--text-slate-900); margin-bottom: 5px; }
.qa-tip__row { display: flex; align-items: center; gap: 7px; font-size: 11.5px; margin-top: 3px; }
.qa-tip__swatch { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.qa-tip__name { flex: 1; color: var(--text-slate-500); }
.qa-tip__value { color: var(--text-slate-900); font-weight: 700; font-variant-numeric: tabular-nums; }

/* Key/value panel, for figures that are numbers rather than a shape. */
.qa-kv { display: flex; flex-direction: column; height: 100%; overflow-y: auto; scrollbar-width: none; }
.qa-kv::-webkit-scrollbar { display: none; }
.qa-kv__row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 7px 0; border-bottom: 1px solid var(--border-slate-100); font-size: 12.5px;
}
.qa-kv__row:last-child { border-bottom: none; }
.qa-kv__row span { color: var(--text-slate-600); }
.qa-kv__row strong { color: var(--text-slate-900); font-weight: 700; font-variant-numeric: tabular-nums; }

.qa-chart .sc-table, .sc-table.ant-table-wrapper, .sc-table .ant-table, .sc-table .ant-table-container, .sc-table .ant-table-content, .sc-table .ant-table-header, .sc-table .ant-table-body { border-radius: 0 !important; }
        .sc-table .ant-table-thead > tr > th, .sc-table .ant-table-thead > tr > td { border-radius: 0 !important; border-start-start-radius: 0 !important; border-start-end-radius: 0 !important; }
        .sc-table .ant-table-thead > tr > th { background: transparent !important; }
`;
