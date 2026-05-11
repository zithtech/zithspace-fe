// Scoped styles for the Hivebug bug-list page. Variables flip between dark/light
// via .hb-dark / .hb-light classes on .hb-root. Kept page-local so we don't
// touch the global theme.
export const hivebugStyles = `
.hb-root {
  --hb-bg: #070a12;
  --hb-bg-elev: #0a0f1c;
  --hb-bg-soft: #0f1524;
  --hb-bg-hover: #141b2c;
  --hb-bg-active: #1a2540;
  --hb-border: #1a2030;
  --hb-border-strong: #232a3c;
  --hb-text: #e6e8ee;
  --hb-text-soft: #aab1bd;
  --hb-text-muted: #6f7684;
  --hb-accent: #5b9bff;
  --hb-accent-fg: #070a12;
  --hb-danger: #ff5a4e;
  --hb-success: #3fbf8f;
  --hb-warning: #f59f3b;
  --hb-bg-elev-rgb: 10, 15, 28;
  --hb-accent-rgb: 91, 155, 255;

  display: flex;
  height: calc(100vh - 64px);
  background: var(--hb-bg);
  color: var(--hb-text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  font-size: 13px;
  letter-spacing: -0.01em;
  padding-left: 0;
  gap: 0;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  max-width: 100vw;
  min-width: 0;
  box-sizing: border-box;
}

.hb-light {
  --hb-bg: #ffffff;
  --hb-bg-elev: #fafbfc;
  --hb-bg-soft: #f3f4f6;
  --hb-bg-hover: #eef0f3;
  --hb-bg-active: #e0eaff;
  --hb-border: #e5e7eb;
  --hb-border-strong: #d1d5db;
  --hb-text: #111827;
  --hb-text-soft: #4b5563;
  --hb-text-muted: #9ca3af;
  --hb-accent: #2563eb;
  --hb-accent-fg: #ffffff;
  --hb-bg-elev-rgb: 250, 251, 252;
  --hb-accent-rgb: 37, 99, 235;
}
.hb-light .hb-row.active { color: #111827; }
.hb-light .hb-brand-icon { color: #ffffff; }
.hb-light .hb-btn-primary {
  background: #111827;
  color: #ffffff;
  border-color: #111827;
}
.hb-light .hb-btn-primary:hover {
  background: #1f2937;
  border-color: #1f2937;
}

/* ============ Sidebar ============ */
.hb-sidebar {
  width: 252px;
  background: var(--hb-bg-elev);
  border-right: 1px solid var(--hb-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}
.hb-brand {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 12px 12px;
  border-bottom: 1px solid var(--hb-border);
}
.hb-brand-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f59f3b 0%, #ff8a3b 100%);
  color: #0c0e12;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hb-brand-name { font-weight: 600; font-size: 14px; line-height: 1.1; }
.hb-brand-sub { color: var(--hb-text-muted); font-size: 9px; letter-spacing: 0.14em; margin-top: 4px; font-weight: 600; }

.hb-section { padding: 12px 10px 6px; }
.hb-section-grow { flex: 1; overflow: hidden; padding-bottom: 12px; }
.hb-section-title {
  display: flex; align-items: center; justify-content: space-between;
  color: var(--hb-text-muted);
  font-size: 10px; font-weight: 600; letter-spacing: 0.16em;
  padding: 4px 8px 8px;
}
.hb-section-title-text {
  display: inline-flex; align-items: center; gap: 6px;
}
.hb-section-title-icon {
  color: var(--hb-text-muted);
  opacity: 0.85;
}

.hb-row {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  background: transparent; border: none;
  color: var(--hb-text-soft);
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  text-align: left;
  position: relative;
  user-select: none;
}
.hb-row:hover { background: var(--hb-bg-hover); color: var(--hb-text); }
.hb-row.active { background: var(--hb-bg-active); color: #ffffff; }
.hb-row-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hb-row-count { color: var(--hb-text-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.hb-row.active .hb-row-count { color: var(--hb-text-soft); }
.hb-row-action { opacity: 0; }
.hb-row:hover .hb-row-action { opacity: 1; }
.hb-row-sub { padding-left: 32px; font-weight: 400; }
.hb-row-muted { color: var(--hb-text-muted); }

.hb-row-status-icon { flex-shrink: 0; }
.hb-row-status-current { color: #f5b400; }
.hb-row-status-completed { color: var(--hb-success); }
.hb-row-completed .hb-row-label {
  text-decoration: line-through;
  text-decoration-color: var(--hb-text-muted);
  color: var(--hb-text-muted);
}
.hb-row-completed.active .hb-row-label {
  text-decoration-color: var(--hb-text-soft);
  color: inherit;
}

.hb-chev {
  display: flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; padding: 0; margin-left: -4px;
  background: transparent; border: none; cursor: pointer;
  color: var(--hb-text-muted);
  flex-shrink: 0;
}
.hb-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
  color: var(--hb-text-muted);
  padding: 4px; border-radius: 6px;
}
.hb-icon-btn:hover { background: var(--hb-bg-hover); color: var(--hb-text); }
.hb-collections .hb-row-muted { color: var(--hb-text-soft); }
.hb-collections .hb-row-muted:hover { color: var(--hb-text); }

.hb-pulse {
  margin: 12px;
  padding: 16px 18px 18px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 12px;
}
.hb-pulse-title {
  color: var(--hb-text-muted);
  font-size: 11px; font-weight: 600; letter-spacing: 0.14em;
  margin-bottom: 14px;
}
.hb-pulse-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 18px; }
.hb-pulse-cell { display: flex; flex-direction: column; gap: 6px; }
.hb-pulse-label {
  color: var(--hb-text-muted);
  font-size: 10px; letter-spacing: 0.14em; font-weight: 600;
}
.hb-pulse-value {
  font-size: 22px; font-weight: 600; line-height: 1.1;
  font-variant-numeric: tabular-nums;
  min-height: 22px;
}
.hb-pulse-value.hb-danger { color: var(--hb-danger); }
.hb-pulse-value.hb-success { color: var(--hb-success); }
.hb-pulse-bar {
  height: 3px;
  width: 28px;
  border-radius: 2px;
  background: var(--hb-text-soft);
  margin-top: 8px;
  opacity: 0.7;
}
.hb-pulse-bar.hb-danger { background: var(--hb-danger); opacity: 1; }
.hb-pulse-bar.hb-success { background: var(--hb-success); opacity: 1; }

/* ============ Main ============ */
.hb-main {
  flex: 1;
  display: flex; flex-direction: column;
  overflow: hidden;
  overflow-x: hidden;
  min-width: 0;
  max-width: 100%;
  background: var(--hb-bg);
}
.hb-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 12px;
  gap: 16px;
  border-bottom: 1px solid var(--hb-border);
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}
.hb-breadcrumb { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.hb-bc-strong { font-size: 18px; font-weight: 600; }
.hb-bc-sep { color: var(--hb-text-muted); }
.hb-bc-soft { color: var(--hb-text-soft); font-size: 14px; }
.hb-bc-count {
  margin-left: 4px;
  color: var(--hb-text-muted);
  font-size: 12px;
  border-left: 1px solid var(--hb-border);
  padding-left: 12px;
}
.hb-header-tools { display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }

.hb-search {
  display: flex; align-items: center; gap: 8px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  padding: 6px 10px;
  width: 280px;
  max-width: 280px;
  min-width: 200px;
  color: var(--hb-text-muted);
  flex-shrink: 1;
}
.hb-search input {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--hb-text); font-size: 13px;
}
.hb-search input::placeholder { color: var(--hb-text-muted); }
.hb-kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; padding: 1px 6px;
  background: var(--hb-bg-hover);
  border: 1px solid var(--hb-border-strong);
  border-radius: 4px;
  font-size: 11px; color: var(--hb-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.hb-kbd-soft { background: transparent; border-color: var(--hb-border); }

.hb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  color: var(--hb-text);
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: background 100ms ease, border-color 100ms ease;
}
.hb-btn:hover { background: var(--hb-bg-hover); border-color: var(--hb-border-strong); }
.hb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.hb-btn-icon { padding: 6px 8px; }
.hb-btn-ghost { background: transparent; }
.hb-btn-primary {
  background: var(--hb-text);
  color: var(--hb-bg);
  border-color: var(--hb-text);
}
.hb-btn-primary:hover { background: var(--hb-text-soft); border-color: var(--hb-text-soft); }
.hb-btn-danger {
  background: rgba(255, 90, 78, 0.12);
  border-color: rgba(255, 90, 78, 0.4);
  color: var(--hb-danger);
}
.hb-btn-danger:hover { background: rgba(255, 90, 78, 0.18); }

.hb-segmented {
  display: inline-flex;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}
.hb-segmented button {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; border: none;
  color: var(--hb-text-soft);
  padding: 4px 10px;
  font-size: 12px; font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
}
.hb-segmented button.active {
  background: var(--hb-bg-hover);
  color: var(--hb-text);
  box-shadow: 0 0 0 1px var(--hb-border-strong) inset;
}

/* ============ Stats row ============ */
.hb-stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 10px 14px 0 0;
  padding: 0 0 0 12px;
}
.hb-stat-card {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 10px;
  min-height: 56px;
}
.hb-stat-icon {
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  color: var(--hb-text-soft);
  flex-shrink: 0;
}
.hb-stat-body { display: flex; flex-direction: column; min-width: 0; }
.hb-stat-label {
  color: var(--hb-text-muted);
  font-size: 10px; letter-spacing: 0.12em; font-weight: 600;
  text-transform: uppercase;
}
.hb-stat-value {
  font-size: 18px; font-weight: 600;
  color: var(--hb-text);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  margin-top: 2px;
}
.hb-stat-sep {
  color: var(--hb-text-muted);
  margin: 0 6px;
  font-weight: 400;
}
.hb-stat-success .hb-stat-icon { color: var(--hb-success); border-color: rgba(63,191,143,0.3); }
.hb-stat-success .hb-stat-value { color: var(--hb-success); }
.hb-stat-danger .hb-stat-icon { color: var(--hb-danger); border-color: rgba(255,90,78,0.3); }
.hb-stat-danger .hb-stat-value { color: var(--hb-danger); }
.hb-stat-warning .hb-stat-icon { color: var(--hb-warning); border-color: rgba(245,159,59,0.3); }
.hb-stat-warning .hb-stat-value { color: var(--hb-warning); }
.hb-stat-info .hb-stat-icon { color: var(--hb-accent); border-color: rgba(91,155,255,0.3); }
.hb-stat-info .hb-stat-value { color: var(--hb-accent); }

/* ============ Filter bar (inline) ============ */
.hb-filterbar {
  display: flex; align-items: center; gap: 10px;
  margin: 12px 14px 2px 12px;
  padding: 8px 12px;
  background: rgba(var(--hb-bg-elev-rgb), 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--hb-border);
  border-radius: 12px;
  font-size: 13px;
  flex-wrap: wrap;
  position: relative;
  min-width: 0;
  max-width: 100%;
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.12);
}
.hb-filterbar-lead {
  display: inline-flex; align-items: center; gap: 8px;
  color: var(--hb-text);
  font-size: 12px; font-weight: 700; letter-spacing: 0.02em;
  padding: 0 8px 0 4px;
}
.hb-filterbar-divider {
  width: 1px; height: 18px;
  background: var(--hb-border-strong);
  margin: 0 4px;
  opacity: 0.6;
}
.hb-filterbar-spacer { flex: 1; min-width: 8px; }
.hb-filterbar-close {
  margin-left: auto;
  border-radius: 8px;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
}
.hb-filterbar-close:hover { background: rgba(255, 90, 78, 0.1); color: var(--hb-danger); }
.hb-filter-reset { 
  padding: 5px 12px; 
  font-size: 12px; 
  border-radius: 8px;
  color: var(--hb-text-soft);
  background: transparent;
  border: 1px dashed var(--hb-border-strong);
}
.hb-filter-reset:hover {
  background: var(--hb-bg-soft);
  color: var(--hb-text);
  border-style: solid;
}

.hb-filter-group-label {
  font-size: 9px;
  font-weight: 800;
  color: var(--hb-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-right: -4px;
  margin-left: 6px;
  user-select: none;
}

/* Filter toggle in header */
.hb-filter-toggle { position: relative; }
.hb-filter-toggle.active {
  background: var(--hb-bg-active);
  color: var(--hb-text);
  border-color: var(--hb-border-strong);
}
.hb-filter-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px;
  padding: 0 6px;
  background: var(--hb-accent);
  color: #ffffff;
  border-radius: 999px;
  font-size: 11px; font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 2px 6px rgba(var(--hb-accent-rgb), 0.4);
}

/* AntD Select & Picker polish inside the filter bar */
.hb-filterbar :where(.ant-select .ant-select-selector),
.hb-filterbar :where(.ant-picker) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
}
.hb-filterbar :where(.ant-select-selection-placeholder),
.hb-filterbar :where(.ant-picker-input > input::placeholder) {
  color: var(--hb-text-muted) !important;
  font-size: 12px !important;
}
.hb-filterbar :where(.ant-select-selection-item),
.hb-filterbar :where(.ant-picker-input > input) {
  color: var(--hb-text) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
}

/* Specific fix for range picker icons and separators */
.hb-filterbar :where(.ant-picker-suffix),
.hb-filterbar :where(.ant-picker-clear) {
  color: var(--hb-text-muted) !important;
}
.hb-filterbar :where(.ant-picker-separator) {
  color: var(--hb-text-muted) !important;
  padding: 0 4px !important;
}

.hb-filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--hb-bg-soft);
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--hb-border);
  transition: all 150ms ease;
}
.hb-filter-group:hover {
  border-color: var(--hb-border-strong);
  background: var(--hb-bg-hover);
}
.hb-filter-group.active {
  background: rgba(var(--hb-accent-rgb), 0.1);
  border-color: rgba(var(--hb-accent-rgb), 0.45);
  box-shadow: 0 0 0 3px rgba(var(--hb-accent-rgb), 0.06);
  animation: hb-pill-in 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes hb-pill-in {
  from { transform: scale(0.96); opacity: 0.8; }
  to { transform: scale(1); opacity: 1; }
}
.hb-filter-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--hb-text-muted);
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 4px;
}
.hb-filter-group.active .hb-filter-label {
  color: var(--hb-accent);
}

/* ============ Quick add ============ */
.hb-quickadd {
  display: flex; align-items: center; gap: 10px;
  margin: 10px 14px 0 12px;
  padding: 10px 14px 10px 22px;
  background: var(--hb-bg-elev);
  border: 1px dashed var(--hb-border);
  border-radius: 10px;
  color: var(--hb-text-muted);
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}
.hb-quickadd input {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--hb-text); font-size: 13px;
}
.hb-quickadd input::placeholder { color: var(--hb-text-muted); }
.hb-quickadd input:disabled { opacity: 0.6; }

/* ============ Bulk bar ============ */
.hb-bulkbar {
  display: flex; align-items: center; justify-content: space-between;
  margin: 10px 14px 0 0;
  padding: 10px 14px 10px 22px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 10px;
  font-size: 13px;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}
.hb-bulkbar-actions { display: flex; gap: 8px; }

/* ============ Table ============ */
.hb-content {
  flex: 1;
  overflow: hidden;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 14px 14px 12px;
  min-width: 0;
  max-width: 100%;
}
.hb-table-wrapper {
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 12px;
  overflow: hidden;
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

/* ============ Pagination footer ============ */
.hb-pagination {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 10px;
  padding: 10px 14px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 10px;
  gap: 12px;
  flex-wrap: wrap;
}
.hb-pagination-info {
  color: var(--hb-text-soft);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}
.hb-pagination-info strong { color: var(--hb-text); font-weight: 600; }
.hb-pagination-controls {
  display: flex; align-items: center; gap: 14px;
}
.hb-pagination-pagesize {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px;
  color: var(--hb-text-muted);
  letter-spacing: 0.04em;
}
.hb-pagination-pagesize select {
  padding: 4px 22px 4px 8px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 6px;
  color: var(--hb-text);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--hb-text-muted) 50%),
                    linear-gradient(135deg, var(--hb-text-muted) 50%, transparent 50%);
  background-position: calc(100% - 12px) 50%, calc(100% - 8px) 50%;
  background-size: 4px 4px, 4px 4px;
  background-repeat: no-repeat;
}
.hb-pagination-pagesize select:focus { outline: none; border-color: var(--hb-border-strong); }
.hb-light .hb-pagination-pagesize select { background-color: #ffffff; }
.hb-pagination-pager {
  display: inline-flex; align-items: center; gap: 8px;
}
.hb-pagination-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 5px 12px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  color: var(--hb-text-soft);
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  font-variant-numeric: tabular-nums;
}
.hb-light .hb-pagination-btn { background: #ffffff; }
.hb-pagination-btn:hover:not(:disabled) {
  background: var(--hb-bg-hover);
  color: var(--hb-text);
  border-color: var(--hb-border-strong);
}
.hb-pagination-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.hb-pagination-page {
  color: var(--hb-text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding: 0 4px;
}
.hb-pagination-page strong { color: var(--hb-text); font-weight: 600; }
.hb-table { width: 100%; max-width: 100%; min-width: 0; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
.hb-table thead th {
  position: sticky; top: 0; z-index: 1;
  background: var(--hb-bg-elev);
  color: var(--hb-text-muted);
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--hb-border);
}
.hb-table tbody td {
  padding: 12px 8px;
  border-bottom: 1px solid var(--hb-border);
  font-size: 13px;
  vertical-align: middle;
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hb-table tbody tr:last-child td { border-bottom: none; }
.hb-tr { cursor: pointer; transition: background 80ms ease; }
.hb-tr:hover { background: var(--hb-bg-soft); }

.hb-th-check, .hb-td-check { width: 36px; padding-left: 14px !important; padding-right: 0 !important; }
.hb-th-check input, .hb-td-check input {
  width: 14px; height: 14px;
  accent-color: var(--hb-accent);
  cursor: pointer;
}

.hb-title-cell {
  display: flex; flex-direction: column;
  min-width: 0; line-height: 1.25; gap: 2px;
}
.hb-bug-num {
  color: var(--hb-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px; letter-spacing: 0.02em;
}
.hb-bug-title {
  color: var(--hb-text);
  font-weight: 500;
  font-size: 11.5px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 420px;
}

.hb-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 9px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 11px; font-weight: 500;
  white-space: nowrap;
}
.hb-pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.hb-assignee { display: flex; align-items: center; gap: 8px; color: var(--hb-text); }
.hb-muted { color: var(--hb-text-muted); }

.hb-ticket-link {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: var(--hb-text-soft);
  text-decoration: none;
}
.hb-ticket-link:hover { color: var(--hb-text); border-color: var(--hb-border-strong); }

.hb-create-ticket {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px;
  background: transparent;
  border: 1px dashed var(--hb-border-strong);
  border-radius: 8px;
  color: var(--hb-text-muted);
  font-size: 11px;
  cursor: pointer;
}
.hb-create-ticket:hover { color: var(--hb-text); border-color: var(--hb-text-soft); background: var(--hb-bg-soft); }

.hb-attach {
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--hb-text-soft);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.hb-meta-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
.hb-meta-stack {
  display: flex; flex-direction: column; min-width: 0; line-height: 1.2;
}
.hb-meta-name {
  color: var(--hb-text);
  font-size: 12.5px; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 140px;
}
.hb-meta-time {
  color: var(--hb-text-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.hb-tags { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.hb-tag {
  display: inline-flex; align-items: center;
  padding: 2px 8px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 6px;
  color: var(--hb-text-soft);
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.hb-tag-overflow { color: var(--hb-text-muted); }

.hb-empty {
  color: var(--hb-text-muted);
  text-align: center;
  padding: 48px 24px;
  font-size: 13px;
}
.hb-board-empty {
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 12px;
}

/* ============================================================
   Archived Sheets – card grid view
   ============================================================ */

/* trash and archive unified layout */
.trash-view-container, .archive-view-container {
  padding: 14px 14px 0 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.trash-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 4px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 12px;
  width: fit-content;
}

.trash-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--hb-text-soft);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
  position: relative;
}

.trash-tab:hover {
  background: var(--hb-bg-hover);
  color: var(--hb-text);
}

.trash-tab.active {
  background: var(--hb-bg-soft);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.hb-light .trash-tab.active {
  color: var(--hb-text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--hb-border-strong);
  color: var(--hb-text-muted);
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  margin-left: 4px;
}

.trash-tab.active .count-badge {
  background: var(--hb-accent);
  color: #ffffff;
}

.trash-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
}

/* section header */
.arc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px 18px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 12px;
}
.arc-header-icon {
  width: 34px; height: 34px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: rgba(245,159,59,0.12);
  color: #f59f3b;
  border: 1px solid rgba(245,159,59,0.25);
  flex-shrink: 0;
}
.arc-header-title {
  font-size: 14px; font-weight: 600;
  color: var(--hb-text);
}
.arc-header-sub {
  font-size: 12px;
  color: var(--hb-text-muted);
  margin-top: 2px;
}

/* card grid */
.arc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

/* individual card */
.arc-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 140ms ease, background 120ms ease, box-shadow 140ms ease;
  position: relative;
  overflow: hidden;
}
.arc-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(245,159,59,0.6), rgba(245,159,59,0.15));
  border-radius: 14px 14px 0 0;
  opacity: 0;
  transition: opacity 140ms ease;
}
.arc-card:hover {
  border-color: var(--hb-border-strong);
  background: var(--hb-bg-hover);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}
.arc-card:hover::before { opacity: 1; }
.arc-card-selected {
  border-color: rgba(245,159,59,0.5);
  background: var(--hb-bg-hover);
  box-shadow: 0 0 0 2px rgba(245,159,59,0.15);
}
.arc-card-selected::before { opacity: 1; }
.arc-card-bulk-selected {
  border-color: var(--hb-accent);
  background: rgba(var(--hb-accent-rgb), 0.08);
  box-shadow: 0 0 0 2px rgba(var(--hb-accent-rgb), 0.15);
}
.arc-card-bulk-selected::before {
  opacity: 1;
  background: var(--hb-accent);
}
.arc-card-skeleton { cursor: default; }
.arc-card-skeleton:hover { border-color: var(--hb-border); background: var(--hb-bg-elev); box-shadow: none; }

/* top row badges */
.arc-card-toprow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.arc-badge-archived {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px;
  background: rgba(245,159,59,0.12);
  color: #f59f3b;
  border: 1px solid rgba(245,159,59,0.25);
  border-radius: 999px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
}
.arc-badge-trashed {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px;
  background: rgba(255,90,78,0.12);
  color: #ff5a4e;
  border: 1px solid rgba(255,90,78,0.25);
  border-radius: 999px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
}
.arc-badge-bugs {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px;
  background: var(--hb-bg-soft);
  color: var(--hb-text-soft);
  border: 1px solid var(--hb-border);
  border-radius: 999px;
  font-size: 10px; font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* name */
.arc-card-name {
  font-size: 14px; font-weight: 600;
  color: var(--hb-text);
  line-height: 1.3;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin-top: 2px;
}

/* description */
.arc-card-desc {
  font-size: 12px;
  color: var(--hb-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* folder tag */
.arc-card-folder {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--hb-text-soft);
  font-size: 12px;
  overflow: hidden;
}
.arc-card-folder span {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* divider */
.arc-card-divider {
  height: 1px;
  background: var(--hb-border);
  margin: 4px 0;
}

/* footer */
.arc-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.arc-card-creator {
  display: flex; align-items: center; gap: 6px;
  min-width: 0;
  flex: 1;
}
.arc-card-creator-name {
  font-size: 11.5px;
  color: var(--hb-text-soft);
  font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.arc-card-dates {
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0;
}
.arc-card-date {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px;
  color: var(--hb-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* action buttons row */
.arc-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.arc-action-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px; font-weight: 500;
  border: 1px solid var(--hb-border);
  background: var(--hb-bg-soft);
  color: var(--hb-text-soft);
  cursor: pointer;
  transition: background 100ms ease, color 100ms ease, border-color 100ms ease;
  white-space: nowrap;
}
.arc-action-btn:hover { background: var(--hb-bg-hover); color: var(--hb-text); border-color: var(--hb-border-strong); }
.arc-action-view {
  flex: 1;
  justify-content: center;
  background: var(--hb-bg-active);
  color: var(--hb-text);
  border-color: var(--hb-border-strong);
}
.arc-action-view:hover { background: var(--hb-accent); color: var(--hb-accent-fg); border-color: var(--hb-accent); }
.arc-action-restore { }
.arc-action-restore:hover { color: #3fbf8f; border-color: rgba(63,191,143,0.4); background: rgba(63,191,143,0.08); }
.arc-action-delete:hover { color: var(--hb-danger); border-color: rgba(255,90,78,0.35); background: rgba(255,90,78,0.08); }

/* empty state */
.arc-empty-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center;
  padding: 72px 24px;
  background: var(--hb-bg-elev);
  border: 1px dashed var(--hb-border);
  border-radius: 16px;
  text-align: center;
  gap: 12px;
}
.arc-empty-icon {
  width: 64px; height: 64px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  color: var(--hb-text-muted);
  margin-bottom: 4px;
}
.arc-empty-title {
  font-size: 16px; font-weight: 600;
  color: var(--hb-text);
}
.arc-empty-sub {
  font-size: 13px;
  color: var(--hb-text-muted);
  max-width: 340px;
  line-height: 1.6;
}

/* ============================================================
   Archived-sheet-in-view: context banner shown above bug table
   ============================================================ */
.hb-archive-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  margin-bottom: 10px;
  background: rgba(245,159,59,0.07);
  border: 1px solid rgba(245,159,59,0.22);
  border-radius: 10px;
  font-size: 13px;
  flex-wrap: wrap;
}
.hb-archive-banner-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border-radius: 8px;
  background: rgba(245,159,59,0.14);
  color: #f59f3b;
  border: 1px solid rgba(245,159,59,0.3);
  flex-shrink: 0;
}
.hb-archive-banner-text {
  flex: 1;
  min-width: 0;
}
.hb-archive-banner-title {
  font-weight: 600;
  color: #f59f3b;
  font-size: 13px;
}
.hb-archive-banner-sub {
  font-size: 12px;
  color: var(--hb-text-muted);
  margin-top: 1px;
}
.hb-archive-banner-back {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: rgba(245,159,59,0.12);
  border: 1px solid rgba(245,159,59,0.3);
  border-radius: 8px;
  color: #f59f3b;
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease;
  white-space: nowrap;
}
.hb-archive-banner-back:hover { background: rgba(245,159,59,0.2); }

/* ============ Filters popover ============ */
.hb-filters-popover {
  display: flex; flex-direction: column; gap: 10px;
  min-width: 220px;
}
.hb-filter-field {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.hb-filter-field label {
  font-size: 12px; color: #4b5563; font-weight: 500;
}
.hb-filters-footer {
  display: flex; justify-content: flex-end;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px; margin-top: 4px;
}

/* ============================================================
   AI Review & Grouping wizard modal
   ============================================================ */

/* Modal renders in a portal outside .hb-root, so the palette
   must be scoped directly to .hb-aimodal-{dark,light}. */
.hb-aimodal-dark {
  --hb-bg: #070a12;
  --hb-bg-elev: #0a0f1c;
  --hb-bg-soft: #0f1524;
  --hb-bg-hover: #141b2c;
  --hb-bg-active: #1a2540;
  --hb-border: #1a2030;
  --hb-border-strong: #232a3c;
  --hb-text: #e6e8ee;
  --hb-text-soft: #aab1bd;
  --hb-text-muted: #6f7684;
  --hb-success: #3fbf8f;
  --hb-warning: #f59f3b;
  --hb-danger: #ff5a4e;
}
.hb-aimodal-light {
  --hb-bg: #ffffff;
  --hb-bg-elev: #fafbfc;
  --hb-bg-soft: #f3f4f6;
  --hb-bg-hover: #eef0f3;
  --hb-bg-active: #e0eaff;
  --hb-border: #e5e7eb;
  --hb-border-strong: #d1d5db;
  --hb-text: #111827;
  --hb-text-soft: #4b5563;
  --hb-text-muted: #9ca3af;
  --hb-success: #16a34a;
  --hb-warning: #d97706;
  --hb-danger: #dc2626;
}
.hb-aimodal .ant-modal-content {
  padding: 0 !important;
  background: var(--hb-bg-elev) !important;
  border: 1px solid var(--hb-border) !important;
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 24px 64px -12px rgba(0,0,0,0.45),
              0 0 0 1px var(--hb-border) inset !important;
}
.hb-aimodal-light .ant-modal-content {
  background: #ffffff !important;
  box-shadow: 0 24px 60px -12px rgba(15,23,42,0.18),
              0 0 0 1px var(--hb-border) inset !important;
}
.hb-aimodal .ant-modal-mask {
  background: rgba(7, 10, 18, 0.65) !important;
  backdrop-filter: blur(6px);
}
.hb-aimodal-light .ant-modal-mask {
  background: rgba(15, 23, 42, 0.35) !important;
}

.hb-aim {
  display: flex; flex-direction: column;
  color: var(--hb-text);
  background: var(--hb-bg-elev);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  font-size: 13px;
  letter-spacing: -0.01em;
  max-height: 86vh;
}
.hb-light .hb-aim { background: #ffffff; }

.hb-aim-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 22px 24px 18px;
  background:
    radial-gradient(120% 80% at 0% 0%, rgba(124,156,255,0.10), transparent 60%),
    radial-gradient(100% 100% at 100% 0%, rgba(245,159,59,0.08), transparent 60%);
  border-bottom: 1px solid var(--hb-border);
}
.hb-aim-titleblock { display: flex; flex-direction: column; gap: 4px; }
.hb-aim-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  align-self: flex-start;
  padding: 3px 10px;
  background: rgba(124,156,255,0.14);
  color: #b3c7ff;
  border: 1px solid rgba(124,156,255,0.30);
  border-radius: 999px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.hb-light .hb-aim-eyebrow {
  background: #eef2ff; color: #4f46e5; border-color: #c7d2fe;
}
.hb-aim-title { font-size: 20px; font-weight: 600; line-height: 1.2; }
.hb-aim-sub { color: var(--hb-text-soft); font-size: 13px; }

.hb-aim-close {
  background: transparent; border: 1px solid var(--hb-border);
  color: var(--hb-text-muted);
  width: 32px; height: 32px;
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.hb-aim-close:hover { color: var(--hb-text); background: var(--hb-bg-hover); }

/* Stepper */
.hb-aim-stepper {
  display: flex; align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--hb-border);
  background: var(--hb-bg-soft);
}
.hb-light .hb-aim-stepper { background: #f9fafb; }
.hb-aim-step {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px; font-weight: 500;
  color: var(--hb-text-muted);
}
.hb-aim-step-icon {
  width: 22px; height: 22px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
}
.hb-light .hb-aim-step-icon { background: #ffffff; }
.hb-aim-step-active { color: var(--hb-text); }
.hb-aim-step-active .hb-aim-step-icon {
  background: rgba(124,156,255,0.20);
  border-color: rgba(124,156,255,0.55);
  color: #c8d6ff;
}
.hb-light .hb-aim-step-active .hb-aim-step-icon {
  background: #eef2ff; color: #4f46e5; border-color: #c7d2fe;
}
.hb-aim-step-done .hb-aim-step-icon {
  background: rgba(63,191,143,0.16);
  border-color: rgba(63,191,143,0.40);
  color: var(--hb-success);
}
.hb-aim-step-done { color: var(--hb-text-soft); }
.hb-aim-step-rail {
  flex: 1; max-width: 64px; height: 1px;
  background: var(--hb-border);
}
.hb-aim-step-rail-done { background: var(--hb-success); opacity: 0.6; }

/* Body */
.hb-aim-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 280px;
  max-height: 60vh;
}

/* Hero (initial review) */
.hb-aim-hero {
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
  padding: 32px 24px 12px;
  gap: 12px;
}
.hb-aim-hero-icon {
  width: 56px; height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(124,156,255,0.25), rgba(165,108,255,0.25));
  border: 1px solid rgba(124,156,255,0.4);
  display: inline-flex; align-items: center; justify-content: center;
  color: #b3c7ff;
}
.hb-light .hb-aim-hero-icon {
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  border-color: #c7d2fe;
  color: #4f46e5;
}
.hb-aim-hero-title { font-size: 18px; font-weight: 600; }
.hb-aim-hero-sub {
  color: var(--hb-text-soft);
  max-width: 460px;
  line-height: 1.5;
}
.hb-aim-checklist {
  margin: 8px 0 4px;
  list-style: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
  text-align: left;
  padding: 0;
  max-width: 480px;
}
.hb-aim-checklist li {
  display: flex; align-items: center; gap: 8px;
  color: var(--hb-text-soft);
  font-size: 12.5px;
}
.hb-aim-checklist svg { color: var(--hb-success); }

/* Empty / running */
.hb-aim-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px;
  padding: 64px 24px;
  color: var(--hb-text-muted);
  font-size: 13px;
}
.hb-aim-running {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(124,156,255,0.10);
  color: #b3c7ff;
  border: 1px solid rgba(124,156,255,0.30);
  font-size: 12px;
  align-self: center;
  margin-top: 8px;
}
.hb-light .hb-aim-running {
  background: #eef2ff; color: #4f46e5; border-color: #c7d2fe;
}
.hb-aim-spin { animation: hbSpin 1.4s linear infinite; }
@keyframes hbSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

/* Review cards */
.hb-aim-cards { display: flex; flex-direction: column; gap: 12px; }
.hb-aim-card {
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 12px;
  padding: 16px 18px;
}
.hb-light .hb-aim-card { background: #ffffff; }
.hb-aim-card-head {
  display: flex; align-items: center; gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--hb-border);
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.hb-aim-bugnum {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: var(--hb-text-muted);
  flex-shrink: 0;
}
.hb-aim-card-title {
  font-weight: 600; font-size: 14px; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hb-aim-card-grid { display: flex; flex-direction: column; gap: 12px; }
.hb-aim-section { display: flex; flex-direction: column; gap: 4px; }
.hb-aim-section-label {
  color: var(--hb-text-muted);
  font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
}
.hb-aim-section-body {
  color: var(--hb-text);
  font-size: 13px; line-height: 1.5;
}
.hb-aim-twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.hb-aim-steps {
  margin: 0; padding-left: 18px;
  display: flex; flex-direction: column; gap: 4px;
}
.hb-aim-skip {
  display: flex; flex-direction: column; gap: 6px;
  color: var(--hb-text-soft);
}
.hb-aim-skip span {
  color: var(--hb-text-muted);
  font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
}
.hb-aim-missing {
  display: flex; gap: 10px;
  padding: 10px 12px;
  background: rgba(245,159,59,0.10);
  border: 1px solid rgba(245,159,59,0.30);
  border-radius: 8px;
  color: var(--hb-warning);
}
.hb-light .hb-aim-missing { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
.hb-aim-missing-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
.hb-aim-missing ul { margin: 0; padding-left: 16px; color: var(--hb-text-soft); font-size: 12.5px; }

/* Severity pills (compact) */
.hb-aim-pill {
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.hb-aim-pill-blocker { color: #ff8aa1; border-color: rgba(255,77,109,0.4); background: rgba(255,77,109,0.12); }
.hb-aim-pill-critical { color: #ff8a7d; border-color: rgba(255,90,78,0.4); background: rgba(255,90,78,0.12); }
.hb-aim-pill-major { color: #f9bd6c; border-color: rgba(245,159,59,0.4); background: rgba(245,159,59,0.12); }
.hb-aim-pill-minor { color: #f0d97c; border-color: rgba(230,200,77,0.4); background: rgba(230,200,77,0.12); }

/* Group cards */
.hb-aim-groups { display: flex; flex-direction: column; gap: 12px; }
.hb-aim-group {
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 12px;
  overflow: hidden;
}
.hb-light .hb-aim-group { background: #ffffff; }
.hb-aim-group-head {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  user-select: none;
}
.hb-aim-group-head:hover { background: var(--hb-bg-hover); }
.hb-aim-group-bullet {
  width: 26px; height: 26px;
  border-radius: 8px;
  background: rgba(124,156,255,0.18);
  border: 1px solid rgba(124,156,255,0.4);
  color: #c8d6ff;
  font-weight: 600;
  font-size: 12px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hb-light .hb-aim-group-bullet {
  background: #eef2ff; color: #4f46e5; border-color: #c7d2fe;
}
.hb-aim-group-meta { flex: 1; min-width: 0; }
.hb-aim-group-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.hb-aim-group-title { font-weight: 600; font-size: 14px; }
.hb-aim-group-reason {
  color: var(--hb-text-muted);
  font-size: 12px;
  margin-top: 2px;
}
.hb-aim-tag {
  padding: 2px 8px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 6px;
  font-size: 11px;
  color: var(--hb-text-soft);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.hb-light .hb-aim-tag { background: #f9fafb; }
.hb-aim-bugcount {
  margin-left: auto;
  color: var(--hb-text-muted);
  font-size: 11px;
}
.hb-aim-icon-btn {
  width: 28px; height: 28px;
  border-radius: 7px;
  border: 1px solid var(--hb-border);
  background: transparent;
  color: var(--hb-text-muted);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.hb-aim-icon-btn:hover { background: var(--hb-bg-hover); color: var(--hb-text); }
.hb-aim-danger:hover {
  background: rgba(255,90,78,0.12);
  color: var(--hb-danger);
  border-color: rgba(255,90,78,0.4);
}

.hb-aim-group-body {
  padding: 16px 18px 18px;
  border-top: 1px solid var(--hb-border);
  display: flex; flex-direction: column; gap: 12px;
}
.hb-aim-field { display: flex; flex-direction: column; gap: 5px; }
.hb-aim-field label {
  color: var(--hb-text-muted);
  font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
}

.hb-aim-buglist {
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  padding: 8px 10px;
}
.hb-light .hb-aim-buglist { background: #f9fafb; }
.hb-aim-buglist-title {
  color: var(--hb-text-muted);
  font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
  margin-bottom: 6px;
}
.hb-aim-bugrow {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 4px;
  border-bottom: 1px dashed var(--hb-border);
}
.hb-aim-bugrow:last-child { border-bottom: none; }
.hb-aim-bugrow-title {
  flex: 1;
  font-size: 12.5px;
  color: var(--hb-text-soft);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* Done */
.hb-aim-done {
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
  padding: 28px 16px;
  gap: 10px;
}
.hb-aim-done-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(63,191,143,0.16);
  border: 1px solid rgba(63,191,143,0.40);
  color: var(--hb-success);
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 6px;
}
.hb-aim-done-title { font-size: 20px; font-weight: 600; }
.hb-aim-done-sub { color: var(--hb-text-soft); margin-bottom: 16px; }
.hb-aim-tickets {
  display: flex; flex-direction: column; gap: 8px;
  width: 100%;
  max-width: 520px;
}
.hb-aim-ticket {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 10px;
  text-decoration: none;
  text-align: left;
  font: inherit;
  color: var(--hb-text);
  cursor: pointer;
}
.hb-light .hb-aim-ticket { background: #ffffff; }
.hb-aim-ticket:hover {
  border-color: var(--hb-border-strong);
  background: var(--hb-bg-hover);
}
.hb-aim-ticket-num {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  font-size: 13px;
}
.hb-aim-ticket-meta {
  color: var(--hb-text-muted);
  font-size: 11px;
  margin-top: 2px;
}

/* Footer */
.hb-aim-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid var(--hb-border);
  background: var(--hb-bg-soft);
}
.hb-light .hb-aim-footer { background: #f9fafb; }
.hb-aim-footer-meta {
  color: var(--hb-text-muted);
  font-size: 12px;
}
.hb-aim-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  border-radius: 9px;
  background: var(--hb-text);
  color: var(--hb-bg);
  border: 1px solid var(--hb-text);
  font-size: 13px; font-weight: 600;
  cursor: pointer;
}
.hb-aim-primary:hover { background: var(--hb-text-soft); border-color: var(--hb-text-soft); }
.hb-aim-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.hb-aim-secondary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border-radius: 9px;
  background: transparent;
  color: var(--hb-text-soft);
  border: 1px solid var(--hb-border);
  font-size: 13px; font-weight: 500;
  cursor: pointer;
}
.hb-aim-secondary:hover { color: var(--hb-text); background: var(--hb-bg-hover); }

/* ============================================================
   Capture Bug Drawer
   ============================================================ */
/* Drawer also portals — palette must be on the drawer class. */
.hb-cbd-dark {
  --hb-bg: #070a12;
  --hb-bg-elev: #0a0f1c;
  --hb-bg-soft: #0f1524;
  --hb-bg-hover: #141b2c;
  --hb-bg-active: #1a2540;
  --hb-border: #1a2030;
  --hb-border-strong: #232a3c;
  --hb-text: #e6e8ee;
  --hb-text-soft: #aab1bd;
  --hb-text-muted: #6f7684;
  --hb-success: #3fbf8f;
  --hb-warning: #f59f3b;
  --hb-danger: #ff5a4e;
  --hb-accent-soft: rgba(124,156,255,0.18);
  --hb-accent-border: rgba(124,156,255,0.40);
  --hb-accent-fg: #c8d6ff;
}
.hb-cbd-light {
  --hb-bg: #ffffff;
  --hb-bg-elev: #fafbfc;
  --hb-bg-soft: #f3f4f6;
  --hb-bg-hover: #eef0f3;
  --hb-bg-active: #e0eaff;
  --hb-border: #e5e7eb;
  --hb-border-strong: #d1d5db;
  --hb-text: #111827;
  --hb-text-soft: #4b5563;
  --hb-text-muted: #9ca3af;
  --hb-success: #16a34a;
  --hb-warning: #d97706;
  --hb-danger: #dc2626;
  --hb-accent-soft: #eef2ff;
  --hb-accent-border: #c7d2fe;
  --hb-accent-fg: #4f46e5;
}

.hb-cbd .ant-drawer-content {
  background: var(--hb-bg-elev) !important;
}
.hb-cbd .ant-drawer-body {
  padding: 0 !important;
  background: var(--hb-bg-elev) !important;
}
.hb-cbd .ant-drawer-mask {
  background: rgba(7,10,18,0.55) !important;
  backdrop-filter: blur(4px);
}
.hb-cbd-light .ant-drawer-mask {
  background: rgba(15,23,42,0.30) !important;
}

.hb-cbd-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: var(--hb-text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  font-size: 13px;
  letter-spacing: -0.01em;
  background: var(--hb-bg-elev);
}

/* Drag overlay */
.hb-cbd-dropoverlay {
  position: absolute; inset: 0;
  z-index: 20;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px;
  background: rgba(124,156,255,0.10);
  backdrop-filter: blur(6px);
  border: 2px dashed var(--hb-accent-border);
  margin: 8px;
  border-radius: 14px;
  pointer-events: none;
  color: var(--hb-accent-fg);
}
.hb-cbd-light .hb-cbd-dropoverlay {
  background: rgba(79,70,229,0.06);
  color: #4f46e5;
}
.hb-cbd-dropoverlay-title { font-size: 14px; font-weight: 600; }
.hb-cbd-dropoverlay-sub { font-size: 12px; color: var(--hb-text-soft); }

/* Header */
.hb-cbd-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 22px 24px 18px;
  background:
    radial-gradient(120% 80% at 0% 0%, rgba(124,156,255,0.10), transparent 60%),
    radial-gradient(100% 100% at 100% 0%, rgba(245,159,59,0.06), transparent 60%);
  border-bottom: 1px solid var(--hb-border);
}
.hb-cbd-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  align-self: flex-start;
  padding: 3px 9px;
  background: var(--hb-accent-soft);
  color: var(--hb-accent-fg);
  border: 1px solid var(--hb-accent-border);
  border-radius: 999px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.hb-cbd-headtitle { font-size: 18px; font-weight: 600; line-height: 1.2; }
.hb-cbd-headsub { color: var(--hb-text-soft); font-size: 12.5px; margin-top: 4px; }

.hb-cbd-iconbtn {
  background: transparent; border: 1px solid var(--hb-border);
  color: var(--hb-text-muted);
  width: 30px; height: 30px;
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.hb-cbd-iconbtn:hover { color: var(--hb-text); background: var(--hb-bg-hover); }
.hb-cbd-iconbtn-sm {
  background: transparent; border: none;
  color: var(--hb-text-muted);
  padding: 4px; border-radius: 6px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.hb-cbd-iconbtn-sm:hover { color: var(--hb-danger); background: var(--hb-bg-hover); }

/* Body */
.hb-cbd-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 24px 22px;
  display: flex; flex-direction: column; gap: 18px;
}

/* Title input — large, borderless */
.hb-cbd-title-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--hb-text);
  font-size: 17px; font-weight: 600;
  letter-spacing: -0.01em;
  padding: 4px 0;
  border-bottom: 1px solid transparent;
  transition: border-color 120ms ease;
}
.hb-cbd-title-input::placeholder { color: var(--hb-text-muted); font-weight: 500; }
.hb-cbd-title-input:focus { border-bottom-color: var(--hb-border); }

/* Field labels */
.hb-cbd-fieldgroup { display: flex; flex-direction: column; gap: 6px; }
.hb-cbd-row { display: flex; gap: 12px; }
.hb-cbd-half { flex: 1; min-width: 0; }
.hb-cbd-fieldhead {
  display: flex; align-items: center; justify-content: space-between;
}
.hb-cbd-label {
  display: inline-flex; align-items: center; gap: 5px;
  color: var(--hb-text-muted);
  font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
}
.hb-cbd-label-icon { display: inline-flex; }
.hb-cbd-required { color: var(--hb-danger); margin-left: 2px; }

.hb-cbd-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  color: var(--hb-text);
  font-size: 13px;
  outline: none;
  transition: border-color 120ms ease, background 120ms ease;
}
.hb-cbd-light .hb-cbd-input { background: #ffffff; }
.hb-cbd-input::placeholder { color: var(--hb-text-muted); }
.hb-cbd-input:focus { border-color: var(--hb-border-strong); }

.hb-cbd-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 10px;
  color: var(--hb-text);
  font-size: 13px;
  line-height: 1.55;
  outline: none;
  resize: vertical;
  min-height: 110px;
  font-family: inherit;
  transition: border-color 120ms ease;
}
.hb-cbd-light .hb-cbd-textarea { background: #ffffff; }
.hb-cbd-textarea::placeholder { color: var(--hb-text-muted); }
.hb-cbd-textarea:focus { border-color: var(--hb-border-strong); }

.hb-cbd-error .hb-cbd-textarea { border-color: var(--hb-danger); }
.hb-cbd-errortext { color: var(--hb-danger); font-size: 11.5px; }

/* Segmented chips (Severity / Type) */
.hb-cbd-segrow { display: flex; gap: 8px; flex-wrap: wrap; }
.hb-cbd-seg {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 999px;
  color: var(--hb-text-soft);
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}
.hb-cbd-light .hb-cbd-seg { background: #ffffff; }
.hb-cbd-seg:hover { background: var(--hb-bg-hover); color: var(--hb-text); }
.hb-cbd-seg.active {
  color: var(--hb-text);
  background: var(--hb-bg-active);
  border-color: var(--hb-seg-accent, var(--hb-border-strong));
  box-shadow: 0 0 0 1px var(--hb-seg-accent, transparent) inset;
}
.hb-cbd-seg-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

/* Tag box */
.hb-cbd-tagbox {
  display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
  padding: 6px 8px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  min-height: 36px;
}
.hb-cbd-light .hb-cbd-tagbox { background: #ffffff; }
.hb-cbd-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 4px 2px 8px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 6px;
  color: var(--hb-text-soft);
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.hb-cbd-light .hb-cbd-tag { background: var(--hb-bg-soft); }
.hb-cbd-tag button {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
  color: var(--hb-text-muted);
  padding: 2px;
  border-radius: 4px;
}
.hb-cbd-tag button:hover { color: var(--hb-danger); background: var(--hb-bg-hover); }
.hb-cbd-tag-input {
  flex: 1; min-width: 100px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--hb-text);
  font-size: 12.5px;
  padding: 4px 4px;
}
.hb-cbd-tag-input::placeholder { color: var(--hb-text-muted); }

/* Attachments — dropzone + tiles */
.hb-cbd-linkbtn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--hb-border);
  border-radius: 6px;
  color: var(--hb-text-soft);
  font-size: 11px; font-weight: 500;
  cursor: pointer;
}
.hb-cbd-linkbtn:hover { color: var(--hb-text); background: var(--hb-bg-hover); }

.hb-cbd-dropzone {
  display: flex; align-items: center; gap: 12px;
  width: 100%;
  padding: 18px 18px;
  background: var(--hb-bg-soft);
  border: 1px dashed var(--hb-border-strong);
  border-radius: 12px;
  color: var(--hb-text-muted);
  cursor: pointer;
  text-align: left;
  transition: all 120ms ease;
}
.hb-cbd-light .hb-cbd-dropzone { background: #ffffff; }
.hb-cbd-dropzone:hover {
  background: var(--hb-bg-hover);
  border-color: var(--hb-accent-border);
  color: var(--hb-accent-fg);
}
.hb-cbd-dropzone-title { color: var(--hb-text); font-size: 13px; font-weight: 500; }
.hb-cbd-dropzone-sub { color: var(--hb-text-muted); font-size: 11.5px; margin-top: 2px; }

.hb-cbd-attachments {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.hb-cbd-tile {
  display: flex; flex-direction: column; gap: 4px;
  min-width: 0;
}
.hb-cbd-tile-preview {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 10px;
  overflow: hidden;
}
.hb-cbd-light .hb-cbd-tile-preview { background: var(--hb-bg-soft); }
.hb-cbd-tile-preview img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.hb-cbd-tile-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: var(--hb-text-muted);
}
.hb-cbd-tile-remove {
  position: absolute; top: 6px; right: 6px;
  width: 20px; height: 20px;
  background: rgba(0,0,0,0.6);
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  opacity: 0;
  transition: opacity 120ms ease;
}
.hb-cbd-tile:hover .hb-cbd-tile-remove { opacity: 1; }
.hb-cbd-tile-new {
  position: absolute; top: 6px; left: 6px;
  padding: 1px 6px;
  background: var(--hb-accent-soft);
  color: var(--hb-accent-fg);
  border: 1px solid var(--hb-accent-border);
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.hb-cbd-tile-name {
  font-size: 11.5px;
  color: var(--hb-text-soft);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hb-cbd-tile-size {
  font-size: 10.5px;
  color: var(--hb-text-muted);
  font-variant-numeric: tabular-nums;
}

/* Links */
.hb-cbd-linkrow {
  display: flex; gap: 6px; align-items: center;
}
.hb-cbd-linklist {
  display: flex; flex-direction: column; gap: 4px;
  margin-top: 6px;
}
.hb-cbd-link {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  font-size: 12px;
}
.hb-cbd-light .hb-cbd-link { background: #ffffff; }
.hb-cbd-link svg { color: var(--hb-text-muted); flex-shrink: 0; }
.hb-cbd-link-anchor {
  flex: 1;
  color: var(--hb-text-soft);
  text-decoration: none;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hb-cbd-link-anchor:hover { color: var(--hb-text); text-decoration: underline; }

/* Footer */
.hb-cbd-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px;
  padding: 12px 24px 14px;
  border-top: 1px solid var(--hb-border);
  background: var(--hb-bg-soft);
}
.hb-cbd-light .hb-cbd-footer { background: #f9fafb; }
.hb-cbd-footer-hint {
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--hb-text-muted);
  font-size: 11.5px;
}
.hb-cbd-kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px;
  padding: 0 5px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border-strong);
  border-radius: 4px;
  font-size: 10px;
  color: var(--hb-text-soft);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  margin-right: 2px;
}
.hb-cbd-light .hb-cbd-kbd { background: #ffffff; }
.hb-cbd-footer-actions { display: flex; gap: 8px; }

.hb-cbd-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  background: var(--hb-text);
  color: var(--hb-bg);
  border: 1px solid var(--hb-text);
  font-size: 13px; font-weight: 600;
  cursor: pointer;
}
.hb-cbd-primary:hover { background: var(--hb-text-soft); border-color: var(--hb-text-soft); }
.hb-cbd-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.hb-cbd-secondary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  background: transparent;
  color: var(--hb-text-soft);
  border: 1px solid var(--hb-border);
  font-size: 13px; font-weight: 500;
  cursor: pointer;
}
.hb-cbd-secondary:hover { color: var(--hb-text); background: var(--hb-bg-hover); }

.hb-cbd-spin { animation: hbSpin 1.2s linear infinite; }

/* AntD overrides — only inside .hb-dark */
.hb-dark :where(.ant-checkbox-inner) {
  background: transparent;
  border-color: var(--hb-border-strong);
}

/* Drawer-scoped AntD Select polish */
.hb-cbd :where(.ant-select .ant-select-selector) {
  background: var(--hb-bg-soft) !important;
  border-color: var(--hb-border) !important;
  border-radius: 8px !important;
  min-height: 36px !important;
}
.hb-cbd-light :where(.ant-select .ant-select-selector) {
  background: #ffffff !important;
}
.hb-cbd :where(.ant-select-selection-placeholder) {
  color: var(--hb-text-muted) !important;
}
.hb-cbd :where(.ant-select-selection-item) {
  color: var(--hb-text);
}

/* Light-mode AntD polish */
.hb-light :where(.ant-select-dropdown) {
  background: #ffffff;
  border: 1px solid var(--hb-border);
}
.hb-light .hb-search input { color: var(--hb-text); }
.hb-light .hb-search input::placeholder { color: var(--hb-text-muted); }
.hb-light .hb-quickadd input { color: var(--hb-text); }
.hb-light .hb-quickadd input::placeholder { color: var(--hb-text-muted); }
.hb-light .hb-create-ticket { background: transparent; }
.hb-light .hb-create-ticket:hover {
  background: var(--hb-bg-soft);
  color: var(--hb-text);
}
.hb-light .hb-tag { background: #ffffff; }
.hb-light .hb-table-wrapper { background: #ffffff; }
.hb-light .hb-table thead th { background: var(--hb-bg-elev); }
.hb-light .hb-tr:hover { background: var(--hb-bg-soft); }
.hb-light .hb-row-count { color: var(--hb-text-muted); }
.hb-light .hb-row-action,
.hb-light .hb-icon-btn { color: var(--hb-text-muted); }
.hb-light .hb-icon-btn:hover { background: var(--hb-bg-hover); color: var(--hb-text); }
.hb-light .hb-bug-num { color: var(--hb-text-muted); }
.hb-light .hb-stat-card { background: #ffffff; }
.hb-light .hb-filterbar { background: #ffffff; }
.hb-light .hb-filterbar :where(.ant-select .ant-select-selector) {
  background: #ffffff !important;
}
.hb-light .hb-filter-toggle.active {
  background: var(--hb-bg-active);
  color: var(--hb-text);
  border-color: var(--hb-accent);
}
.hb-light .hb-segmented button.active {
  background: #ffffff;
  color: var(--hb-text);
  box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--hb-border-strong) inset;
}
.hb-light .hb-quickadd { background: var(--hb-bg-elev); border-style: dashed; }
.hb-light .hb-bulkbar { background: var(--hb-bg-elev); }
.hb-light .hb-stat-icon { background: var(--hb-bg-soft); }

/* ============ Folder / Sheet Modal — Premium ============ */
/* Rendered via Antd Modal portal (outside .hb-root), so styles are unscoped
   and themed via .hb-fsm-dark / .hb-fsm-light on the modal wrap. */

.hb-fsm-wrap .ant-modal-content { background: transparent !important; }
.hb-fsm {
  --fsm-bg: #0b1020;
  --fsm-bg-elev: #11172a;
  --fsm-bg-soft: #0d1426;
  --fsm-bg-hover: #161e36;
  --fsm-border: #1f2740;
  --fsm-border-strong: #2a3354;
  --fsm-text: #e8ecf5;
  --fsm-text-soft: #aab2c5;
  --fsm-text-muted: #6e7793;
  --fsm-accent: #5b9bff;
  --fsm-danger: #ff5a4e;
  --fsm-shadow: 0 30px 80px rgba(8,12,24,0.45), 0 1px 0 rgba(255,255,255,0.04) inset;

  background: linear-gradient(180deg, var(--fsm-bg-elev) 0%, var(--fsm-bg) 60%);
  color: var(--fsm-text);
  border: 1px solid var(--fsm-border);
  border-radius: 18px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  letter-spacing: -0.01em;
  box-shadow: var(--fsm-shadow);
}
.hb-fsm-light .hb-fsm {
  --fsm-bg: #ffffff;
  --fsm-bg-elev: #fafbfc;
  --fsm-bg-soft: #f4f6fa;
  --fsm-bg-hover: #eef1f6;
  --fsm-border: #e5e7eb;
  --fsm-border-strong: #d1d5db;
  --fsm-text: #0f172a;
  --fsm-text-soft: #475569;
  --fsm-text-muted: #94a3b8;
  --fsm-accent: #2563eb;
  --fsm-shadow: 0 30px 80px rgba(15,23,42,0.18), 0 1px 0 rgba(255,255,255,0.7) inset;
  background: #ffffff;
}

/* ── Hero ── */
.hb-fsm-hero {
  --hb-fsm-accent: #5b9bff;
  position: relative;
  padding: 22px 22px 18px 22px;
  border-bottom: 1px solid var(--fsm-border);
  overflow: hidden;
}
.hb-fsm-hero-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(80% 120% at 100% 0%, color-mix(in oklab, var(--hb-fsm-accent) 28%, transparent) 0%, transparent 60%),
    radial-gradient(60% 100% at 0% 100%, color-mix(in oklab, var(--hb-fsm-accent) 14%, transparent) 0%, transparent 60%);
  opacity: 0.9;
  pointer-events: none;
}
.hb-fsm-light .hb-fsm-hero-bg { opacity: 0.55; }
.hb-fsm-hero-row {
  position: relative;
  display: flex; align-items: flex-start; gap: 14px;
}
.hb-fsm-hero-avatar {
  width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, color-mix(in oklab, var(--hb-fsm-accent) 80%, transparent), color-mix(in oklab, var(--hb-fsm-accent) 35%, transparent));
  color: #fff;
  box-shadow:
    0 6px 18px color-mix(in oklab, var(--hb-fsm-accent) 35%, transparent),
    0 0 0 1px rgba(255,255,255,0.15) inset;
  flex-shrink: 0;
  font-weight: 600;
}
.hb-fsm-hero-initial {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.hb-fsm-hero-text { flex: 1; min-width: 0; }
.hb-fsm-eyebrow {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px;
  background: color-mix(in oklab, var(--hb-fsm-accent) 18%, transparent);
  color: var(--hb-fsm-accent);
  border: 1px solid color-mix(in oklab, var(--hb-fsm-accent) 35%, transparent);
  border-radius: 999px;
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  margin-bottom: 8px;
}
.hb-fsm-light .hb-fsm-eyebrow {
  background: color-mix(in oklab, var(--hb-fsm-accent) 12%, white);
}
.hb-fsm-title {
  font-size: 19px; font-weight: 600;
  color: var(--fsm-text);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hb-fsm-sub {
  font-size: 12.5px;
  color: var(--fsm-text-muted);
  line-height: 1.45;
}
.hb-fsm-close {
  position: relative;
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent;
  border: 1px solid var(--fsm-border);
  border-radius: 8px;
  color: var(--fsm-text-soft);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  flex-shrink: 0;
}
.hb-fsm-close:hover {
  background: var(--fsm-bg-hover);
  color: var(--fsm-text);
  border-color: var(--fsm-border-strong);
}
.hb-fsm-close:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Body ── */
.hb-fsm-body { padding: 18px 22px 6px 22px; }
.hb-fsm-field { margin-bottom: 14px; }
.hb-fsm-label {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--fsm-text-soft);
  font-size: 10.5px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  margin-bottom: 6px;
}
.hb-fsm-req { color: var(--fsm-danger); margin-left: -2px; }
.hb-fsm-opt {
  margin-left: auto;
  text-transform: none;
  letter-spacing: 0;
  color: var(--fsm-text-muted);
  font-weight: 500;
  font-size: 10.5px;
}
.hb-fsm-swatch-dot {
  width: 9px; height: 9px; border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.18);
}

.hb-fsm-fitem { margin-bottom: 0 !important; }
.hb-fsm-fitem-no-mb { display: none; }
.hb-fsm-fitem .ant-form-item-explain-error {
  font-size: 11.5px;
  margin-top: 4px;
  color: var(--fsm-danger);
}

/* Inputs override antd defaults inside our modal */
.hb-fsm .ant-input,
.hb-fsm .ant-input-affix-wrapper,
.hb-fsm .hb-fsm-input,
.hb-fsm .hb-fsm-textarea,
.hb-fsm .ant-select-selector {
  background: var(--fsm-bg-soft) !important;
  border: 1px solid var(--fsm-border) !important;
  border-radius: 10px !important;
  color: var(--fsm-text) !important;
  font-size: 13.5px !important;
  transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease !important;
  box-shadow: none !important;
}
.hb-fsm-light .hb-fsm .ant-input,
.hb-fsm-light .hb-fsm .ant-input-affix-wrapper,
.hb-fsm-light .hb-fsm .hb-fsm-input,
.hb-fsm-light .hb-fsm .hb-fsm-textarea,
.hb-fsm-light .hb-fsm .ant-select-selector {
  background: #ffffff !important;
}
.hb-fsm .ant-input::placeholder,
.hb-fsm .ant-input-affix-wrapper input::placeholder,
.hb-fsm .ant-select-selection-placeholder {
  color: var(--fsm-text-muted) !important;
}
.hb-fsm .ant-input:hover,
.hb-fsm .ant-input-affix-wrapper:hover,
.hb-fsm .ant-select:hover .ant-select-selector {
  border-color: var(--fsm-border-strong) !important;
}
.hb-fsm .ant-input:focus,
.hb-fsm .ant-input-affix-wrapper-focused,
.hb-fsm .ant-select-focused .ant-select-selector {
  border-color: var(--fsm-accent) !important;
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--fsm-accent) 22%, transparent) !important;
}
.hb-fsm .ant-select-selection-item {
  color: var(--fsm-text) !important;
}
.hb-fsm .ant-select-arrow,
.hb-fsm .ant-select-clear {
  color: var(--fsm-text-muted) !important;
}
.hb-fsm .ant-select-clear { background: var(--fsm-bg-soft) !important; }
.hb-fsm-light .hb-fsm .ant-select-clear { background: #ffffff !important; }

/* Color swatches */
.hb-fsm-swatches {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 4px 0 2px 0;
}
.hb-fsm-swatch {
  width: 28px; height: 28px;
  border-radius: 999px;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.08) inset;
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
}
.hb-fsm-swatch:hover { transform: translateY(-1px); }
.hb-fsm-swatch.active {
  border-color: var(--fsm-text);
  box-shadow:
    0 4px 12px rgba(0,0,0,0.25),
    0 0 0 2px var(--fsm-bg) inset;
}
.hb-fsm-light .hb-fsm-swatch.active {
  box-shadow:
    0 4px 10px rgba(15,23,42,0.18),
    0 0 0 2px #ffffff inset;
}

/* Sheet quick presets */
.hb-fsm-presets {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  margin-top: 8px;
}
.hb-fsm-presets-label {
  font-size: 10.5px;
  color: var(--fsm-text-muted);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
  margin-right: 2px;
}
.hb-fsm-preset {
  display: inline-flex; align-items: center;
  padding: 4px 10px;
  background: var(--fsm-bg-soft);
  border: 1px solid var(--fsm-border);
  border-radius: 999px;
  color: var(--fsm-text-soft);
  font-size: 11.5px; font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease;
}
.hb-fsm-light .hb-fsm-preset { background: #ffffff; }
.hb-fsm-preset:hover {
  background: var(--fsm-bg-hover);
  color: var(--fsm-text);
  border-color: var(--fsm-border-strong);
}

/* ── Footer ── */
.hb-fsm-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 14px 22px 18px 22px;
  border-top: 1px solid var(--fsm-border);
  background: linear-gradient(180deg, transparent, color-mix(in oklab, var(--fsm-bg) 60%, transparent));
}
.hb-fsm-secondary,
.hb-fsm-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13px; font-weight: 600;
  letter-spacing: -0.005em;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 160ms ease, background 120ms ease, border-color 120ms ease;
  border: 1px solid transparent;
}
.hb-fsm-secondary {
  background: transparent;
  color: var(--fsm-text-soft);
  border-color: var(--fsm-border);
}
.hb-fsm-secondary:hover:not(:disabled) {
  background: var(--fsm-bg-hover);
  color: var(--fsm-text);
  border-color: var(--fsm-border-strong);
}
.hb-fsm-primary {
  --hb-fsm-accent: #5b9bff;
  color: #ffffff;
  background: linear-gradient(135deg,
    color-mix(in oklab, var(--hb-fsm-accent) 100%, white),
    color-mix(in oklab, var(--hb-fsm-accent) 75%, black));
  box-shadow:
    0 8px 24px color-mix(in oklab, var(--hb-fsm-accent) 38%, transparent),
    0 0 0 1px rgba(255,255,255,0.12) inset;
}
.hb-fsm-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 12px 28px color-mix(in oklab, var(--hb-fsm-accent) 50%, transparent),
    0 0 0 1px rgba(255,255,255,0.18) inset;
}
.hb-fsm-primary:active:not(:disabled) { transform: translateY(0); }
.hb-fsm-primary:disabled,
.hb-fsm-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

.hb-fsm-spin { animation: hbFsmSpin 1.2s linear infinite; }
@keyframes hbFsmSpin { to { transform: rotate(360deg); } }

/* Antd select dropdown popup (rendered as separate portal via popupClassName) */
.hb-fsm-popup.hb-fsm-dark .ant-select-item {
  color: #e8ecf5;
}
.hb-fsm-popup.hb-fsm-dark .rc-virtual-list-holder-inner,
.hb-fsm-popup.hb-fsm-dark {
  background: #11172a !important;
  border: 1px solid #1f2740 !important;
  border-radius: 10px !important;
  box-shadow: 0 12px 30px rgba(0,0,0,0.45) !important;
}
.hb-fsm-popup.hb-fsm-dark .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
  background: #161e36 !important;
}
.hb-fsm-popup.hb-fsm-dark .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
  background: #1a2540 !important;
  color: #ffffff !important;
}
.hb-fsm-popup.hb-fsm-dark .ant-empty-description {
  color: #aab2c5 !important;
}

.hb-fsm-popup.hb-fsm-light {
  border: 1px solid #e5e7eb !important;
  border-radius: 10px !important;
  box-shadow: 0 10px 30px rgba(15,23,42,0.12) !important;
}

/* ============ Bulk Ticket Modal — Premium ============ */
.hb-btm-wrap .ant-modal-content { background: transparent !important; }
.hb-btm {
  --btm-bg: #0b1020;
  --btm-bg-elev: #11172a;
  --btm-bg-soft: #0d1426;
  --btm-bg-hover: #161e36;
  --btm-bg-row: #11172a;
  --btm-border: #1f2740;
  --btm-border-strong: #2a3354;
  --btm-text: #e8ecf5;
  --btm-text-soft: #aab2c5;
  --btm-text-muted: #6e7793;
  --btm-accent: #5b9bff;
  --btm-accent-2: #7c5cff;
  --btm-success: #3fbf8f;
  --btm-danger: #ff5a4e;

  background: linear-gradient(180deg, var(--btm-bg-elev) 0%, var(--btm-bg) 60%);
  color: var(--btm-text);
  border: 1px solid var(--btm-border);
  border-radius: 18px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  letter-spacing: -0.01em;
  display: flex;
  flex-direction: column;
}
.hb-btm-light .hb-btm {
  --btm-bg: #ffffff;
  --btm-bg-elev: #fafbfc;
  --btm-bg-soft: #f4f6fa;
  --btm-bg-hover: #eef1f6;
  --btm-bg-row: #ffffff;
  --btm-border: #e5e7eb;
  --btm-border-strong: #d1d5db;
  --btm-text: #0f172a;
  --btm-text-soft: #475569;
  --btm-text-muted: #94a3b8;
  --btm-accent: #2563eb;
  --btm-accent-2: #7c5cff;
  background: #ffffff;
}

/* Hero */
.hb-btm-hero {
  position: relative;
  padding: 22px 22px 18px 22px;
  border-bottom: 1px solid var(--btm-border);
  overflow: hidden;
}
.hb-btm-hero-compact { padding-bottom: 14px; }
.hb-btm-hero-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(80% 120% at 100% 0%, color-mix(in oklab, var(--btm-accent) 22%, transparent) 0%, transparent 60%),
    radial-gradient(60% 100% at 0% 100%, color-mix(in oklab, var(--btm-accent-2) 18%, transparent) 0%, transparent 60%);
  opacity: 0.95;
  pointer-events: none;
}
.hb-btm-light .hb-btm-hero-bg { opacity: 0.45; }
.hb-btm-hero-row {
  position: relative;
  display: flex; align-items: flex-start; gap: 14px;
}
.hb-btm-hero-orb {
  width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--btm-accent) 0%, var(--btm-accent-2) 100%);
  color: #ffffff;
  box-shadow: 0 6px 18px color-mix(in oklab, var(--btm-accent) 35%, transparent), 0 0 0 1px rgba(255,255,255,0.15) inset;
  flex-shrink: 0;
}
.hb-btm-hero-text { flex: 1; min-width: 0; }
.hb-btm-eyebrow {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px;
  background: color-mix(in oklab, var(--btm-accent) 18%, transparent);
  color: var(--btm-accent);
  border: 1px solid color-mix(in oklab, var(--btm-accent) 35%, transparent);
  border-radius: 999px;
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  margin-bottom: 8px;
}
.hb-btm-light .hb-btm-eyebrow {
  background: color-mix(in oklab, var(--btm-accent) 12%, white);
}
.hb-btm-title {
  font-size: 19px; font-weight: 600; color: var(--btm-text);
  letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 4px;
}
.hb-btm-sub {
  font-size: 12.5px; color: var(--btm-text-muted); line-height: 1.45;
}
.hb-btm-close {
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent;
  border: 1px solid var(--btm-border);
  border-radius: 8px;
  color: var(--btm-text-soft);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  flex-shrink: 0;
}
.hb-btm-close:hover {
  background: var(--btm-bg-hover); color: var(--btm-text); border-color: var(--btm-border-strong);
}

/* Progress bar in hero */
.hb-btm-progress {
  position: relative;
  margin-top: 14px;
  height: 6px;
  background: color-mix(in oklab, var(--btm-text-muted) 20%, transparent);
  border-radius: 999px;
  overflow: hidden;
}
.hb-btm-progress-bar {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, var(--btm-accent), var(--btm-accent-2));
  border-radius: 999px;
  transition: width 240ms cubic-bezier(.4,0,.2,1);
}
.hb-btm-progress-label {
  position: absolute; right: 0; top: -18px;
  font-size: 10.5px;
  color: var(--btm-text-muted);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

/* ── Mode picker ── */
.hb-btm-modegrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 22px;
}
.hb-btm-modecard {
  text-align: left;
  padding: 18px;
  border-radius: 14px;
  background: var(--btm-bg-soft);
  border: 1px solid var(--btm-border);
  cursor: pointer;
  transition: transform 140ms ease, border-color 140ms ease, background 140ms ease, box-shadow 160ms ease;
  display: flex; flex-direction: column; gap: 10px;
  position: relative;
  overflow: hidden;
}
.hb-btm-light .hb-btm-modecard { background: #ffffff; }
.hb-btm-modecard:hover {
  transform: translateY(-2px);
  border-color: var(--btm-border-strong);
  box-shadow: 0 16px 38px rgba(8,12,24,0.28);
}
.hb-btm-modecard-icon {
  width: 38px; height: 38px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: color-mix(in oklab, var(--btm-accent) 18%, transparent);
  color: var(--btm-accent);
  border: 1px solid color-mix(in oklab, var(--btm-accent) 30%, transparent);
}
.hb-btm-modecard-icon-ai {
  background: linear-gradient(135deg, color-mix(in oklab, var(--btm-accent-2) 30%, transparent), color-mix(in oklab, var(--btm-accent) 30%, transparent));
  color: #fff;
  border-color: color-mix(in oklab, var(--btm-accent-2) 40%, transparent);
}
.hb-btm-modecard-title {
  font-size: 15px; font-weight: 600; color: var(--btm-text);
  display: inline-flex; align-items: center; gap: 8px;
}
.hb-btm-modecard-pill {
  display: inline-flex; align-items: center;
  padding: 1px 7px;
  background: color-mix(in oklab, var(--btm-accent-2) 18%, transparent);
  color: var(--btm-accent-2);
  border: 1px solid color-mix(in oklab, var(--btm-accent-2) 35%, transparent);
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.hb-btm-modecard-sub {
  font-size: 12.5px; color: var(--btm-text-soft); line-height: 1.5;
}
.hb-btm-modecard-list {
  list-style: none; padding: 0; margin: 4px 0 0 0;
  display: flex; flex-direction: column; gap: 4px;
}
.hb-btm-modecard-list li {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--btm-text-muted);
}
.hb-btm-modecard-list svg { color: var(--btm-success); flex-shrink: 0; }
.hb-btm-modecard-cta {
  margin-top: auto;
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12.5px; font-weight: 600; color: var(--btm-accent);
}
.hb-btm-modecard-ai .hb-btm-modecard-cta { color: var(--btm-accent-2); }

/* ── Two-pane workspace ── */
.hb-btm-grid {
  display: grid;
  grid-template-columns: 58% 42%;
  min-height: 540px;
  height: 70vh;
  max-height: 72vh;
}
.hb-btm-pane {
  display: flex; flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.hb-btm-pane-pool { border-right: 1px solid var(--btm-border); }

/* Pool head: search + group-by */
.hb-btm-poolhead {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--btm-border);
  background: var(--btm-bg-elev);
}
.hb-btm-search {
  flex: 1 1 0;
  min-width: 0;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 10px;
  background: var(--btm-bg-soft);
  border: 1px solid var(--btm-border);
  border-radius: 8px;
  color: var(--btm-text-muted);
}
.hb-btm-light .hb-btm-search { background: #ffffff; }
.hb-btm-search:focus-within { border-color: var(--btm-border-strong); }
.hb-btm-search-input {
  flex: 1; min-width: 0;
  background: transparent; border: none; outline: none;
  color: var(--btm-text); font-size: 12.5px;
}
.hb-btm-search-input::placeholder { color: var(--btm-text-muted); }

.hb-btm-groupby {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--btm-bg-soft);
  border: 1px solid var(--btm-border);
  color: var(--btm-text-soft);
}
.hb-btm-light .hb-btm-groupby { background: #ffffff; }
.hb-btm-groupby-select {
  min-width: 168px;
}
.hb-btm-groupby-select .ant-select-selector {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 4px !important;
  color: var(--btm-text) !important;
  font-size: 12px !important;
}
.hb-btm-groupby-select .ant-select-selection-item {
  padding-inline-end: 18px !important;
}
.hb-btm-groupby-select .ant-select-arrow { color: var(--btm-text-muted) !important; }

/* Pool list */
.hb-btm-pool {
  flex: 1; overflow-y: auto;
  padding: 8px;
}
.hb-btm-bucket { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
.hb-btm-bucket-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px;
  font-size: 10.5px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--btm-text-muted);
}
.hb-btm-bucket-toggle {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; border: none; cursor: pointer;
  color: inherit;
  font: inherit; font-weight: 600;
  padding: 0;
}
.hb-btm-bucket-label { color: var(--btm-text-soft); }
.hb-btm-bucket-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; padding: 0 6px;
  background: var(--btm-bg-soft); border: 1px solid var(--btm-border);
  border-radius: 999px;
  font-size: 10px; color: var(--btm-text-muted);
  font-variant-numeric: tabular-nums;
}
.hb-btm-bucket-stageall {
  background: transparent; border: 1px solid var(--btm-border);
  border-radius: 6px;
  padding: 3px 8px;
  color: var(--btm-text-soft);
  font-size: 10.5px; letter-spacing: 0.06em;
  cursor: pointer;
}
.hb-btm-bucket-stageall:hover:not(:disabled) {
  color: var(--btm-text); border-color: var(--btm-border-strong);
  background: var(--btm-bg-hover);
}
.hb-btm-bucket-stageall:disabled { opacity: 0.55; cursor: not-allowed; }

.hb-btm-bugrow {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  text-align: left;
  transition: background 120ms ease, border-color 120ms ease;
  color: var(--btm-text);
}
.hb-btm-bugrow:hover { background: var(--btm-bg-hover); }
.hb-btm-bugrow.active {
  background: color-mix(in oklab, var(--btm-accent) 14%, transparent);
  border-color: color-mix(in oklab, var(--btm-accent) 35%, transparent);
}
.hb-btm-check {
  width: 18px; height: 18px;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1.5px solid var(--btm-border-strong);
  border-radius: 6px;
  color: transparent;
  flex-shrink: 0;
}
.hb-btm-check.checked {
  background: var(--btm-accent);
  border-color: var(--btm-accent);
  color: #ffffff;
}
.hb-btm-bugnum {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  color: var(--btm-text-muted);
  letter-spacing: 0.02em;
  flex-shrink: 0;
}
.hb-btm-bugtitle {
  flex: 1; min-width: 0;
  font-size: 12.5px;
  color: var(--btm-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hb-btm-sev {
  display: inline-flex; align-items: center;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid;
  flex-shrink: 0;
}
.hb-btm-sev-blocker { color: #ff8aa1; background: rgba(255,77,109,0.12); border-color: rgba(255,77,109,0.32); }
.hb-btm-sev-critical { color: #ff8a7d; background: rgba(255,90,78,0.12); border-color: rgba(255,90,78,0.32); }
.hb-btm-sev-major { color: #f9bd6c; background: rgba(245,159,59,0.12); border-color: rgba(245,159,59,0.32); }
.hb-btm-sev-minor { color: #f0d97c; background: rgba(230,200,77,0.12); border-color: rgba(230,200,77,0.32); }

.hb-btm-bugmeta { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
.hb-btm-bugmeta-pill {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 1px 6px;
  background: var(--btm-bg-soft);
  border: 1px solid var(--btm-border);
  border-radius: 6px;
  color: var(--btm-text-muted);
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
}

/* Empty state */
.hb-btm-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px;
  padding: 36px 12px;
  color: var(--btm-text-muted);
  font-size: 12.5px;
}

/* ── Right pane: draft ── */
.hb-btm-pane-draft { background: var(--btm-bg); }
.hb-btm-light .hb-btm-pane-draft { background: var(--btm-bg-soft); }
.hb-btm-drafthead {
  padding: 14px 18px 10px 18px;
  border-bottom: 1px solid var(--btm-border);
}
.hb-btm-drafthead-title {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: var(--btm-text);
  letter-spacing: -0.01em;
}
.hb-btm-drafthead-count {
  display: inline-flex; align-items: center;
  padding: 1px 8px;
  background: color-mix(in oklab, var(--btm-accent) 16%, transparent);
  color: var(--btm-accent);
  border: 1px solid color-mix(in oklab, var(--btm-accent) 30%, transparent);
  border-radius: 999px;
  font-size: 10.5px; font-weight: 600;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}
.hb-btm-drafthead-sub {
  margin-top: 4px;
  font-size: 11.5px; color: var(--btm-text-muted);
}

.hb-btm-draftbody {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 18px;
  display: flex; flex-direction: column; gap: 12px;
}
.hb-btm-row2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.hb-btm-field { display: flex; flex-direction: column; gap: 5px; }
.hb-btm-label {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 600;
  color: var(--btm-text-soft);
  letter-spacing: 0.14em; text-transform: uppercase;
}
.hb-btm-req { color: var(--btm-danger); }
.hb-btm-opt {
  margin-left: auto;
  text-transform: none; letter-spacing: 0;
  color: var(--btm-text-muted); font-weight: 500;
}

.hb-btm-input,
.hb-btm-textarea,
.hb-btm .ant-select-selector {
  width: 100%;
  padding: 8px 11px;
  background: var(--btm-bg-soft) !important;
  border: 1px solid var(--btm-border) !important;
  border-radius: 9px !important;
  color: var(--btm-text) !important;
  font-size: 13px !important;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
  box-shadow: none !important;
  font-family: inherit;
}
.hb-btm-light .hb-btm-input,
.hb-btm-light .hb-btm-textarea,
.hb-btm-light .hb-btm .ant-select-selector { background: #ffffff !important; }
.hb-btm-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
.hb-btm-input:focus,
.hb-btm-textarea:focus,
.hb-btm .ant-select-focused .ant-select-selector {
  border-color: var(--btm-accent) !important;
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--btm-accent) 22%, transparent) !important;
}
.hb-btm .ant-select-selection-item { color: var(--btm-text) !important; }
.hb-btm .ant-select-selection-placeholder { color: var(--btm-text-muted) !important; }
.hb-btm .ant-select-arrow,
.hb-btm .ant-select-clear { color: var(--btm-text-muted) !important; }
.hb-btm .ant-select-clear { background: var(--btm-bg-soft) !important; }
.hb-btm-light .hb-btm .ant-select-clear { background: #ffffff !important; }

/* Staged chips */
.hb-btm-staged { display: flex; flex-direction: column; gap: 6px; }
.hb-btm-staged-label {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 600;
  color: var(--btm-text-soft);
  letter-spacing: 0.14em; text-transform: uppercase;
}
.hb-btm-staged-count {
  display: inline-flex; align-items: center;
  padding: 0 6px;
  background: var(--btm-bg-soft); border: 1px solid var(--btm-border);
  border-radius: 999px;
  font-size: 10px; color: var(--btm-text-muted);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.hb-btm-staged-chips {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.hb-btm-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 6px 3px 8px;
  background: var(--btm-bg-soft);
  border: 1px solid var(--btm-border);
  border-radius: 8px;
  max-width: 100%;
}
.hb-btm-chip-num {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px; color: var(--btm-text-muted);
}
.hb-btm-chip-title {
  font-size: 11.5px; color: var(--btm-text);
  max-width: 180px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hb-btm-chip button {
  background: transparent; border: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--btm-text-muted);
  padding: 2px; border-radius: 4px;
}
.hb-btm-chip button:hover { color: var(--btm-danger); background: var(--btm-bg-hover); }

/* Empty draft state */
.hb-btm-draft-empty {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
}
.hb-btm-draft-empty-orb {
  width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 12px;
  background: color-mix(in oklab, var(--btm-accent) 18%, transparent);
  color: var(--btm-accent);
  border: 1px dashed color-mix(in oklab, var(--btm-accent) 40%, transparent);
}
.hb-btm-draft-empty-title {
  font-size: 14px; font-weight: 600; color: var(--btm-text);
}
.hb-btm-draft-empty-sub {
  font-size: 12px; color: var(--btm-text-muted); max-width: 280px;
  line-height: 1.5;
}

/* Draft footer — fixed within the right pane (does not scroll with body) */
.hb-btm-draftfoot {
  flex: 0 0 auto;
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 12px 18px 16px 18px;
  border-top: 1px solid var(--btm-border);
  background: var(--btm-bg-elev);
  box-shadow: 0 -8px 18px -12px rgba(8,12,24,0.45);
}
.hb-btm-light .hb-btm-draftfoot { background: #ffffff; box-shadow: 0 -6px 16px -12px rgba(15,23,42,0.12); }

/* Inline hint shown next to a Field label */
.hb-btm-hint {
  margin-left: auto;
  text-transform: none; letter-spacing: 0; font-weight: 500;
  color: var(--btm-text-muted);
  font-size: 10.5px;
}

/* Buttons */
.hb-btm-secondary,
.hb-btm-primary,
.hb-btm-split {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 120ms ease, box-shadow 160ms ease, background 120ms ease, border-color 120ms ease, color 120ms ease;
}
.hb-btm-split {
  background: var(--btm-bg-soft);
  color: var(--btm-text);
  border-color: var(--btm-border-strong);
}
.hb-btm-light .hb-btm-split { background: #ffffff; }
.hb-btm-split:hover:not(:disabled) {
  background: color-mix(in oklab, var(--btm-accent-2) 14%, var(--btm-bg-soft));
  border-color: color-mix(in oklab, var(--btm-accent-2) 45%, transparent);
  color: var(--btm-accent-2);
}
.hb-btm-split:disabled { opacity: 0.55; cursor: not-allowed; }
.hb-btm-secondary {
  background: transparent;
  color: var(--btm-text-soft);
  border-color: var(--btm-border);
}
.hb-btm-secondary:hover:not(:disabled) {
  background: var(--btm-bg-hover); color: var(--btm-text); border-color: var(--btm-border-strong);
}
.hb-btm-primary {
  color: #ffffff;
  background: linear-gradient(135deg, var(--btm-accent) 0%, var(--btm-accent-2) 100%);
  box-shadow:
    0 8px 22px color-mix(in oklab, var(--btm-accent) 35%, transparent),
    0 0 0 1px rgba(255,255,255,0.12) inset;
}
.hb-btm-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 12px 26px color-mix(in oklab, var(--btm-accent) 45%, transparent),
    0 0 0 1px rgba(255,255,255,0.18) inset;
}
.hb-btm-primary:disabled,
.hb-btm-secondary:disabled { opacity: 0.55; cursor: not-allowed; }
.hb-btm-primary-count {
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
  font-weight: 500;
  margin-left: 2px;
}

.hb-btm-spin { animation: hbBtmSpin 1.2s linear infinite; }
@keyframes hbBtmSpin { to { transform: rotate(360deg); } }

/* Footer (mode picker) */
.hb-btm-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 14px 22px 18px 22px;
  border-top: 1px solid var(--btm-border);
}

/* Done state */
.hb-btm-done {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px;
  padding: 48px 20px;
  text-align: center;
}
.hb-btm-done-orb {
  width: 56px; height: 56px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--btm-success), color-mix(in oklab, var(--btm-success) 60%, var(--btm-accent)));
  color: #ffffff;
  box-shadow: 0 8px 22px color-mix(in oklab, var(--btm-success) 35%, transparent);
}
.hb-btm-done-title {
  font-size: 18px; font-weight: 600; color: var(--btm-text);
  letter-spacing: -0.02em;
}
.hb-btm-done-sub {
  font-size: 12.5px; color: var(--btm-text-muted);
  max-width: 360px;
}

/* Antd select dropdown popup (rendered as separate portal) */
.hb-btm-popup.hb-btm-dark {
  background: #11172a !important;
  border: 1px solid #1f2740 !important;
  border-radius: 10px !important;
  box-shadow: 0 12px 30px rgba(0,0,0,0.45) !important;
}
.hb-btm-popup.hb-btm-dark .ant-select-item { color: #e8ecf5; }
.hb-btm-popup.hb-btm-dark .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
  background: #161e36 !important;
}
.hb-btm-popup.hb-btm-dark .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
  background: #1a2540 !important;
  color: #ffffff !important;
}
.hb-btm-popup.hb-btm-light {
  border: 1px solid #e5e7eb !important;
  border-radius: 10px !important;
  box-shadow: 0 10px 30px rgba(15,23,42,0.12) !important;
}

/* ============================================================
   Responsive
   ============================================================ */

/* Compact laptops — tighten chrome but keep the desktop layout */
@media (max-width: 1280px) {
  .hb-root { padding-left: 8px; gap: 8px; }
  .hb-sidebar { width: 220px; }
  .hb-search { width: 240px; }
  .hb-header { padding: 12px 12px 10px; gap: 12px; }
  .hb-stats-row,
  .hb-filterbar,
  .hb-quickadd,
  .hb-bulkbar { margin-left: 12px; margin-right: 12px; }
  .hb-content { padding: 10px 12px 12px; }
}

/* Tablet landscape — wrap header tools, narrow sidebar, 2-col stats */
@media (max-width: 1024px) {
  .hb-sidebar { width: 200px; }
  .hb-header {
    flex-wrap: wrap;
    align-items: flex-start;
  }
  .hb-header-tools {
    flex-wrap: wrap;
    width: 100%;
  }
  .hb-search { flex: 1 1 220px; width: auto; min-width: 0; }
  .hb-stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hb-filterbar :where(.ant-select) {
    flex: 0 1 160px;
    width: auto !important;
    min-width: 0;
  }
  /* AI review wizard */
  .hb-aim-twocol { grid-template-columns: 1fr; }
  .hb-aim-checklist { grid-template-columns: 1fr; }
  /* Capture drawer */
  .hb-cbd-attachments { grid-template-columns: repeat(2, 1fr); }
}

/* Tablet portrait — stack sidebar above content; selects fluid */
@media (max-width: 768px) {
  .hb-root {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 64px);
    padding-left: 0;
    padding: 8px;
    gap: 8px;
  }
  .hb-sidebar {
    width: 100%;
    max-height: 240px;
    border-right: none;
    border-bottom: 1px solid var(--hb-border);
    border-radius: 10px;
  }
  .hb-section-grow { max-height: 160px; }
  .hb-pulse { display: none; }
  .hb-main { flex: 1 1 auto; overflow: hidden; }
  .hb-content { overflow: hidden; padding: 8px 10px 12px; }
  .hb-header {
    padding: 10px 12px;
    gap: 10px;
  }
  .hb-bc-strong { font-size: 16px; }
  .hb-bc-soft { font-size: 13px; }
  .hb-bc-count {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    width: 100%;
  }
  .hb-search .hb-kbd { display: none; }
  .hb-stats-row,
  .hb-filterbar,
  .hb-quickadd,
  .hb-bulkbar,
  .hb-pagination { margin-left: 10px; margin-right: 10px; }
  .hb-stats-row { gap: 8px; }
  .hb-stat-card { padding: 8px 10px; min-height: 48px; }
  .hb-stat-value { font-size: 16px; }
  .hb-filterbar { padding: 8px; gap: 6px; }
  .hb-filterbar-divider { display: none; }
  .hb-filterbar :where(.ant-select) {
    flex: 1 1 calc(50% - 6px);
    width: auto !important;
    min-width: 0;
  }
  .hb-filter-reset { flex: 1 1 100%; justify-content: center; }
  .hb-filterbar-spacer { display: none; }
  .hb-filterbar-close { position: absolute; top: 6px; right: 6px; }
  .hb-bulkbar { flex-direction: column; align-items: stretch; gap: 8px; }
  .hb-bulkbar-actions { flex-wrap: wrap; }
  /* Prevent horizontal scroll - make table responsive */
  .hb-table-wrapper { overflow-x: hidden; }
  .hb-table { width: 100%; min-width: 0; }
  .hb-table thead th { padding: 8px 6px; font-size: 11px; }
  .hb-table tbody td { padding: 10px 6px; font-size: 12px; }
  .hb-pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .hb-pagination-controls {
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  /* Modals — fill screen */
  .hb-aimodal .ant-modal {
    max-width: calc(100vw - 16px) !important;
    margin: 8px auto !important;
    top: 8px !important;
    padding-bottom: 0 !important;
  }
  .hb-aim-header { padding: 16px 16px 14px; }
  .hb-aim-stepper { padding: 10px 12px; gap: 4px; flex-wrap: wrap; }
  .hb-aim-step-rail { display: none; }
  .hb-aim-body { padding: 16px; max-height: 55vh; }
  .hb-aim-footer { padding: 12px 16px; flex-wrap: wrap; }
  /* Capture drawer fills screen */
  .hb-cbd .ant-drawer-content-wrapper { width: 100% !important; }
  .hb-cbd-header { padding: 16px 16px 14px; }
  .hb-cbd-body { padding: 14px 16px 18px; gap: 14px; }
  .hb-cbd-row { flex-direction: column; gap: 10px; }
  .hb-cbd-attachments { grid-template-columns: repeat(2, 1fr); }
  /* Bulk ticket modal */
  .hb-btm-footer { padding: 12px 16px; flex-wrap: wrap; }
}

/* Mobile — single column, dense */
@media (max-width: 480px) {
  .hb-root { padding: 6px; gap: 6px; }
  .hb-sidebar { max-height: 200px; }
  .hb-brand { padding: 10px 12px; }
  .hb-header { padding: 8px 10px; gap: 8px; }
  .hb-bc-strong { font-size: 15px; }
  .hb-header-tools .hb-segmented button span,
  .hb-segmented button { padding: 4px 8px; font-size: 11px; }
  .hb-filter-toggle span:not(.hb-filter-badge) { display: none; }
  .hb-stats-row {
    grid-template-columns: 1fr;
    margin: 8px;
  }
  .hb-filterbar,
  .hb-quickadd,
  .hb-bulkbar,
  .hb-pagination { margin-left: 8px; margin-right: 8px; }
  .hb-filterbar :where(.ant-select) { flex: 1 1 100%; }
  .hb-content { padding: 6px 8px 10px; }
  .hb-bug-title { max-width: 220px; }
  .hb-meta-name { max-width: 100px; }
  .hb-pagination-info,
  .hb-pagination-pager { font-size: 11.5px; }
  .hb-cbd-attachments { grid-template-columns: 1fr; }
  .hb-aim-title,
  .hb-cbd-headtitle { font-size: 16px; }
}
`;
