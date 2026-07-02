"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  AppstoreOutlined,
  ProjectOutlined,
  ReloadOutlined,
  ClearOutlined,
  BarsOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";
import SearchableDropdown, { SearchableDropdownOption } from "@/components/common/SearchableDropdown";

const { Text } = Typography;

export interface ProjectFilterOption {
  value: string;
  label: string;
  code?: string;
  count: number;
  color?: string;
}

interface TicketLifecycleShellProps {
  /** Page eyebrow text shown in the sticky header chip. */
  eyebrow: string;
  /** Bold header title. */
  title: string;
  /** Small descriptive line. */
  subtitle?: string;
  /** Icon shown next to the title (24x24 box). */
  icon: React.ReactNode;
  /** Right-side header actions (reload, etc). Optional. */
  headerActions?: React.ReactNode;

  /** All projects, with per-project counts. */
  projects: ProjectFilterOption[];
  /** Currently selected project value, or null for "All". */
  selectedProjectId: string | null;
  onSelectProject: (value: string | null) => void;

  /** Total tickets across all projects (for the "All" row count). */
  totalCount: number;

  /** Optional extra sections appended below the Projects section in the sidebar. */
  sidebarExtras?: React.ReactNode;

  /** Optional clear-filters action shown at the bottom of the sidebar. */
  onClearFilters?: () => void;
  activeFilterCount?: number;

  /** Toolbar slot rendered above the table (search, bulk actions, etc). */
  toolbar?: React.ReactNode;
  /** Table slot rendered in the main column. */
  children: React.ReactNode;
}

