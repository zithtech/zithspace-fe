// Scoped styles for the Hivebug bug-list page. Variables flip between dark/light
// via .hb-dark / .hb-light classes on .hb-root. Kept page-local so we don't
// touch the global theme.
export const hivebugStyles = `
.hb-root {
  --hb-bg: #0B0F1A;
  --hb-bg-elev: #0B0F1A;
  --hb-bg-soft: #161B22;
  --hb-bg-hover: #1F2937;
  --hb-bg-active: rgba(59, 130, 246, 0.15);
  --hb-border: #1F2937;
  --hb-border-strong: #1F2937;
  --hb-text: #F1F5F9;
  --hb-text-soft: #94A3B8;
  --hb-text-muted: #64748B;
  --hb-accent: #3b82f6;
  --hb-accent-fg: #ffffff;
  --hb-danger: #ef4444;
  --hb-success: #10b981;
  --hb-warning: #f59e0b;
  --hb-bg-elev-rgb: 11, 15, 26;
  --hb-accent-rgb: 59, 130, 246;

  display: flex;
  height: 100%;
  background: var(--hb-bg);
  color: var(--hb-text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  font-size: 13px;
  letter-spacing: -0.01em;
  padding-left: 0;
  gap: 0;
  overflow: hidden;
  width: 100%;
  max-width: 100vw;
  min-width: 0;
  box-sizing: border-box;
}

/* Fix for browser autofill white background in dark mode */
.hb-root input:-webkit-autofill,
.hb-root textarea:-webkit-autofill,
.hb-root select:-webkit-autofill,
.hb-cbd-dark input:-webkit-autofill,
.hb-cbd-dark textarea:-webkit-autofill,
.hb-cbd-dark select:-webkit-autofill,
.hb-aimodal-dark input:-webkit-autofill,
.hb-aimodal-dark textarea:-webkit-autofill,
.hb-aimodal-dark select:-webkit-autofill,
.hb-fsm-dark input:-webkit-autofill,
.hb-fsm-dark textarea:-webkit-autofill,
.hb-fsm-dark select:-webkit-autofill {
  -webkit-box-shadow: 0 0 0px 1000px var(--hb-bg-soft) inset !important;
  -webkit-text-fill-color: var(--hb-text) !important;
  transition: background-color 5000s ease-in-out 0s;
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
.hb-light .hb-brand-icon { color: #111827; }
.hb-light .hb-btn-primary {
  background: var(--hb-accent);
  color: #ffffff;
  border-color: var(--hb-accent);
}
.hb-light .hb-btn-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.hb-fsm-dark {
  --hb-accent: #5b9bff;
  --hb-accent-rgb: 91, 155, 255;
}
.hb-fsm-light {
  --hb-accent: #2563eb;
  --hb-accent-rgb: 37, 99, 235;
}
.hb-btm-dark {
  --hb-accent: #5b9bff;
  --hb-accent-rgb: 91, 155, 255;
}
.hb-btm-light {
  --hb-accent: #2563eb;
  --hb-accent-rgb: 37, 99, 235;
}

/* Modal and Drawer primary button overrides for light theme */
.hb-cbd-light .hb-cbd-primary,
.hb-fsm-light .hb-fsm-primary,
.hb-aimodal-light .hb-aim-primary,
.hb-btm-light .hb-btm-primary {
  background: var(--hb-accent) !important;
  color: #ffffff !important;
  border-color: var(--hb-accent) !important;
}
.hb-cbd-light .hb-cbd-primary:hover,
.hb-fsm-light .hb-fsm-primary:hover:not(:disabled),
.hb-aimodal-light .hb-aim-primary:hover,
.hb-btm-light .hb-btm-primary:hover:not(:disabled) {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}

/* ============ Sidebar ============ */
.hb-sidebar-wrap {
  display: flex;
  position: relative;
  height: 100%;
  flex-shrink: 0;
  border-right: 1px solid var(--hb-border);
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.hb-sidebar-collapsed {
  width: 0px !important;
  border-right: none !important;
}
.hb-sidebar {
  width: 100%;
  height: 100%;
  background: var(--hb-bg);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}
.hb-resizer {
  width: 4px;
  cursor: col-resize;
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: all 0.2s;
}
.hb-resizer:hover, .hb-resizer:active {
  background: var(--hb-accent);
  box-shadow: 0 0 8px var(--hb-accent);
}
/* Brand header — vertical column so New Bug btn sits below QA WORKSPACE */
.hb-brand {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  overflow: hidden;
}
/* Top row: icon + text + collapse toggle */
.hb-brand-top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  height: 53px;
  padding: 0 14px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--hb-border);
  box-sizing: border-box;
}
/* Push collapse btn to the far right */
.hb-sidebar-collapse-btn {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--hb-text-muted);
  transition: color 0.15s, background 0.15s;
}
.hb-sidebar-collapse-btn:hover {
  color: var(--hb-text);
  background: var(--hb-bg-hover) !important;
}
/* Collapsed: just show the toggle icon centered */
.hb-sidebar-collapsed .hb-brand {
  padding: 12px 10px;
  align-items: center;
}
.hb-sidebar-collapsed .hb-brand-top {
  justify-content: center;
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}
.hb-sidebar-collapsed .hb-sidebar-new-bug-btn {
  justify-content: center;
}
/* New Bug button in sidebar — full width, centred */
.hb-sidebar-new-bug-btn {
  width: calc(100% - 28px);
  margin: 14px;
  justify-content: center;
  height: 36px !important;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  border-radius: 6px !important;
  background: linear-gradient(135deg, #3980f2 0%, #3980f2 100%) !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: none !important;
}
.hb-sidebar-new-bug-btn:hover {
  background: #2563EB !important;
  color: #ffffff !important;
}
.hb-brand-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: transparent;
  color: var(--hb-text);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hb-brand-name { font-weight: 800; font-size: 15px; line-height: 1.1; letter-spacing: -0.02em; margin: 0; color: var(--hb-text); }
.hb-brand-sub { color: var(--hb-text-muted); font-size: 9px; letter-spacing: 0.14em; margin-top: 4px; font-weight: 600; }

.hb-brand-workspace {
  font-size: 10.5px;
  color: var(--hb-text-muted);
  font-weight: 700;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.hb-project-context {
  padding: 8px 12px;
  border-bottom: 1px solid var(--hb-border);
}
.hb-project-select {
  width: 100%;
}
.hb-project-select :where(.ant-select-selector) {
  padding: 0 !important;
  color: var(--hb-text) !important;
  font-weight: 600 !important;
  font-size: 13px !important;
}
.hb-project-select :where(.ant-select-selection-placeholder) {
  color: var(--hb-text-muted) !important;
}
.hb-project-trigger {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  user-select: none;
}
.hb-project-trigger:hover {
  background: var(--hb-bg-hover);
}
.hb-project-trigger-header {
  display: flex;
  align-items: center;
  gap: 2px;
}
.hb-project-trigger-hint {
  font-size: 9px;
  font-weight: 700;
  color: var(--hb-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.hb-project-hint-arrow {
  color: var(--hb-text-muted);
  opacity: 0.7;
}
.hb-project-trigger-main {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: -1px;
}
.hb-project-trigger-icon {
  color: var(--hb-accent);
  opacity: 0.8;
}
.hb-project-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--hb-text);
  letter-spacing: -0.01em;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hb-project-dropdown-header {
  padding: 8px 12px 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hb-dropdown-title {
  font-size: 11px;
  font-weight: 800;
  color: var(--hb-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.hb-dropdown-count {
  font-size: 10px;
  color: var(--hb-text-muted);
  background: var(--hb-bg-active);
  padding: 1px 6px;
  border-radius: 4px;
}

.hb-project-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.hb-project-dropdown-item:hover {
  background: var(--hb-bg-hover);
  transform: translateX(4px);
}
.hb-project-dropdown-item.hb-selected {
  background: var(--hb-bg-active) !important;
  border: 1px solid var(--hb-accent-soft);
}
.hb-project-dropdown-item.hb-selected .hb-project-label {
  color: var(--hb-accent);
}
.hb-project-code-badge {
  padding: 0 10px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  border-radius: 8px;
  min-width: 42px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.hb-project-info {
  flex: 1;
  min-width: 0;
}
.hb-project-label {
  font-weight: 700;
  font-size: 14px;
  color: var(--hb-text);
  line-height: 1.3;
}
.hb-project-code {
  font-size: 10px;
  color: var(--hb-text-muted);
  font-weight: 600;
  margin-top: 1px;
}
.hb-selected-dot {
  width: 6px;
  height: 6px;
  background: var(--hb-accent);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--hb-accent);
}

/* Empty State */
.hb-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 500px;
  padding: 60px;
  text-align: center;
  color: var(--hb-text-muted);
}
.hb-empty-icon {
  margin-bottom: 32px;
  position: relative;
}
.hb-empty-icon-ring {
  width: 110px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 50%;
  color: var(--hb-accent);
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.3);
  animation: hb-pulse-ring 4s ease-in-out infinite;
}
.hb-folder-ring {
  color: #7aa2f7; /* Folder color */
}
@keyframes hb-pulse-ring {
  0%, 100% { transform: scale(1); box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.3); }
  50% { transform: scale(1.05); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
}
.hb-empty-state h3 {
  color: var(--hb-text);
  font-size: 26px;
  margin-bottom: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.hb-empty-state p {
  font-size: 16px;
  max-width: 400px;
  line-height: 1.6;
  margin-bottom: 40px;
  color: var(--hb-text-soft);
}
.hb-empty-actions {
  display: flex;
  gap: 12px;
}
.hb-btn-lg {
  padding: 12px 32px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  height: auto !important;
  border-radius: 12px !important;
}

.hb-section { padding: 6px 14px 4px; }
.hb-section-grow { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding-bottom: 0; }
.hb-section-title {
  display: flex; align-items: center; justify-content: space-between;
  color: var(--hb-text-muted);
  font-size: 10px; font-weight: 600; letter-spacing: 0.16em;
  padding: 2px 8px 6px;
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
  padding: 5px 10px;
  border-radius: 8px;
  background: transparent; border: none;
  color: var(--hb-text-soft);
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  text-align: left;
  position: relative;
  user-select: none;
}
.hb-row:hover { background: var(--bg-slate-50, var(--hb-bg-hover)); color: var(--text-slate-900, var(--hb-text)); }
.hb-row.active {
  background: var(--bg-blue-50, var(--hb-bg-active)) !important;
  color: var(--text-slate-900, #ffffff) !important;
  font-weight: 600;
}
.hb-row-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hb-row-count {
  color: var(--hb-text-muted);
  font-size: 11.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 18px;
  text-align: right;
  padding: 1px 0;
}
.hb-row.active .hb-row-count {
  color: #3B82F6 !important;
  font-weight: 700;
  background: rgba(59,130,246,0.12) !important;
  border-radius: 6px;
  padding: 1px 7px;
}
.hb-row-action { opacity: 1; }
.hb-row-sub { padding-left: 28px; font-weight: 400; }
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

.hb-sidebar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  padding: 6px 10px;
  margin: 0 8px 12px;
  color: var(--hb-text-muted);
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.hb-sidebar-search:focus-within {
  border-color: var(--hb-border-strong);
  background: var(--hb-bg-hover);
  box-shadow: 0 0 0 2px rgba(var(--hb-accent-rgb), 0.1);
}
.hb-sidebar-search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--hb-text);
  font-size: 12px;
}
.hb-sidebar-search input::placeholder {
  color: var(--hb-text-muted);
  opacity: 0.7;
}
.hb-sidebar-search-clear {
  background: transparent;
  border: none;
  color: var(--hb-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0.6;
}
.hb-sidebar-search-clear:hover {
  opacity: 1;
  color: var(--hb-text);
}

.hb-collections { 
  flex: 1; 
  overflow-y: auto; 
  padding-bottom: 24px;
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
/* Hide scrollbar for Chrome, Safari and Opera */
.hb-collections::-webkit-scrollbar {
  display: none;
}

.hb-collections .hb-row-muted { color: var(--hb-text-soft); }
.hb-collections .hb-row-muted:hover { color: var(--hb-text); }

.hb-section-empty {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

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
  min-height: 0;
  min-width: 0;
  max-width: 100%;
  background: var(--hb-bg);
}

.hb-sidebar-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  color: var(--hb-text-muted);
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  margin-right: 8px;
  flex-shrink: 0;
}
.hb-sidebar-toggle:hover {
  background: var(--hb-bg-hover);
  border-color: var(--hb-border-strong);
  color: var(--hb-text);
}
.hb-sidebar-toggle[aria-pressed='true'] {
  background: var(--hb-bg-active);
  border-color: rgba(var(--hb-accent-rgb), 0.32);
  color: var(--hb-accent);
}
.hb-light .hb-sidebar-toggle {
  background: #ffffff;
  border-color: #e2e8f0;
  color: #64748b;
}
.hb-light .hb-sidebar-toggle:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}
.hb-light .hb-sidebar-toggle[aria-pressed='true'] {
  background: rgba(59, 130, 246, 0.10);
  border-color: rgba(59, 130, 246, 0.32);
  color: #3b82f6;
}

.hb-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 14px;
  height: 53px;
  box-sizing: border-box;
  gap: 16px;
  border-bottom: 1px solid var(--hb-border);
  min-width: 0;
  max-width: 100%;
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--hb-bg);
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
  background: var(--hb-bg);
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
  background: var(--hb-bg);
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
  margin: 10px 14px 0 14px;
  padding: 0;
}
/* Proposal-style stat card: flat, horizontal centered layout */
.hb-stat-card {
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 0;
  padding: 14px 16px;
  min-height: 80px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(15,23,42,0.04);
}
.hb-stat-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.hb-stat-icon {
  width: 26px; height: 26px;
  border-radius: 6px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px;
  background: var(--hb-bg-soft);
  color: var(--hb-text-soft);
  flex-shrink: 0;
  border: none;
}
.hb-stat-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--hb-text-muted);
  line-height: 1.2;
  margin-bottom: 1px;
}
.hb-stat-value-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1;
}
.hb-stat-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--hb-text);
  letter-spacing: -0.015em;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.hb-stat-sep {
  color: var(--hb-text-muted);
  margin: 0 4px;
  font-weight: 400;
}
.hb-stat-detail {
  margin-top: 2px;
  font-size: 10px;
  color: var(--hb-text-muted);
  line-height: 1.3;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hb-stat-detail strong {
  color: var(--hb-text);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.hb-stat-success .hb-stat-detail strong { color: var(--hb-success); }
.hb-stat-danger .hb-stat-detail strong { color: var(--hb-danger); }
.hb-stat-warning .hb-stat-detail strong { color: var(--hb-warning); }
.hb-stat-info .hb-stat-detail strong { color: var(--hb-accent); }
.hb-stat-success .hb-stat-icon { color: var(--hb-success); background: rgba(63,191,143,0.12); }
.hb-stat-success .hb-stat-value { color: var(--hb-success); }
.hb-stat-danger .hb-stat-icon { color: var(--hb-danger); background: rgba(248,113,113,0.12); }
.hb-stat-danger .hb-stat-value { color: var(--hb-danger); }
.hb-stat-warning .hb-stat-icon { color: var(--hb-warning); background: rgba(59,130,246,0.12); }
.hb-stat-warning .hb-stat-value { color: var(--hb-warning); }
.hb-stat-info .hb-stat-icon { color: var(--hb-accent); background: rgba(91,155,255,0.12); }
.hb-stat-info .hb-stat-value { color: var(--hb-accent); }

/* ============ Filter bar ============ */
.hb-filterbar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 4px 14px 2px 14px;
  padding: 8px 12px 6px 12px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 0;
  font-size: 13px;
  position: relative;
  min-width: 0;
  max-width: 100%;
}
/* Top row inside filter bar: badge + reset + close */
.hb-filterbar-toprow {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
}
.hb-filterbar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--hb-border);
}
.hb-filterbar-lead {
  display: inline-flex; align-items: center; gap: 10px;
  color: var(--hb-text);
  font-size: 13px; font-weight: 700; letter-spacing: 0.02em;
}
.hb-filterbar-lead-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px; height: 26px;
  border-radius: 8px;
  background: rgba(var(--hb-accent-rgb), 0.1);
  color: var(--hb-accent);
  border: 1px solid rgba(var(--hb-accent-rgb), 0.2);
}
.hb-filterbar-lead-text {
  font-size: 13px;
  font-weight: 700;
}
.hb-filterbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.hb-filterbar-divider {
  width: 1px; height: 18px;
  background: var(--hb-border-strong);
  margin: 0 4px;
  opacity: 0.6;
}
.hb-filterbar-spacer { flex: 1; min-width: 8px; }
.hb-filterbar-close {
  border-radius: 8px;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  color: var(--hb-text-muted);
  border: 1px solid var(--hb-border);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.hb-filterbar-close:hover {
  background: rgba(255, 90, 78, 0.1);
  color: var(--hb-danger);
  border-color: rgba(255, 90, 78, 0.3);
}
.hb-filter-reset {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  height: 30px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  color: var(--hb-text-soft);
  background: transparent;
  border: 1px dashed var(--hb-border-strong);
  cursor: pointer;
  transition: all 0.15s ease;
}
.hb-filter-reset:hover {
  background: var(--hb-bg-soft);
  color: var(--hb-text);
  border-style: solid;
}

.hb-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  align-items: stretch;
}
.hb-filter-grid .sd-trigger {
  height: 42px !important;
  box-sizing: border-box !important;
  background: var(--hb-bg-pure, var(--hb-bg-elev)) !important;
  border-color: var(--hb-border) !important;
}
.hb-filter-grid .sd-trigger:hover {
  border-color: var(--hb-border-strong) !important;
}

.hb-filter-range {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0px;
  background: var(--hb-bg-pure, var(--hb-bg-elev));
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  padding: 3px 10px;
  height: 42px;
  min-width: 0;
  transition: border-color 0.15s ease, background 0.15s ease;
  box-sizing: border-box;
}
.hb-filter-range:hover {
  border-color: var(--hb-border-strong);
}
.hb-filter-range.is-active {
  border-color: rgba(var(--hb-accent-rgb), 0.45);
  background: rgba(var(--hb-accent-rgb), 0.06);
}
.hb-filter-range-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--hb-text-muted);
  line-height: 1.1;
}
.hb-filter-range .ant-picker {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  width: 100%;
}
.hb-filter-range .ant-picker-input > input {
  font-size: 11.5px !important;
  font-weight: 600 !important;
  color: var(--hb-text) !important;
  -webkit-text-fill-color: var(--hb-text) !important;
}
.hb-filter-range .ant-picker-input > input::placeholder {
  color: var(--hb-text-muted) !important;
  -webkit-text-fill-color: var(--hb-text-muted) !important;
}
.hb-filter-range .ant-picker-suffix,
.hb-filter-range .ant-picker-clear,
.hb-filter-range .ant-picker-separator {
  color: var(--hb-text-muted) !important;
}
/* Ensure selected date text stays visible — override any Ant Design active/focused state resets */
.hb-filter-range .ant-picker-input > input:focus,
.hb-filter-range .ant-picker-input > input:active,
.hb-filter-range .ant-picker-focused .ant-picker-input > input,
.hb-filter-range .ant-picker-range .ant-picker-input > input {
  color: var(--hb-text) !important;
  -webkit-text-fill-color: var(--hb-text) !important;
}
/* Light theme: ensure date text is dark and readable */
.hb-light .hb-filter-range .ant-picker-input > input {
  color: #111827 !important;
  -webkit-text-fill-color: #111827 !important;
}
.hb-light .hb-filter-range .ant-picker-input > input::placeholder {
  color: #9ca3af !important;
  -webkit-text-fill-color: #9ca3af !important;
}
.hb-light .hb-filter-range .ant-picker-suffix,
.hb-light .hb-filter-range .ant-picker-clear,
.hb-light .hb-filter-range .ant-picker-separator {
  color: #9ca3af !important;
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

/* Filter bar above styling */
.hb-filterbar-above {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 14px 3px 12px;
  padding: 0 4px;
}
.hb-filter-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.hb-filter-badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: #ffffff;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  padding: 0 4px;
  min-width: 14px;
  height: 14px;
}
.hb-filterbar-badge {
  position: absolute;
  top: -8px;
  left: -5px;
  background: #3b82f6;
  color: #fff;
  padding: 2.5px 6px;
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 4px 4px 4px 0;
  box-shadow: 0 1.5px 4px rgba(59, 130, 246, 0.35);
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 3.5px;
}
.hb-filterbar-badge::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 5px 5px 0 0;
  border-color: #1d4ed8 transparent transparent transparent;
}
.hb-filter-badge-count-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #3b82f6;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 800;
  line-height: 1;
  padding: 0 3px;
  min-width: 11px;
  height: 11px;
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
  margin: 10px 14px 0 14px;
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
  margin: 10px 14px 0 14px;
  padding: 10px 14px 10px 22px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 0;
  font-size: 13px;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}
.hb-bulkbar-actions { display: flex; gap: 12px; align-items: center; }

/* ── "Move to sheet" picker ── */
.hb-move-trigger {
  height: 32px;
  background: var(--hb-bg-sub);
  white-space: nowrap;
}
.hb-move-trigger .hb-move-trigger-caret {
  margin-left: 2px;
  color: var(--hb-text-muted);
  transition: transform 150ms ease;
}
.hb-move-trigger.is-open {
  background: var(--hb-bg-hover);
  border-color: var(--hb-accent);
  color: var(--hb-text);
}
.hb-move-trigger.is-open .hb-move-trigger-caret { transform: rotate(180deg); }

/* The list itself — roomier rows with folder, bug count and last change.
   The popup is portaled to <body>, outside .hb-root, so it carries its own
   copy of the tokens (light by default, dark via the app's data-theme). */
.hb-move-pop {
  --hb-bg-soft: #f3f4f6;
  --hb-border: #e5e7eb;
  --hb-text: #111827;
  --hb-text-soft: #4b5563;
  --hb-text-muted: #9ca3af;
  --hb-accent: #2563eb;
  --hb-success: #059669;
}
[data-theme='dark'] .hb-move-pop {
  --hb-bg-soft: rgba(255,255,255,0.05);
  --hb-border: #27273a;
  --hb-text: #f1f5f9;
  --hb-text-soft: #cbd5e1;
  --hb-text-muted: #64748b;
  --hb-accent: #60a5fa;
  --hb-success: #34d399;
}
.hb-move-pop .sd-overlay {
  min-width: 330px !important;
  max-width: 420px !important;
  max-height: 440px;
}
.hb-move-pop .sd-list { max-height: 310px; padding: 6px; }
.hb-move-pop .sd-option {
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: 10px;
}
.hb-move-pop .sd-option + .sd-option { margin-top: 2px; }
.hb-move-pop .sd-option-content { gap: 2px; padding-right: 10px; }
.hb-move-pop .sd-option-name { font-size: 13px; }
.hb-move-pop .sd-option-desc {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px;
}
.hb-move-pop .sd-option-desc::before {
  content: "";
  width: 4px; height: 4px; border-radius: 999px;
  background: currentColor;
  opacity: 0.55;
  flex-shrink: 0;
}
.hb-move-pop .sd-option-avatar {
  width: 30px; height: 30px;
  border-radius: 9px !important;
}

.hb-move-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  border-radius: 9px;
  background: color-mix(in oklab, var(--hb-accent) 14%, transparent);
  border: 1px solid color-mix(in oklab, var(--hb-accent) 30%, transparent);
  color: var(--hb-accent);
}
.hb-move-meta {
  display: inline-flex; align-items: center; gap: 6px;
  flex-shrink: 0;
}
.hb-move-count {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  color: var(--hb-text-soft);
  font-size: 11px; font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.hb-move-count svg { opacity: 0.7; }
.hb-move-status {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 9.5px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase;
  border: 1px solid transparent;
}
.hb-move-status.is-current {
  background: color-mix(in oklab, var(--hb-accent) 14%, transparent);
  border-color: color-mix(in oklab, var(--hb-accent) 32%, transparent);
  color: var(--hb-accent);
}
.hb-move-status.is-completed {
  background: color-mix(in oklab, var(--hb-success) 14%, transparent);
  border-color: color-mix(in oklab, var(--hb-success) 32%, transparent);
  color: var(--hb-success);
}
.hb-move-when {
  font-size: 10.5px; font-weight: 500;
  color: var(--hb-text-muted);
  white-space: nowrap;
}

.hb-move-empty {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 26px 18px;
  text-align: center;
  color: var(--hb-text-muted);
}
.hb-move-empty-title { font-size: 12.5px; font-weight: 600; color: var(--hb-text-soft); }
.hb-move-empty-sub { font-size: 11px; }

/* ============ Table ============ */
.hb-content {
  flex: 1;
  display: flex; flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  padding: 6px 14px 8px 14px;
}

.hb-table-wrapper {
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 0;
  overflow: auto;
  overflow-x: auto;
  overflow-y: auto;
  flex: 1;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  position: relative;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hb-table-wrapper::-webkit-scrollbar {
  display: none;
}


/* ── Sticky right-pinned columns (Ticket + Actions) ── */
.hb-table th.hb-col-ticket,
.hb-table td.hb-col-ticket,
.hb-table th.hb-col-actions,
.hb-table td.hb-col-actions {
  position: sticky;
  right: 0;
  z-index: 2;
  background: var(--hb-bg) !important; /* Use app bg so it matches row bg */
}
.hb-table th.hb-col-ticket,
.hb-table td.hb-col-ticket {
  right: 40px;
}
/* keep hover row bg on sticky cells */
.hb-table tbody .hb-tr:hover td.hb-col-ticket,
.hb-table tbody .hb-tr:hover td.hb-col-actions {
  background: var(--hb-bg-soft) !important;
}
/* thead sticky cells need higher z-index so they sit above body stickies */
.hb-table thead th.hb-col-ticket,
.hb-table thead th.hb-col-actions {
  z-index: 3;
  background: #161B22 !important;
}
.hb-light .hb-table thead th.hb-col-ticket,
.hb-light .hb-table thead th.hb-col-actions {
  background: var(--bg-slate-50, #f8fafc) !important;
}

.hb-main .pp-footer {
  margin: 0;
  padding: 0 14px 0 0;
}
.hb-pagination {
  display: flex; align-items: center; justify-content: space-between;
  margin: 3px 14px 4px 14px;
  padding: 4px 10px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 10px;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
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
.hb-table { width: 100%; max-width: 100%; min-width: 1200px; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
.hb-table thead th, .hb-table thead td {
  position: sticky; top: 0; z-index: 1;
  background: #161B22 !important;
  color: #94a3b8 !important;
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid #374151 !important;
  border-radius: 0 !important;
}
.hb-light .hb-table thead th, .hb-light .hb-table thead td {
  background: var(--bg-slate-50, #f8fafc) !important;
  color: var(--text-slate-500, #64748b) !important;
  border-bottom-color: var(--border-slate-200, #e2e8f0) !important;
}
.hb-table tbody td {
  padding: 5px 10px;
  border-bottom: 1px solid var(--hb-border);
  font-size: 12px;
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

/* AntD Checkbox Premium Overrides */
:where(.hb-root) .ant-checkbox-inner {
  border-radius: 5px !important;
  width: 16px !important;
  height: 16px !important;
  border-color: var(--hb-border-strong) !important;
  background: transparent !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:where(.hb-root) .ant-checkbox-checked .ant-checkbox-inner {
  background-color: var(--hb-accent) !important;
  border-color: var(--hb-accent) !important;
}

:where(.hb-root) .ant-checkbox-indeterminate .ant-checkbox-inner::after {
  background-color: var(--hb-accent) !important;
}

:where(.hb-root) .ant-checkbox-wrapper:hover .ant-checkbox-inner,
:where(.hb-root) .ant-checkbox:hover .ant-checkbox-inner {
  border-color: var(--hb-accent) !important;
}

.hb-light :where(.ant-checkbox-inner) {
  border-color: #d1d5db !important;
}
.hb-light :where(.ant-checkbox-checked .ant-checkbox-inner) {
  background-color: var(--hb-accent) !important;
  border-color: var(--hb-accent) !important;
}

.hb-title-cell {
  display: flex; align-items: center; gap: 8px;
  min-width: 0; line-height: 1.25;
}
.hb-title-stack {
  display: flex; flex-direction: column; gap: 2px;
  min-width: 0;
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
  max-width: 320px;
}
.hb-title-indicators {
  display: flex; align-items: center; gap: 4px;
  flex-shrink: 0;
}
.hb-indicator {
  display: flex; align-items: center; justify-content: center;
  width: 18px; height: 18px;
  border-radius: 4px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  color: var(--hb-text-muted);
  transition: all 0.15s ease;
}
.hb-indicator:hover {
  color: var(--hb-text);
  border-color: var(--hb-accent);
  background: var(--hb-bg-hover);
}

.hb-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 7px;
  border: 1px solid;
  border-radius: 8px;
  font-size: 11px; font-weight: 500;
  white-space: nowrap;
  color: var(--pill-fg);
}
.hb-light .hb-pill {
  color: var(--pill-dot);
}
.hb-bug-status-dropdown {
  color: var(--pill-fg);
}
.hb-light .hb-bug-status-dropdown {
  color: var(--pill-dot);
}
.hb-pill-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

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
.hb-ticket-link.is-live { color: var(--hb-success); }
.hb-ticket-link.is-live:hover { color: var(--hb-success); filter: brightness(1.1); }

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
  padding: 8px 0 0 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.trash-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  padding: 3px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 0;
  width: fit-content;
}

.trash-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 0;
  border: none;
  background: transparent;
  color: var(--hb-text-soft);
  font-size: 12px;
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
  border-radius: 0;
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
  padding-bottom: 10px;
}

/* section header */
.arc-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding: 8px 14px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 0;
}
.arc-header-icon {
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 0;
  background: rgba(59,130,246,0.12);
  color: #3b82f6;
  border: 1px solid rgba(59,130,246,0.25);
  flex-shrink: 0;
}
.arc-header-icon-archive {
  background: rgba(34,197,94,0.12);
  color: #22c55e;
  border: 1px solid rgba(34,197,94,0.25);
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
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
@media (max-width: 700px) {
  .arc-grid {
    grid-template-columns: 1fr;
  }
}

/* individual card — mirrors Proposals .pc-card exactly */
.arc-card {
  border: 1px solid var(--border-slate-200);
  border-radius: 0;
  background: var(--bg-pure-white);
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow .15s ease, border-color .15s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "SF Pro Text", sans-serif;
}
.arc-card::before {
  display: none;
}
.arc-card:hover {
  box-shadow: 0 3px 12px rgba(15,23,42,0.06);
  border-color: #cbd5e1;
  background: var(--bg-pure-white);
}
.arc-card-selected {
  border-color: rgba(245,159,59,0.5);
  box-shadow: 0 0 0 2px rgba(245,159,59,0.15);
}
.arc-card-bulk-selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
}
.arc-card-skeleton { cursor: default; }
.arc-card-skeleton:hover { box-shadow: none; border-color: var(--border-slate-200); background: var(--bg-pure-white); }

/* card top section — mirrors .pc-top */
.arc-card-top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  flex: 1;
}

/* avatar — mirrors .pc-avatar */
.arc-card-avatar {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 12px;
}

/* card footer — mirrors .pc-foot */
.arc-card-foot {
  display: flex;
  flex-direction: column;
  padding: 0;
  border-top: 1px solid var(--border-slate-200);
  background: var(--bg-slate-50);
}

/* footer rows — mirrors .pc-foot-row */
.arc-foot-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 5px 10px;
}
.arc-foot-row + .arc-foot-row {
  border-top: 1px solid var(--border-slate-200);
}

/* footer items — mirrors .pc-foot-item */
.arc-foot-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--text-slate-700);
}

/* footer key label — mirrors .pc-foot-key */
.arc-foot-key {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-slate-400);
}

/* footer value — mirrors .pc-foot-val / .pc-client-val */
.arc-foot-val {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-slate-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* vertical divider between footer items — mirrors .pc-foot-div */
.arc-foot-div {
  width: 1px;
  height: 11px;
  background: var(--border-slate-300, #cbd5e1);
}

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
  background: rgba(59,130,246,0.12);
  color: #3b82f6;
  border: 1px solid rgba(59,130,246,0.25);
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
  background: var(--bg-slate-50);
  color: var(--text-slate-500);
  border: 1px solid var(--border-slate-200);
  border-radius: 999px;
  font-size: 10px; font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* card name — mirrors .pc-title */
.arc-card-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-slate-900);
  letter-spacing: -0.01em;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* card description — mirrors .pc-client-line secondary text */
.arc-card-desc {
  font-size: 11.5px;
  color: var(--text-slate-400);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* folder tag — mirrors .pc-client-line */
.arc-card-folder {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px;
  color: var(--text-slate-400);
  font-weight: 600;
  overflow: hidden;
}
.arc-card-folder span {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--text-slate-700);
}

/* divider (legacy, hidden) */
.arc-card-divider {
  display: none;
}

/* legacy footer wrapper (not used in new layout) */
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
  color: var(--text-slate-500);
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
  color: var(--text-slate-400);
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
  border-radius: 0;
  font-size: 11.5px; font-weight: 600;
  border: 1px solid var(--border-slate-200);
  background: var(--bg-pure-white);
  color: var(--text-slate-600);
  cursor: pointer;
  transition: background 100ms ease, color 100ms ease, border-color 100ms ease;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "SF Pro Text", sans-serif;
}
.arc-action-btn:hover { background: var(--bg-slate-50); color: var(--text-slate-900); border-color: #cbd5e1; }
.arc-action-view {
  flex: 1;
  justify-content: center;
  background: var(--bg-slate-50);
  color: var(--text-slate-700);
  border-color: var(--border-slate-200);
}
.arc-action-view:hover { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.arc-action-restore { }
.arc-action-restore:hover { color: #10b981; border-color: rgba(16,185,129,0.4); background: rgba(16,185,129,0.06); }
.arc-action-delete:hover { color: #ef4444; border-color: rgba(239,68,68,0.35); background: rgba(239,68,68,0.06); }

/* empty state */
.arc-empty-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center;
  padding: 36px 24px;
  background: var(--hb-bg-elev);
  border: 1px dashed var(--hb-border);
  border-radius: 10px;
  text-align: center;
  gap: 8px;
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
  background: rgba(59,130,246,0.14);
  color: #3b82f6;
  border: 1px solid rgba(59,130,246,0.3);
  flex-shrink: 0;
}
.hb-archive-banner-text {
  flex: 1;
  min-width: 0;
}
.hb-archive-banner-title {
  font-weight: 600;
  color: #3b82f6;
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
  background: rgba(59,130,246,0.12);
  border: 1px solid rgba(59,130,246,0.3);
  border-radius: 8px;
  color: #3b82f6;
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease;
  white-space: nowrap;
}
.hb-archive-banner-back:hover { background: rgba(59,130,246,0.2); }

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
  --hb-accent: #5b9bff;
  --hb-accent-rgb: 91, 155, 255;
  --hb-success: #3fbf8f;
  --hb-warning: #3b82f6;
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
  --hb-accent: #2563eb;
  --hb-accent-rgb: 37, 99, 235;
  --hb-success: #16a34a;
  --hb-warning: #2563eb;
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
    radial-gradient(120% 80% at 0% 0%, rgba(59,130,246,0.10), transparent 60%),
    radial-gradient(100% 100% at 100% 0%, rgba(16,185,129,0.08), transparent 60%);
  border-bottom: 1px solid var(--hb-border);
}
.hb-aim-titleblock { display: flex; flex-direction: column; gap: 4px; }
.hb-aim-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  align-self: flex-start;
  padding: 3px 10px;
  background: rgba(59,130,246,0.14);
  color: #93C5FD;
  border: 1px solid rgba(59,130,246,0.30);
  border-radius: 999px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.hb-light .hb-aim-eyebrow {
  background: #EFF6FF; color: #2563EB; border-color: #BFDBFE;
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
  background: rgba(59,130,246,0.20);
  border-color: rgba(59,130,246,0.55);
  color: #c8d6ff;
}
.hb-light .hb-aim-step-active .hb-aim-step-icon {
  background: #EFF6FF; color: #2563EB; border-color: #BFDBFE;
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
  background: linear-gradient(135deg, rgba(59,130,246,0.25), rgba(16,185,129,0.25));
  border: 1px solid rgba(59,130,246,0.4);
  display: inline-flex; align-items: center; justify-content: center;
  color: #93C5FD;
}
.hb-light .hb-aim-hero-icon {
  background: linear-gradient(135deg, #EFF6FF, #ECFDF5);
  border-color: #BFDBFE;
  color: #2563EB;
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
  background: rgba(59,130,246,0.10);
  color: #93C5FD;
  border: 1px solid rgba(59,130,246,0.30);
  font-size: 12px;
  align-self: center;
  margin-top: 8px;
}
.hb-light .hb-aim-running {
  background: #EFF6FF; color: #2563EB; border-color: #BFDBFE;
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
  background: rgba(59,130,246,0.10);
  border: 1px solid rgba(59,130,246,0.30);
  border-radius: 8px;
  color: #3b82f6;
}
.hb-light .hb-aim-missing { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
.hb-aim-missing-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
.hb-aim-missing ul { margin: 0; padding-left: 16px; color: var(--hb-text-soft); font-size: 12.5px; }

/* Severity pills (compact) */
.hb-aim-pill {
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.hb-aim-pill-blocker { color: #fca5a5; border-color: rgba(248,113,113,0.6); background: transparent; }
.hb-light .hb-aim-pill-blocker { color: #f87171; }
.hb-aim-pill-critical { color: #fca5a5; border-color: rgba(248,113,113,0.6); background: transparent; }
.hb-light .hb-aim-pill-critical { color: #f87171; }
.hb-aim-pill-major { color: #93c5fd; border-color: rgba(59,130,246,0.6); background: transparent; }
.hb-light .hb-aim-pill-major { color: #3b82f6; }
.hb-aim-pill-minor { color: #d1d5db; border-color: rgba(156,163,175,0.6); background: transparent; }
.hb-light .hb-aim-pill-minor { color: #9ca3af; }

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
  background: rgba(59,130,246,0.18);
  border: 1px solid rgba(59,130,246,0.4);
  color: #c8d6ff;
  font-weight: 600;
  font-size: 12px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hb-light .hb-aim-group-bullet {
  background: #EFF6FF; color: #2563EB; border-color: #BFDBFE;
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
  --hb-accent: #5b9bff;
  --hb-accent-rgb: 91, 155, 255;
  --hb-success: #3fbf8f;
  --hb-warning: #3b82f6;
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
  --hb-accent: #2563eb;
  --hb-accent-rgb: 37, 99, 235;
  --hb-success: #16a34a;
  --hb-warning: #2563eb;
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
  padding: 14px 20px 10px;
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
  margin-bottom: 4px;
}
.hb-cbd-headtitle { font-size: 16px; font-weight: 600; line-height: 1.2; }
.hb-cbd-headsub { color: var(--hb-text-soft); font-size: 12px; margin-top: 3px; }

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
  padding: 14px 20px 16px;
  display: flex; flex-direction: column; gap: 12px;
}

/* Title input — large, borderless */
.hb-cbd-title-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--hb-text);
  font-size: 15px; font-weight: 600;
  letter-spacing: -0.01em;
  padding: 4px 0;
  border-bottom: 1px solid transparent;
  transition: border-color 120ms ease;
}
.hb-cbd-title-input::placeholder { color: var(--hb-text-muted); font-weight: 500; }
.hb-cbd-title-input:focus { border-bottom-color: var(--hb-border); }

/* Field labels */
.hb-cbd-fieldgroup { display: flex; flex-direction: column; gap: 4px; }
.hb-cbd-row { display: flex; gap: 10px; }
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
  border-radius: 0;
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
  padding: 8px 10px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 0;
  color: var(--hb-text);
  font-size: 13px;
  line-height: 1.55;
  outline: none;
  resize: vertical;
  min-height: 70px;
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
  border-radius: 0;
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
  padding: 12px 14px;
  background: var(--hb-bg-soft);
  border: 1px dashed var(--hb-border-strong);
  border-radius: 0;
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
  object-fit: contain;
  display: block;
  background: rgba(0,0,0,0.2);
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
  z-index: 10;
}
.hb-cbd-tile:hover .hb-cbd-tile-remove { opacity: 1; }
.hb-cbd-tile-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(2px);
  z-index: 5;
}
.hb-cbd-tile:hover .hb-cbd-tile-overlay {
  opacity: 1;
}
.hb-cbd-tile-action {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}
.hb-cbd-tile-action:hover {
  background: var(--hb-accent);
  border-color: var(--hb-accent);
  transform: scale(1.1);
}
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
.hb-cbd-tile-rename-field {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border-strong);
  border-radius: 6px;
  padding: 2px 4px;
  margin-top: -2px;
  margin-bottom: -2px;
}
.hb-cbd-tile-rename-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--hb-text);
  font-size: 11px;
  padding: 0;
  font-family: inherit;
}
.hb-cbd-tile-rename-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hb-success);
  color: #fff;
  border: none;
  border-radius: 4px;
  width: 18px;
  height: 18px;
  padding: 0;
  cursor: pointer;
  transition: transform 0.1s;
}
.hb-cbd-tile-rename-btn:hover {
  transform: scale(1.1);
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
  border-radius: 0;
  font-size: 12px;
}

/* ── Ant Design Select overrides inside CreateBugDrawer ── */
/* Selector box (rendered inside the drawer DOM tree) */
.hb-cbd .ant-select .ant-select-selector,
.hb-cbd .ant-select-selector {
  border-radius: 0 !important;
}
/* Dropdown popup (rendered via portal — targeted by popupClassName) */
.hb-cbd-select-popup,
.hb-cbd-select-popup.ant-select-dropdown {
  border-radius: 0 !important;
}
.hb-cbd-select-popup .ant-select-item,
.hb-cbd-select-popup .ant-select-item-option,
.hb-cbd-select-popup .ant-select-item-option-content {
  border-radius: 0 !important;
}

/* ============================================================
   Attachment Preview Drawer (Left Side)
   ============================================================ */
.hb-preview-drawer .ant-drawer-content {
  background: var(--hb-bg) !important;
  box-shadow: 20px 0 50px rgba(0,0,0,0.2);
  border-right: 1px solid var(--hb-border);
}
.hb-preview-drawer-dark {
  --hb-bg: #070a12;
  --hb-bg-elev: #0a0f1c;
  --hb-bg-soft: #0f1524;
  --hb-border: #1a2030;
  --hb-text: #e6e8ee;
  --hb-text-soft: #aab1bd;
  --hb-text-muted: #6f7684;
}
.hb-preview-drawer-light {
  --hb-bg: #ffffff;
  --hb-bg-elev: #fafbfc;
  --hb-bg-soft: #f3f4f6;
  --hb-border: #e5e7eb;
  --hb-text: #111827;
  --hb-text-soft: #4b5563;
  --hb-text-muted: #9ca3af;
}

.hb-preview-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--hb-bg);
  color: var(--hb-text);
}

.hb-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--hb-border);
  background: var(--hb-bg-elev);
}

.hb-preview-fileinfo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.hb-preview-icon {
  color: var(--hb-text-muted);
  flex-shrink: 0;
}

.hb-preview-meta {
  min-width: 0;
}

.hb-preview-filename {
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hb-preview-filesize {
  font-size: 11px;
  color: var(--hb-text-muted);
  margin-top: 2px;
}

.hb-preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hb-preview-btn, .hb-preview-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  color: var(--hb-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.hb-preview-btn:hover, .hb-preview-close:hover {
  background: var(--hb-bg-soft);
  color: var(--hb-text);
  border-color: var(--hb-text-muted);
}

.hb-preview-close:hover {
  color: var(--hb-danger);
  border-color: var(--hb-danger);
}

.hb-preview-body {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--hb-bg-soft);
}

.hb-preview-media-container {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hb-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.hb-preview-video {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.hb-preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  border-radius: 4px;
}

.hb-preview-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--hb-text-muted);
}

.hb-preview-error {
  color: var(--hb-danger);
  font-weight: 500;
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
  padding: 10px 20px;
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
  min-height: 32px !important;
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
  --btm-bg: #0B0F1A;
  --btm-bg-elev: #10151F;
  --btm-bg-soft: #141A26;
  --btm-bg-hover: #1A2231;
  --btm-bg-row: #10151F;
  --btm-border: #1F2937;
  --btm-border-strong: #2C3849;
  --btm-text: #F1F5F9;
  --btm-text-soft: #94A3B8;
  --btm-text-muted: #64748B;
  --btm-accent: #3B82F6;
  --btm-accent-2: #10B981;
  --btm-success: #10B981;
  --btm-danger: #EF4444;

  background: linear-gradient(180deg, var(--btm-bg-elev) 0%, var(--btm-bg) 60%);
  color: var(--btm-text);
  border: 1px solid var(--btm-border);
  border-radius: 20px;
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
  --btm-text: #0F172A;
  --btm-text-soft: #475569;
  --btm-text-muted: #94A3B8;
  --btm-accent: #2563EB;
  --btm-accent-2: #10B981;
  background: #ffffff;
}

/* Hero */
.hb-btm-hero {
  position: relative;
  padding: 14px 18px 12px 18px;
  border-bottom: 1px solid var(--btm-border);
  overflow: hidden;
}
.hb-btm-hero-compact { padding-bottom: 10px; }
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
  display: flex; align-items: center; gap: 12px;
}
.hb-btm-hero-orb {
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--btm-accent) 0%, var(--btm-accent-2) 100%);
  color: #ffffff;
  box-shadow: 0 6px 18px color-mix(in oklab, var(--btm-accent) 35%, transparent), 0 0 0 1px rgba(255,255,255,0.15) inset;
  flex-shrink: 0;
}
.hb-btm-hero-text { flex: 1; min-width: 0; }
.hb-btm-eyebrow {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 7px;
  background: color-mix(in oklab, var(--btm-accent) 18%, transparent);
  color: var(--btm-accent);
  border: 1px solid color-mix(in oklab, var(--btm-accent) 35%, transparent);
  border-radius: 999px;
  font-size: 9.5px; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  margin-bottom: 5px;
}
.hb-btm-light .hb-btm-eyebrow {
  background: color-mix(in oklab, var(--btm-accent) 12%, white);
}
.hb-btm-title {
  font-size: 15.5px; font-weight: 600; color: var(--btm-text);
  letter-spacing: -0.02em; line-height: 1.25; margin-bottom: 2px;
}
.hb-btm-sub {
  font-size: 11.5px; color: var(--btm-text-muted); line-height: 1.4;
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
.hb-aim-flat {
  background: transparent !important;
  max-height: none !important;
}
/* Embedded in the wizard, these sit under the persistent step bar — give that
   row back its height so the popup still fits the viewport. */
.hb-aim-flat .hb-aim-body { max-height: 54vh; }
.hb-btm-flat .hb-btm-grid { height: 64vh; max-height: 66vh; min-height: 460px; }
.hb-btm-flat {
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
}
.hb-btm-back {
  width: 28px; height: 28px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--btm-bg-soft);
  border: 1px solid var(--btm-border);
  border-radius: 8px;
  color: var(--btm-text-soft);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease, transform 120ms ease;
}
.hb-btm-back:hover {
  background: var(--btm-bg-hover); color: var(--btm-text);
  border-color: var(--btm-border-strong);
  transform: translateX(-2px);
}
.hb-aim-back {
  width: 30px; height: 30px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 8px;
  color: var(--hb-text-soft);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease, transform 120ms ease;
}
.hb-aim-back:hover {
  background: var(--hb-bg-hover); color: var(--hb-text);
  border-color: var(--hb-border-strong);
  transform: translateX(-2px);
}
.hb-aim-headactions { display: inline-flex; align-items: center; gap: 8px; }

/* Progress bar in hero */
.hb-btm-progress {
  position: relative;
  margin-top: 10px;
  height: 5px;
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
  grid-template-columns: repeat(3, 1fr);
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
  min-height: 420px;
  height: 60vh;
  max-height: 64vh;
}
.hb-btm-pane {
  display: flex; flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.hb-btm-pane-pool { border-right: 1px solid var(--btm-border); }

/* Pool head: search + group-by */
.hb-btm-poolhead {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 14px;
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
  position: relative;
  display: inline-flex; align-items: center;
  color: var(--btm-text-soft);
}
.hb-btm-groupby-icon {
  position: absolute;
  left: 10px;
  pointer-events: none;
  color: var(--btm-text-muted);
}
/* SearchableDropdown trigger, sized to sit flush with the search field */
.hb-btm-groupby .hb-btm-groupby-sd.sd-trigger {
  height: 33px;
  min-width: 178px;
  width: 178px;
  padding: 0 10px 0 28px;
  border-radius: 8px !important;
  background: var(--btm-bg-soft);
  border: 1px solid var(--btm-border);
  box-shadow: none;
}
.hb-btm-light .hb-btm-groupby .hb-btm-groupby-sd.sd-trigger { background: #ffffff; }
.hb-btm-groupby .hb-btm-groupby-sd.sd-trigger.is-active {
  background: var(--btm-bg-soft);
  border-color: var(--btm-border);
}
.hb-btm-light .hb-btm-groupby .hb-btm-groupby-sd.sd-trigger.is-active { background: #ffffff; }
.hb-btm-groupby .hb-btm-groupby-sd.sd-trigger:hover,
.hb-btm-groupby .hb-btm-groupby-sd.sd-trigger.is-active:hover {
  background: var(--btm-bg-elev);
  border-color: var(--btm-border-strong);
}
.hb-btm-groupby .hb-btm-groupby-sd.sd-trigger.is-open,
.hb-btm-groupby .hb-btm-groupby-sd.sd-trigger.is-active.is-open {
  border-color: var(--btm-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--btm-accent) 18%, transparent);
}
.hb-btm-groupby .hb-btm-groupby-sd.sd-trigger .sd-trigger-value {
  color: var(--btm-text);
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hb-btm-groupby .hb-btm-groupby-sd.sd-trigger .sd-trigger-chevron { color: var(--btm-text-muted); }
.hb-btm-groupby .hb-btm-groupby-sd.sd-trigger .sd-trigger-chevron.is-open { color: var(--btm-accent); }

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
.hb-btm-sev-blocker { color: #fca5a5; background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.32); }
.hb-btm-sev-critical { color: #fca5a5; background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.32); }
.hb-btm-sev-major { color: #93c5fd; background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.32); }
.hb-btm-sev-minor { color: #d1d5db; background: rgba(156,163,175,0.12); border-color: rgba(156,163,175,0.32); }

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
  padding: 11px 16px 9px 16px;
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
  padding: 12px 16px;
  display: flex; flex-direction: column; gap: 10px;
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
  padding: 9px 16px 11px 16px;
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
  padding: 10px 18px 12px 18px;
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

/* ============================================================
   Responsive
   ============================================================ */

/* Compact laptops — tighten chrome but keep the desktop layout */
@media (max-width: 1440px) {
  .hb-root { padding-left: 0; gap: 0; }
  .hb-search { width: 240px; }
  .hb-header { padding: 0 14px; gap: 12px; height: 53px; }
  .hb-header-tools .hb-btn-text { display: none; }  
  .hb-content { padding: 6px 14px 8px 14px; }
}

/* Compact laptops — tighten chrome but keep the desktop layout */
@media (max-width: 1200px) {
  .hb-root { padding-left: 0; gap: 0; }
  .hb-search { width: 240px; }
  .hb-header { padding: 0 14px; gap: 12px; height: 53px; }
  .hb-content { padding: 6px 14px 8px 14px; }
}

/* Tablet landscape — wrap header tools, narrow sidebar, 2-col stats */
@media (max-width: 1024px) {
  .hb-header {
    flex-wrap: wrap;
    align-items: flex-start;
    height: auto;
    min-height: 53px;
    padding-bottom: 8px;
  }
  .hb-header-tools {
    display: flex;
    flex-wrap: wrap;
    flex: 1 1 100%;
    width: 100%;
    justify-content: flex-start;
    gap: 8px;
    padding-top: 4px;
  }
  .hb-search { flex: 1 1 200px; width: auto; max-width: 100%; min-width: 0; }
  .hb-search input { min-width: 0; text-overflow: ellipsis; }
  .hb-viewmode-toggle { margin-left: auto; }
  .hb-header-tools .hb-btn-text { display: none; }
  .hb-filterbar :where(.ant-select) {
    flex: 0 1 160px;
    width: auto !important;
    min-width: 0;
  }
  .hb-stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  /* AI review wizard */
  .hb-aim-twocol { grid-template-columns: 1fr; }
  .hb-aim-checklist { grid-template-columns: 1fr; }
  /* Capture drawer */
  .hb-cbd-attachments { grid-template-columns: repeat(2, 1fr); }
}

/* Tablet portrait and mobile — stacked dense layout */
@media (max-width: 1024px) {
  .hb-root {
    flex-direction: column;
    height: 100%;
    min-height: calc(100vh - 54px);
    padding-left: 0;
    padding: 8px 0;
    gap: 8px;
    overflow: hidden;
  }
  .hb-main { flex: 1 1 auto; }
  .hb-content { overflow: hidden; padding: 8px 10px 12px; }
  .hb-header {
    padding: 10px 12px;
    gap: 10px;
    height: auto;
    min-height: 53px;
  }
  .hb-bc-strong { font-size: 16px; }
  .hb-bc-soft { font-size: 13px; }
  .hb-search .hb-kbd { display: none; }
  .hb-stats-row,
  .hb-filterbar,
  .hb-quickadd,
  .hb-bulkbar,
  .hb-pagination { margin-left: 10px; margin-right: 10px; }
  .hb-stats-row { gap: 6px; }
  .hb-stat-card { padding: 6px 8px; min-height: 44px; gap: 6px; }
  .hb-stat-value { font-size: 14px; }
  .hb-stat-label { font-size: 9px; letter-spacing: 0.05em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .hb-stat-icon { width: 24px; height: 24px; }
  .hb-stat-icon svg { width: 14px; height: 14px; }
  .hb-filterbar { padding: 8px 36px 8px 8px; gap: 8px; }
  .hb-filterbar-divider { display: none; }
  .hb-filter-group {
    flex: 1 1 140px;
  }
  .hb-filter-group.hb-filter-date {
    flex: 1 1 220px;
  }
  .hb-filterbar :where(.ant-select),
  .hb-filterbar :where(.ant-picker) {
    flex: 1;
    width: 100% !important;
    min-width: 0;
  }
  .hb-filter-reset { flex: 1 1 100%; justify-content: center; }
  .hb-filterbar-spacer { display: none; }
  .hb-filterbar-close { position: absolute; top: 6px; right: 6px; }
  .hb-bulkbar { flex-direction: column; align-items: stretch; gap: 8px; }
  .hb-bulkbar-actions { flex-wrap: wrap; }
  /* Allow horizontal scroll - make table responsive */
  .hb-table-wrapper { overflow-x: auto; }
  .hb-table { width: 100%; min-width: 900px; }
  .hb-table thead th { padding: 4px 6px; font-size: 10px; }
  .hb-table tbody td { padding: 6.5px 10px; font-size: 12px; }
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
  .hb-cbd .ant-drawer-content-wrapper,
  .hb-preview-drawer .ant-drawer-content-wrapper { width: 100% !important; }
  .hb-cbd-header { padding: 16px 16px 14px; }
  .hb-cbd-body { padding: 14px 16px 18px; gap: 14px; }
  .hb-cbd-row { flex-direction: column; gap: 10px; }
  .hb-cbd-attachments { grid-template-columns: repeat(2, 1fr); }
  /* Bulk ticket modal */
  .hb-btm-footer { padding: 12px 16px; flex-wrap: wrap; }
}

/* Mobile — single column, dense */
@media (max-width: 480px) {
  .hb-root { padding: 6px 0; gap: 6px; }
  .hb-brand { padding: 14px 14px 12px 18px; }
  .hb-header { padding: 8px 10px; gap: 8px; flex-wrap: wrap; height: auto; min-height: 53px; }
  .hb-header-tools { width: 100%; flex-wrap: wrap; gap: 8px; justify-content: flex-start; }
  .hb-search { flex: 1 1 100%; width: 100%; }
  .hb-bc-strong { font-size: 15px; }
  .hb-header-tools .hb-segmented button span,
  .hb-segmented button { padding: 4px 8px; font-size: 11px; }
  .hb-filter-toggle span:not(.hb-filter-badge) { display: none; }
  .hb-stats-row {
    display: grid;
    grid-template-columns: 1fr;
    margin: 8px;
    gap: 8px;
  }
  .hb-stat-card {
    flex-direction: column;
    justify-content: center;
    padding: 6px 4px;
    gap: 4px;
    text-align: center;
  }
  .hb-stat-icon { display: none; }
  .hb-stat-label { font-size: 8px; white-space: normal; line-height: 1.1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; text-overflow: clip; }
  .hb-stat-value { font-size: 13px; }
  .hb-filterbar,
  .hb-quickadd,
  .hb-bulkbar,
  .hb-pagination { margin-left: 8px; margin-right: 8px; }
  .hb-filter-group, .hb-filter-group.hb-filter-date { flex: 1 1 calc(50% - 8px); }
  .hb-content { padding: 6px 8px 10px; }
  .hb-bug-title { max-width: 220px; }
  .hb-meta-name { max-width: 100px; }
  .hb-pagination-info,
  .hb-pagination-pager { font-size: 11.5px; }
  .hb-cbd-attachments { grid-template-columns: 1fr; }
  .hb-aim-title,
  .hb-cbd-headtitle { font-size: 16px; }
}

/* ============================================================
   View-mode toggle (List / Calendar)
   ============================================================ */
.hb-viewmode-toggle {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border-slate-200, var(--hb-border));
  border-radius: 9px;
  overflow: hidden;
  background: var(--bg-pure-white, var(--hb-bg-elev));
}
.hb-viewmode-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-slate-400, var(--hb-text-muted));
  font-size: 14px;
  transition: background 0.15s ease, color 0.15s ease;
}
.hb-viewmode-btn:hover {
  color: #3B82F6;
}
.hb-viewmode-btn.active {
  background: var(--bg-blue-50, var(--hb-bg-active)) !important;
  color: #3B82F6 !important;
}

/* ============================================================
   Bug Calendar View
   ============================================================ */
.hb-cal {
  --cal-heat-color: var(--hb-accent-rgb);
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  border-radius: 14px;
  overflow: hidden;
  min-height: 0;
  box-shadow: 0 1px 2px rgba(8,12,24,0.20), 0 12px 30px -22px rgba(8,12,24,0.6);
}
.hb-light .hb-cal { box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -24px rgba(15,23,42,0.35); }

/* Toolbar */
.hb-cal-toolbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hb-border);
  background: var(--hb-bg-elev);
  flex-wrap: wrap;
  overflow: hidden;
}
.hb-cal-toolbar-glow {
  position: absolute; inset: 0;
  background:
    radial-gradient(60% 150% at 8% -30%, rgba(var(--hb-accent-rgb), 0.18) 0%, transparent 60%),
    radial-gradient(45% 130% at 96% 130%, rgba(16,185,129,0.10) 0%, transparent 62%);
  pointer-events: none;
}
.hb-light .hb-cal-toolbar-glow { opacity: 0.55; }
.hb-cal-toolbar > *:not(.hb-cal-toolbar-glow) { position: relative; }
.hb-cal-nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;
  min-width: 0;
}
.hb-cal-navrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
/* Second line — starts at the far left, under the nav controls */
.hb-cal-metarow {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
/* Prev / next joined into one control */
.hb-cal-navgroup {
  display: inline-flex;
  align-items: center;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 9px;
  overflow: hidden;
}
.hb-cal-navgroup-sep {
  width: 1px; height: 16px;
  background: var(--hb-border);
  flex-shrink: 0;
}
.hb-cal-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 28px;
  background: transparent;
  border: none;
  color: var(--hb-text-soft);
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease;
}
.hb-cal-nav-btn:hover { background: var(--hb-bg-hover); color: var(--hb-text); }
.hb-cal-today {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0 11px;
  height: 30px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 9px;
  color: var(--hb-text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}
.hb-cal-today:hover:not(:disabled) {
  background: var(--hb-bg-hover);
  border-color: var(--hb-border-strong);
}
.hb-cal-today:disabled {
  opacity: 0.45;
  cursor: default;
}
.hb-cal-today svg { color: var(--hb-accent); }
.hb-cal-month-label {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.hb-cal-month-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--hb-text);
  letter-spacing: -0.02em;
}
.hb-cal-month-year {
  font-size: 13px;
  font-weight: 500;
  color: var(--hb-text-muted);
  font-variant-numeric: tabular-nums;
}
.hb-cal-month-sub {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--hb-text-soft);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.hb-cal-loading {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(var(--hb-accent-rgb), 0.10);
  border: 1px solid rgba(var(--hb-accent-rgb), 0.28);
  font-size: 10px;
  font-weight: 700;
  color: var(--hb-accent);
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.hb-cal-loading-dot {
  width: 5px; height: 5px; border-radius: 999px;
  background: var(--hb-accent);
  animation: hbCalPulse 1.1s ease-in-out infinite;
}
@keyframes hbCalPulse {
  0%, 100% { opacity: 0.35; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* Per-day averages (after month label) */
.hb-cal-avgs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
}
.hb-cal-avg {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--hb-text-soft);
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  line-height: 1;
  cursor: default;
  white-space: nowrap;
}
.hb-cal-avg strong {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--hb-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.hb-cal-avg-unit {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--hb-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.hb-cal-avg.tone-info {
  background: rgba(var(--hb-accent-rgb), 0.08);
  border-color: rgba(var(--hb-accent-rgb), 0.3);
}
.hb-cal-avg.tone-info > svg,
.hb-cal-avg.tone-info strong { color: var(--hb-accent); }
.hb-cal-avg.tone-success {
  background: rgba(63, 191, 143, 0.08);
  border-color: rgba(63, 191, 143, 0.3);
}
.hb-cal-avg.tone-success > svg,
.hb-cal-avg.tone-success strong { color: var(--hb-success); }

/* Toolbar summary */
.hb-cal-summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.hb-cal-summary-stat {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 6px 12px 6px 7px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 11px;
  line-height: 1;
  transition: border-color 150ms ease, transform 150ms ease;
}
.hb-cal-summary-stat:hover { transform: translateY(-1px); }
.hb-cal-summary-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px; height: 26px;
  border-radius: 8px;
  background: var(--hb-bg-elev);
  border: 1px solid var(--hb-border);
  flex-shrink: 0;
}
.hb-cal-summary-text { display: inline-flex; flex-direction: column; gap: 3px; }
.hb-cal-summary-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--hb-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.hb-cal-summary-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--hb-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.hb-cal-summary-stat.tone-info {
  border-color: rgba(var(--hb-accent-rgb), 0.35);
  background: rgba(var(--hb-accent-rgb), 0.08);
}
.hb-cal-summary-stat.tone-info .hb-cal-summary-icon,
.hb-cal-summary-stat.tone-info .hb-cal-summary-value { color: var(--hb-accent); }
.hb-cal-summary-stat.tone-success {
  border-color: rgba(63, 191, 143, 0.35);
  background: rgba(63, 191, 143, 0.08);
}
.hb-cal-summary-stat.tone-success .hb-cal-summary-icon,
.hb-cal-summary-stat.tone-success .hb-cal-summary-value { color: var(--hb-success); }
.hb-cal-summary-stat.tone-warning {
  border-color: rgba(245, 159, 59, 0.35);
  background: rgba(245, 159, 59, 0.08);
}
.hb-cal-summary-stat.tone-warning .hb-cal-summary-icon,
.hb-cal-summary-stat.tone-warning .hb-cal-summary-value { color: var(--hb-warning); }
.hb-cal-summary-stat.tone-accent {
  border-color: rgba(167, 139, 250, 0.4);
  background: rgba(167, 139, 250, 0.1);
}
.hb-cal-summary-stat.tone-accent .hb-cal-summary-icon,
.hb-cal-summary-stat.tone-accent .hb-cal-summary-value { color: #a78bfa; }
.hb-cal-summary-stat.tone-danger {
  border-color: rgba(255, 90, 78, 0.35);
  background: rgba(255, 90, 78, 0.08);
}
.hb-cal-summary-stat.tone-danger .hb-cal-summary-icon,
.hb-cal-summary-stat.tone-danger .hb-cal-summary-value { color: var(--hb-danger); }

.hb-cal-approx {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  color: var(--hb-text-muted);
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  cursor: help;
}

/* Legend: what the colours and the wash mean */
.hb-cal-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 7px 16px;
  border-bottom: 1px solid var(--hb-border);
  background: var(--hb-bg-elev);
}
.hb-cal-legend-title {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--hb-text-muted);
}
.hb-cal-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 550;
  text-transform: capitalize;
  color: var(--hb-text-soft);
}
.hb-cal-legend-item b {
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--hb-text);
  padding: 1px 5px;
  border-radius: 999px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
}
.hb-cal-legend-dot {
  width: 7px; height: 7px; border-radius: 999px;
  box-shadow: 0 0 0 2px var(--hb-bg-soft);
}
.hb-cal-legend-scale {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
}
.hb-cal-legend-scale-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--hb-text-muted);
}
.hb-cal-legend-step {
  width: 14px; height: 8px;
  border-radius: 3px;
  border: 1px solid var(--hb-border);
  background: rgba(var(--hb-accent-rgb), calc(var(--cal-heat, 0) * 0.42));
}

/* Weekday header */
.hb-cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  background: var(--hb-bg-soft);
  border-bottom: 1px solid var(--hb-border);
}
.hb-cal-weekday {
  padding: 9px 8px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--hb-text-muted);
  border-right: 1px solid var(--hb-border);
}
.hb-cal-weekday.is-weekend { color: color-mix(in oklab, var(--hb-text-muted) 65%, transparent); }
.hb-cal-weekday:last-child { border-right: none; }

/* Grid */
.hb-cal-grid {
  display: grid;
  grid-template-rows: repeat(6, minmax(118px, 1fr));
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}
.hb-cal-grid::-webkit-scrollbar { width: 8px; }
.hb-cal-grid::-webkit-scrollbar-thumb {
  background: var(--hb-border-strong);
  border-radius: 999px;
}
.hb-cal-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-bottom: 1px solid var(--hb-border);
}
.hb-cal-row:last-child { border-bottom: none; }

/* Cells */
.hb-cal-cell {
  all: unset;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px 6px;
  min-height: 120px;
  border-right: 1px solid var(--hb-border);
  background: var(--hb-bg-elev);
  cursor: pointer;
  transition: box-shadow 160ms ease, background 160ms ease;
  position: relative;
  text-align: left;
  box-sizing: border-box;
  overflow: hidden;
}
.hb-cal-cell:last-child { border-right: none; }
.hb-cal-cell > *:not(.hb-cal-cell-wash) { position: relative; z-index: 1; }

/* Activity wash — opacity tracks how busy the day was */
.hb-cal-cell-wash {
  position: absolute; inset: 0;
  background: linear-gradient(
    180deg,
    rgba(var(--hb-accent-rgb), calc(var(--cal-heat, 0) * 0.20)) 0%,
    rgba(var(--hb-accent-rgb), calc(var(--cal-heat, 0) * 0.05)) 65%,
    transparent 100%
  );
  pointer-events: none;
  transition: opacity 200ms ease;
}
.hb-cal-cell:hover {
  background: var(--hb-bg-hover);
  box-shadow: inset 0 0 0 1px var(--hb-border-strong);
}
.hb-cal-cell:focus-visible {
  box-shadow: inset 0 0 0 2px rgba(var(--hb-accent-rgb), 0.65);
}
.hb-cal-cell.is-other-month {
  background: var(--hb-bg-soft);
  opacity: 0.55;
}
.hb-cal-cell.is-other-month .hb-cal-cell-date { color: var(--hb-text-muted); }
.hb-cal-cell.is-weekend { background: var(--hb-bg-soft); }
.hb-cal-cell.is-weekend:hover { background: var(--hb-bg-hover); }
.hb-cal-cell.is-selected {
  background: rgba(var(--hb-accent-rgb), 0.07);
  box-shadow:
    inset 0 0 0 1.5px rgba(var(--hb-accent-rgb), 0.62),
    inset 0 12px 26px -18px rgba(var(--hb-accent-rgb), 0.9);
}
.hb-cal-cell.has-activity::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, var(--hb-accent), transparent);
  opacity: calc(0.35 + var(--cal-heat, 0) * 0.55);
}

.hb-cal-cell-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hb-cal-cell-date {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--hb-text);
  font-variant-numeric: tabular-nums;
  transition: background 160ms ease, color 160ms ease;
}
.hb-cal-cell:hover .hb-cal-cell-date { background: var(--hb-bg-soft); }
.hb-cal-cell.is-today .hb-cal-cell-date {
  background: linear-gradient(135deg, var(--hb-accent), #6366f1);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 0 0 3px rgba(var(--hb-accent-rgb), 0.18);
}
/* Running total for the day, parked on the right of the date row */
.hb-cal-cell-total {
  margin-left: auto;
  min-width: 18px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  color: var(--hb-text-soft);
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.hb-cal-cell.is-selected .hb-cal-cell-total {
  border-color: rgba(var(--hb-accent-rgb), 0.45);
  color: var(--hb-accent);
}
.hb-cal-cell-monthtag {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--hb-text-muted);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--hb-border);
}

.hb-cal-cell-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Day metric chips */
.hb-cal-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  border-radius: 7px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--hb-text);
  border: 1px solid var(--hb-border);
  background: var(--hb-bg-soft);
  line-height: 1.4;
  max-width: 100%;
  overflow: hidden;
  transition: transform 140ms ease, filter 140ms ease;
}
.hb-cal-cell:hover .hb-cal-chip { filter: brightness(1.08); }
.hb-cal-chip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hb-cal-chip-count {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-size: 11px;
}
.hb-cal-chip-label {
  font-weight: 500;
  color: var(--hb-text-soft);
  letter-spacing: 0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hb-cal-chip.tone-info {
  background: rgba(var(--hb-accent-rgb), 0.1);
  border-color: rgba(var(--hb-accent-rgb), 0.3);
}
.hb-cal-chip.tone-info .hb-cal-chip-icon,
.hb-cal-chip.tone-info .hb-cal-chip-count { color: var(--hb-accent); }
.hb-cal-chip.tone-success {
  background: rgba(63, 191, 143, 0.1);
  border-color: rgba(63, 191, 143, 0.3);
}
.hb-cal-chip.tone-success .hb-cal-chip-icon,
.hb-cal-chip.tone-success .hb-cal-chip-count { color: var(--hb-success); }
.hb-cal-chip.tone-warning {
  background: rgba(245, 159, 59, 0.1);
  border-color: rgba(245, 159, 59, 0.3);
}
.hb-cal-chip.tone-warning .hb-cal-chip-icon,
.hb-cal-chip.tone-warning .hb-cal-chip-count { color: var(--hb-warning); }
.hb-cal-chip.tone-accent {
  background: rgba(167, 139, 250, 0.1);
  border-color: rgba(167, 139, 250, 0.35);
}
.hb-cal-chip.tone-accent .hb-cal-chip-icon,
.hb-cal-chip.tone-accent .hb-cal-chip-count { color: #a78bfa; }

/* Severity strip */
.hb-cal-cell-strip {
  display: flex;
  gap: 1px;
  height: 4px;
  border-radius: 999px;
  overflow: hidden;
  margin-top: auto;
  background: var(--hb-bg-soft);
  box-shadow: inset 0 0 0 1px var(--hb-border);
}
.hb-cal-cell-strip-seg {
  display: block;
  height: 100%;
  opacity: 0.9;
  transition: opacity 140ms ease;
}
.hb-cal-cell:hover .hb-cal-cell-strip-seg { opacity: 1; }

/* Drawer */
.hb-cal-drawer-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hb-cal-drawer-day {
  font-size: 12px;
  font-weight: 600;
  color: var(--hb-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.hb-cal-drawer-date {
  font-size: 16px;
  font-weight: 700;
  color: var(--hb-text);
}
.hb-cal-drawer-body {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}
.hb-cal-drawer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 24px;
  color: var(--hb-text-muted);
  text-align: center;
  font-size: 13px;
}

.hb-cal-section {
  border-bottom: 1px solid var(--hb-border);
  padding: 12px 18px;
}
.hb-cal-section:last-child { border-bottom: none; }
.hb-cal-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.hb-cal-section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  color: var(--hb-text-soft);
}
.hb-cal-section.tone-info .hb-cal-section-icon { color: var(--hb-accent); border-color: rgba(var(--hb-accent-rgb), 0.35); background: rgba(var(--hb-accent-rgb), 0.1); }
.hb-cal-section.tone-success .hb-cal-section-icon { color: var(--hb-success); border-color: rgba(63, 191, 143, 0.35); background: rgba(63, 191, 143, 0.1); }
.hb-cal-section.tone-warning .hb-cal-section-icon { color: var(--hb-warning); border-color: rgba(245, 159, 59, 0.35); background: rgba(245, 159, 59, 0.1); }
.hb-cal-section.tone-accent .hb-cal-section-icon { color: #a78bfa; border-color: rgba(167, 139, 250, 0.35); background: rgba(167, 139, 250, 0.1); }
.hb-cal-section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--hb-text);
  letter-spacing: 0.02em;
}
.hb-cal-section-count {
  margin-left: auto;
  padding: 2px 8px;
  background: var(--hb-bg-soft);
  border: 1px solid var(--hb-border);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: var(--hb-text);
  font-variant-numeric: tabular-nums;
}
.hb-cal-section-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hb-cal-bug-row {
  all: unset;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: var(--hb-bg-soft);
  cursor: pointer;
  transition: all 0.15s ease;
}
.hb-cal-bug-row:hover {
  background: var(--hb-bg-hover);
  border-color: var(--hb-border-strong);
}
.hb-cal-bug-num {
  font-size: 11px;
  font-weight: 700;
  color: var(--hb-text-muted);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}
.hb-cal-bug-title {
  flex: 1;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--hb-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hb-cal-bug-sev {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

/* Calendar responsive */
@media (max-width: 1280px) {
  .hb-cal-avg-unit { display: none; }
}
@media (max-width: 1024px) {
  .hb-cal-summary-label { display: none; }
  .hb-cal-summary-text { gap: 0; }
  .hb-cal-grid { grid-template-rows: repeat(6, minmax(100px, 1fr)); }
  .hb-cal-chip-label { display: none; }
  .hb-cal-legend-scale { display: none; }
}
@media (max-width: 768px) {
  .hb-cal-toolbar { padding: 10px 12px; gap: 10px; }
  .hb-cal-month-name { font-size: 15px; }
  .hb-cal-month-sub { display: none; }
  .hb-cal-grid { grid-template-rows: repeat(6, minmax(76px, 1fr)); }
  .hb-cal-cell { padding: 6px; min-height: 76px; }
  .hb-cal-cell-strip { display: none; }
  .hb-cal-cell-total { display: none; }
  .hb-cal-legend { display: none; }
}

/* Custom pp-footer & pp-pager overrides for Bug List to match Accounts Dashboard style */
.hb-root .pp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 20px;
  border-top: 1px solid var(--hb-border);
  box-sizing: border-box;
}
.hb-root .pp-footer--sticky {
  position: sticky;
  bottom: 0;
  z-index: 30;
  margin: 0;
  background: var(--hb-bg);
  box-shadow: none;
  height: 53px;
  border-top: 1px solid var(--hb-border);
  box-sizing: border-box;
}
.hb-root .pp-footer-info {
  font-size: 12.5px;
  color: var(--hb-text-soft);
}
.hb-root .pp-footer-info strong {
  color: var(--hb-text);
  font-weight: 700;
}
.hb-root .pp-pager {
  display: flex;
  align-items: center;
  gap: 3px;
}
.hb-root .pp-pager-btn, .hb-root .pp-pager-num {
  min-width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--hb-border);
  background: var(--hb-bg);
  color: var(--hb-text-soft);
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ease;
}
.hb-root .pp-pager-btn:hover:not(:disabled), .hb-root .pp-pager-num:hover:not(:disabled) {
  background: var(--hb-bg-hover);
  color: var(--hb-text);
  border-color: var(--hb-border-strong);
}
.hb-root .pp-pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hb-root .pp-pager-num.is-active {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
}
.hb-root .pp-pagesize {
  margin-left: 5px;
}
.hb-root .pp-pagesize .ant-select-selector {
  border-radius: 7px !important;
  height: 28px !important;
  background: var(--hb-bg-soft) !important;
  border-color: var(--hb-border) !important;
  color: var(--hb-text) !important;
  transition: border-color 0.1s !important;
}
.hb-root .pp-pagesize .ant-select-selector:hover {
  border-color: var(--hb-border-strong) !important;
}
.hb-root .pp-pagesize .ant-select-selection-item {
  line-height: 26px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: var(--hb-text) !important;
}

/* Mapping Tickets custom selection styles */
.hb-btm-ticket-item {
  border: 1px solid var(--btm-border);
  background: var(--btm-bg-row);
  color: var(--btm-text);
  outline: none;
}
.hb-btm-ticket-item:hover {
  background: var(--btm-bg-hover) !important;
  border-color: var(--btm-border-strong) !important;
}
.hb-btm-ticket-item.active {
  background: var(--btm-bg-hover) !important;
  border-color: var(--btm-accent) !important;
  box-shadow: 0 0 0 1px var(--btm-accent);
}

/* Premium Tooltip UI */
.ant-tooltip .ant-tooltip-inner {
  background: rgba(20, 24, 30, 0.75) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25) !important;
  border-radius: 8px !important;
  padding: 6px 14px !important;
  color: rgba(255, 255, 255, 0.95) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}

[data-theme='light'] .ant-tooltip .ant-tooltip-inner {
  background: rgba(255, 255, 255, 0.75) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
  color: #334155 !important;
}

.ant-tooltip .ant-tooltip-arrow {
  display: none !important;
}

/* ── Collection hover card (sidebar) ──
   Portaled to <body>, so it carries its own tokens and theme switch. */
.hb-cardtip { max-width: none !important; }
.hb-cardtip.ant-tooltip .ant-tooltip-inner {
  padding: 0 !important;
  border-radius: 14px !important;
  background: rgba(13, 17, 26, 0.86) !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  box-shadow:
    0 18px 44px rgba(4, 8, 16, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset !important;
  overflow: hidden;
}
[data-theme='light'] .hb-cardtip.ant-tooltip .ant-tooltip-inner {
  background: rgba(255, 255, 255, 0.92) !important;
  border-color: rgba(15, 23, 42, 0.08) !important;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14) !important;
}

.hb-ctip {
  --ctip-text: #f1f5f9;
  --ctip-soft: #cbd5e1;
  --ctip-muted: #7d8ba1;
  --ctip-line: rgba(255,255,255,0.09);
  --ctip-fill: rgba(255,255,255,0.04);

  position: relative;
  width: 268px;
  padding: 13px 14px 12px;
  color: var(--ctip-text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  font-size: 12px;
  letter-spacing: -0.01em;
  text-align: left;
}
[data-theme='light'] .hb-ctip {
  --ctip-text: #0f172a;
  --ctip-soft: #475569;
  --ctip-muted: #94a3b8;
  --ctip-line: rgba(15,23,42,0.08);
  --ctip-fill: rgba(15,23,42,0.03);
}
.hb-ctip-glow {
  position: absolute; inset: 0;
  background: radial-gradient(120% 90% at 100% 0%,
    color-mix(in oklab, var(--ctip-accent) 26%, transparent) 0%, transparent 62%);
  opacity: 0.55;
  pointer-events: none;
}
[data-theme='light'] .hb-ctip-glow { opacity: 0.3; }

.hb-ctip-head {
  position: relative;
  display: flex; align-items: flex-start; gap: 10px;
}
.hb-ctip-mark {
  width: 30px; height: 30px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: color-mix(in oklab, var(--ctip-accent) 20%, transparent);
  border: 1px solid color-mix(in oklab, var(--ctip-accent) 42%, transparent);
  color: var(--ctip-accent);
}
.hb-ctip-headtext { min-width: 0; flex: 1; }
.hb-ctip-eyebrow {
  display: flex; align-items: center; gap: 6px;
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ctip-muted);
  margin-bottom: 3px;
}
.hb-ctip-pill {
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(16,185,129,0.16);
  border: 1px solid rgba(16,185,129,0.36);
  color: #34d399;
  font-size: 8.5px; letter-spacing: 0.1em;
}
[data-theme='light'] .hb-ctip-pill { color: #059669; }
.hb-ctip-name {
  font-size: 13.5px; font-weight: 650; line-height: 1.3;
  color: var(--ctip-text);
  word-break: break-word;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden;
}
.hb-ctip-desc {
  position: relative;
  margin-top: 8px;
  font-size: 11.5px; line-height: 1.45;
  color: var(--ctip-soft);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

.hb-ctip-stats {
  position: relative;
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 11px;
}
.hb-ctip-stat {
  padding: 7px 8px;
  border-radius: 9px;
  background: var(--ctip-fill);
  border: 1px solid var(--ctip-line);
}
.hb-ctip-stat-value {
  font-size: 15px; font-weight: 650; line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--ctip-text);
}
.hb-ctip-stat-label {
  margin-top: 2px;
  font-size: 9px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--ctip-muted);
}

.hb-ctip-progress {
  position: relative;
  display: flex; align-items: center; gap: 8px;
  margin-top: 10px;
}
.hb-ctip-progress-track {
  flex: 1;
  height: 4px; border-radius: 999px;
  background: var(--ctip-line);
  overflow: hidden;
}
.hb-ctip-progress-fill {
  display: block; height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg,
    color-mix(in oklab, var(--ctip-accent) 70%, transparent), var(--ctip-accent));
  transition: width 240ms cubic-bezier(.4,0,.2,1);
}
.hb-ctip-progress-fill.is-done {
  background: linear-gradient(90deg, rgba(16,185,129,0.7), #10b981);
}
.hb-ctip-progress-label {
  font-size: 10px; font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ctip-muted);
}

.hb-ctip-foot {
  position: relative;
  margin-top: 10px; padding-top: 9px;
  border-top: 1px solid var(--ctip-line);
  font-size: 10.5px; font-weight: 500;
  color: var(--ctip-muted);
}
/* Mirror Leaves dashboard responsiveness */
@media (max-width: 640px) {
  .hb-stats-row {
    grid-template-columns: 1fr;
  }
}
/* Prevent native browser ellipsis from ghosting on buttons */
.hb-table tbody td.hb-col-ticket,
.hb-table tbody td.hb-col-actions {
  text-overflow: clip;
}
`;