export const TicketLifecycleShell: React.FC<TicketLifecycleShellProps> = ({
  eyebrow,
  title,
  subtitle,
  icon,
  headerActions,
  projects,
  selectedProjectId,
  onSelectProject,
  totalCount,
  sidebarExtras,
  onClearFilters,
  activeFilterCount = 0,
  toolbar,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsSidebarOpen(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Project SearchableDropdown options (premium feel + free search even when many projects)
  const projectDropdownOptions: SearchableDropdownOption[] = useMemo(
    () =>
      projects.map((p) => ({
        value: p.value,
        label: p.label,
        description: p.code ? `#${p.code}` : undefined,
        badge: (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              borderRadius: 6,
              background: p.color ? `${p.color}1A` : "var(--bg-slate-50)",
              border: `1px solid ${p.color ? `${p.color}33` : "var(--border-slate-200)"}`,
              color: p.color || "var(--text-slate-600)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "-0.01em",
            }}
          >
            {(p.code || p.label || "?").charAt(0).toUpperCase()}
          </span>
        ),
        meta: (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--text-slate-500)",
              fontVariantNumeric: "tabular-nums",
              background: "var(--bg-slate-50)",
              border: "1px solid var(--border-slate-200)",
              borderRadius: 999,
              padding: "0 7px",
              lineHeight: 1.7,
            }}
          >
            {p.count}
          </span>
        ),
      })),
    [projects]
  );

  return (
    <div className="tlc-page">
      {/* Sticky header — single-row inline with dividers */}
      <div className="tlc-header">
        <button
          type="button"
          className="tlc-toggle-btn"
          onClick={() => setIsSidebarOpen((v) => !v)}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <BarsOutlined style={{ fontSize: 13 }} />
        </button>
        <span className="tlc-header-icon">{icon}</span>
        <span className="tlc-header-eyebrow">{eyebrow}</span>
        <span className="tlc-header-divider" aria-hidden />
        <span className="tlc-header-title">{title}</span>
        {subtitle && (
          <>
            <span className="tlc-header-divider" aria-hidden />
            <span className="tlc-header-sub">{subtitle}</span>
          </>
        )}
        <div className="tlc-header-spacer" />
        {headerActions && (
          <>
            <span className="tlc-header-divider" aria-hidden />
            <div className="tlc-header-actions">{headerActions}</div>
          </>
        )}
      </div>

      {/* Shell */}
      <div className={`tlc-shell-wrap ${isSidebarOpen ? "is-sidebar-open" : "is-sidebar-closed"}`}>
        <div
          className="tlc-sidebar-backdrop"
          aria-hidden
          onClick={() => setIsSidebarOpen(false)}
        />

        <div className="tlc-shell">
          {/* ── Sidebar ───────────────────────────── */}
          <aside className="tlc-sidebar">
            {/* Project picker (SearchableDropdown for fast typeahead) */}
            <div className="tlc-sidebar-section">
              <div className="tlc-sidebar-section-head">
                <span className="tlc-sidebar-icon" style={{ background: 'transparent', border: 'none', color: 'inherit' }}>
                  <ProjectOutlined style={{ fontSize: 10 }} />
                </span>
                <span>Project</span>
              </div>
              <div className="tlc-sidebar-picker">
                <SearchableDropdown
                  value={selectedProjectId || undefined}
                  onChange={(v) => onSelectProject(v ?? null)}
                  options={projectDropdownOptions}
                  placeholder="All projects"
                  triggerLabel="Project"
                  searchPlaceholder="Search projects…"
                  itemNoun="projects"
                  width={290}
                />
              </div>
            </div>

            <div className="tlc-sidebar-divider" />

            {/* Project list */}
            <div className="tlc-sidebar-section">
              <div className="tlc-sidebar-section-head">
                <span className="tlc-sidebar-icon" style={{ background: 'transparent', border: 'none', color: 'inherit' }}>
                  <AppstoreOutlined style={{ fontSize: 10 }} />
                </span>
                <span>Browse</span>
                <span className="tlc-sidebar-section-count">{totalCount}</span>
              </div>
              <div className="tlc-sidebar-list">
                <button
                  type="button"
                  className={`tlc-sidebar-item ${!selectedProjectId ? "active" : ""}`}
                  onClick={() => onSelectProject(null)}
                >
                  <span className="tlc-sidebar-icon tlc-sidebar-icon-all">
                    <AppstoreOutlined style={{ fontSize: 11 }} />
                  </span>
                  <span className="tlc-sidebar-label">All projects</span>
                  <span className="tlc-sidebar-count">{totalCount}</span>
                </button>
                {projects.map((p) => {
                  const active = selectedProjectId === p.value;
                  const initial = (p.code || p.label || "?").charAt(0).toUpperCase();
                  return (
                    <button
                      key={p.value}
                      type="button"
                      className={`tlc-sidebar-item ${active ? "active" : ""}`}
                      onClick={() => onSelectProject(active ? null : p.value)}
                      title={p.label}
                    >
                      <span
                        className="tlc-sidebar-icon"
                        style={{
                          background: p.color ? `${p.color}14` : "var(--bg-slate-50)",
                          borderColor: p.color ? `${p.color}33` : "var(--border-slate-200)",
                          color: p.color || "var(--text-slate-600)",
                        }}
                      >
                        {initial}
                      </span>
                      <span className="tlc-sidebar-label">{p.label}</span>
                      <span className="tlc-sidebar-count">{p.count}</span>
                    </button>
                  );
                })}
                {projects.length === 0 && (
                  <div className="tlc-sidebar-empty">No projects yet</div>
                )}
              </div>
            </div>

            {sidebarExtras && (
              <>
                <div className="tlc-sidebar-divider" />
                {sidebarExtras}
              </>
            )}

            {onClearFilters && activeFilterCount > 0 && (
              <>
                <div className="tlc-sidebar-divider" />
                <button type="button" className="tlc-sidebar-clear" onClick={onClearFilters}>
                  <ClearOutlined style={{ fontSize: 10 }} />
                  Clear filters · {activeFilterCount}
                </button>
              </>
            )}
          </aside>

          {/* ── Main ───────────────────────────── */}
          <main className="tlc-main">
            {toolbar && <div className="tlc-toolbar">{toolbar}</div>}
            <div className="tlc-body">{children}</div>
          </main>
        </div>
      </div>

      <style jsx global>{TICKET_LIFECYCLE_CSS}</style>
    </div>
  );
};

export default TicketLifecycleShell;

const TICKET_LIFECYCLE_CSS = `
.tlc-page {
  margin: 0 -24px;
  background: var(--bg-pure-white);
  min-height: calc(100vh - 54px);
  display: flex;
  flex-direction: column;
}

/* ── Header ───────────────────────────────────────────── */
.tlc-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 24px;
  background: var(--bg-pure-white);
  border-bottom: 1px solid var(--border-slate-200);
  flex-wrap: wrap;
  height: auto;
  min-height: 56px;
}
[data-theme='dark'] .tlc-header {
  background: #0B0F1A !important;
  border-bottom-color: #1F2937 !important;
}
.tlc-toggle-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-pure-white);
  border: 1px solid var(--border-slate-200);
  border-radius: 8px;
  color: var(--text-slate-700);
  cursor: pointer;
  flex-shrink: 0;
}
.tlc-toggle-btn:hover {
  background: var(--bg-slate-50);
  border-color: var(--text-slate-400);
}
[data-theme='dark'] .tlc-toggle-btn {
  background: #111720;
  border-color: #2d3748;
  color: #cbd5e1;
}
.tlc-header-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(59,130,246,0.10);
  border: 1px solid rgba(59,130,246,0.22);
  border-radius: 8px;
  color: #1d4ed8;
  font-size: 16px;
  flex-shrink: 0;
}
[data-theme='dark'] .tlc-header-icon {
  background: rgba(59,130,246,0.18);
  border-color: rgba(59,130,246,0.32);
  color: #93c5fd;
}
.tlc-header-eyebrow {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 800;
  color: var(--text-slate-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
[data-theme='dark'] .tlc-header-eyebrow { color: #94a3b8; }
.tlc-header-title {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--text-slate-900);
  letter-spacing: -0.015em;
  line-height: 1.2;
  white-space: nowrap;
}
[data-theme='dark'] .tlc-header-title { color: #f1f5f9; }
.tlc-header-sub {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-slate-500);
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
[data-theme='dark'] .tlc-header-sub { color: #94a3b8; }
.tlc-header-divider {
  width: 1px;
  height: 20px;
  background: var(--border-slate-200);
  flex-shrink: 0;
}
[data-theme='dark'] .tlc-header-divider { background: #2d3748; }
.tlc-header-spacer { flex: 1 1 auto; min-width: 0; }
.tlc-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Shell ───────────────────────────────────────────── */
.tlc-shell-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.tlc-shell {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr);
  align-items: stretch;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.tlc-sidebar-backdrop { display: none; }

/* ── Sidebar ─────────────────────────────────────────── */
.tlc-sidebar {
  background: var(--bg-slate-50);
  border-right: 1px solid var(--border-slate-200);
  padding: 12px 12px 16px 20px;
  position: sticky;
  top: 56px;
  height: calc(100vh - 54px - 56px);
  overflow-y: auto;
  align-self: start;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.tlc-sidebar::-webkit-scrollbar { width: 0; height: 0; display: none; }
[data-theme='dark'] .tlc-sidebar {
  background: #0B0F1A !important;
  border-right: 1px solid #1F2937 !important;
}

.tlc-sidebar-section { padding: 4px 2px; }
.tlc-sidebar-section-head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 10px 8px;
  font-size: 10px;
  font-weight: 800;
  color: var(--text-slate-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
[data-theme='dark'] .tlc-sidebar-section-head { color: #94A3B8 !important; }
.tlc-sidebar-section-count {
  margin-left: auto;
  background: var(--bg-pure-white);
  border: 1px solid var(--border-slate-200);
  border-radius: 999px;
  padding: 0 6px;
  font-size: 10px;
  color: var(--text-slate-500);
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}
[data-theme='dark'] .tlc-sidebar-section-count {
  background: #161B22 !important;
  border-color: #1F2937 !important;
  color: #94A3B8 !important;
}

.tlc-sidebar-picker { padding: 4px 2px 8px; }
.tlc-sidebar-picker .sd-trigger { width: 100%; }

.tlc-sidebar-list { display: flex; flex-direction: column; gap: 1px; }
.tlc-sidebar-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-slate-700);
  text-align: left;
  width: 100%;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  min-width: 0;
}
.tlc-sidebar-item:hover { background: var(--bg-pure-white); }
[data-theme='dark'] .tlc-sidebar-item { color: #94A3B8 !important; }
[data-theme='dark'] .tlc-sidebar-item:hover { background: #161B22 !important; color: #FFFFFF !important; }
.tlc-sidebar-item.active {
  background: rgba(59,130,246,0.08);
  border-color: rgba(59,130,246,0.2);
  color: #1d4ed8;
}
[data-theme='dark'] .tlc-sidebar-item.active {
  background: rgba(59, 130, 246, 0.15) !important;
  border-color: transparent !important;
  color: #FFFFFF !important;
}
.tlc-sidebar-icon {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  border: none !important;
  background: transparent !important;
}
.tlc-sidebar-icon-all {
  background: transparent !important;
  border: none !important;
  color: var(--text-slate-600);
}
[data-theme='dark'] .tlc-sidebar-icon-all {
  background: transparent !important;
  border: none !important;
  color: #94A3B8 !important;
}
.tlc-sidebar-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.005em;
}
.tlc-sidebar-count {
  flex: 0 0 auto;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-slate-500);
  font-variant-numeric: tabular-nums;
  background: var(--bg-pure-white);
  border-radius: 999px;
  padding: 0 7px;
  line-height: 1.6;
  border: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .tlc-sidebar-count {
  background: #161B22 !important;
  border-color: #1F2937 !important;
  color: #94A3B8 !important;
}
.tlc-sidebar-item.active .tlc-sidebar-count {
  background: rgba(59,130,246,0.12);
  border-color: rgba(59,130,246,0.28);
  color: #1d4ed8;
}
[data-theme='dark'] .tlc-sidebar-item.active .tlc-sidebar-count {
  background: rgba(59, 130, 246, 0.15) !important;
  border-color: rgba(59, 130, 246, 0.3) !important;
  color: #60a5fa !important;
}
.tlc-sidebar-divider {
  height: 1px;
  background: var(--border-slate-200);
  margin: 12px -12px 12px -20px;
}
[data-theme='dark'] .tlc-sidebar-divider { background: #1F2937 !important; }
.tlc-sidebar-empty {
  padding: 8px 4px;
  font-size: 11px;
  color: var(--text-slate-400);
  font-style: italic;
}
.tlc-sidebar-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 30px;
  padding: 0 10px;
  background: transparent;
  border: 1px dashed var(--border-slate-200);
  border-radius: 8px;
  color: var(--text-slate-500);
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.tlc-sidebar-clear:hover {
  color: #1d4ed8;
  border-color: rgba(59,130,246,0.4);
  background: rgba(59,130,246,0.06);
  border-style: solid;
}
[data-theme='dark'] .tlc-sidebar-clear {
  border-color: rgba(239, 68, 68, 0.3) !important;
  color: #ef4444 !important;
}

/* ── Main ───────────────────────────────────────────── */
.tlc-main {
  min-width: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  height: calc(100vh - 54px - 56px);
}
.tlc-toolbar {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--bg-pure-white);
  border-bottom: 1px solid var(--border-slate-200);
  flex-shrink: 0;
}
[data-theme='dark'] .tlc-toolbar {
  background: #0B0F1A !important;
  border-bottom-color: #1F2937 !important;
}
[data-theme='dark'] .tlc-toolbar .ant-input-affix-wrapper {
  background: #0B0F1A !important;
  border-color: #1F2937 !important;
}
[data-theme='dark'] .tlc-toolbar .ant-input {
  background: transparent !important;
  color: #FFFFFF !important;
}
[data-theme='dark'] .tlc-toolbar .ant-input::placeholder {
  color: #94A3B8 !important;
}
.tlc-body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

/* ── Desktop ≥ 1024px ────────────────────────────────── */
@media (min-width: 1024.01px) {
  .tlc-toggle-btn { display: none !important; }
  .tlc-shell-wrap.is-sidebar-closed .tlc-shell {
    grid-template-columns: minmax(0, 1fr);
  }
  .tlc-shell-wrap.is-sidebar-closed > .tlc-shell > aside.tlc-sidebar {
    display: none;
  }
}

/* ── Tablet / Mobile < 1024px ────────────────────────── */
@media (max-width: 1024px) {
  .tlc-toggle-btn { display: inline-flex; }
  .tlc-shell { grid-template-columns: minmax(0, 1fr); }
  .tlc-shell > aside.tlc-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    box-shadow: 4px 0 24px rgba(15, 23, 42, 0.1);
  }
  .tlc-shell-wrap.is-sidebar-open > .tlc-shell > aside.tlc-sidebar {
    transform: translateX(0);
  }
  .tlc-shell-wrap.is-sidebar-open > .tlc-sidebar-backdrop {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(2px);
    z-index: 999;
  }
}
`;
