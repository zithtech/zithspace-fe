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
  // Sidebar drawer state (mobile/tablet)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1100px)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1100px)");
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
                <ProjectOutlined style={{ fontSize: 10 }} />
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
                <AppstoreOutlined style={{ fontSize: 10 }} />
                <span>Browse</span>
                <span className="tlc-sidebar-section-count">{projects.length}</span>
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
  min-height: calc(100vh - 64px);
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
}
[data-theme='dark'] .tlc-header {
  background: #0f1419;
  border-bottom-color: #1f2937;
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
.tlc-shell-wrap { flex: 1; }
.tlc-shell {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr);
  align-items: stretch;
  min-height: calc(100vh - 64px - 60px);
}

.tlc-sidebar-backdrop { display: none; }

/* ── Sidebar ─────────────────────────────────────────── */
.tlc-sidebar {
  background: var(--bg-slate-50);
  border-right: 1px solid var(--border-slate-200);
  padding: 12px 12px 16px 20px;
  position: sticky;
  top: 60px;
  height: calc(100vh - 64px - 60px);
  overflow-y: auto;
  align-self: start;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.tlc-sidebar::-webkit-scrollbar { width: 0; height: 0; display: none; }
[data-theme='dark'] .tlc-sidebar {
  background: #0f1419;
  border-right-color: #1f2937;
}

.tlc-sidebar-section { padding: 4px 2px; }
.tlc-sidebar-section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 4px 8px;
  font-size: 10px;
  font-weight: 800;
  color: var(--text-slate-500);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
[data-theme='dark'] .tlc-sidebar-section-head { color: #94a3b8; }
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
  background: #111720;
  border-color: #2d3748;
  color: #94a3b8;
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
[data-theme='dark'] .tlc-sidebar-item { color: #cbd5e1; }
[data-theme='dark'] .tlc-sidebar-item:hover { background: #111720; }
.tlc-sidebar-item.active {
  background: rgba(59,130,246,0.08);
  border-color: rgba(59,130,246,0.2);
  color: #1d4ed8;
}
[data-theme='dark'] .tlc-sidebar-item.active {
  background: rgba(59,130,246,0.16);
  border-color: rgba(59,130,246,0.32);
  color: #93c5fd;
}
.tlc-sidebar-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}
.tlc-sidebar-icon-all {
  background: var(--bg-pure-white);
  border-color: var(--border-slate-200);
  color: var(--text-slate-600);
}
[data-theme='dark'] .tlc-sidebar-icon-all {
  background: #111720;
  border-color: #2d3748;
  color: #94a3b8;
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
  background: #111720;
  border-color: #2d3748;
  color: #94a3b8;
}
.tlc-sidebar-item.active .tlc-sidebar-count {
  background: rgba(59,130,246,0.12);
  border-color: rgba(59,130,246,0.28);
  color: #1d4ed8;
}
[data-theme='dark'] .tlc-sidebar-item.active .tlc-sidebar-count {
  background: rgba(59,130,246,0.22);
  border-color: rgba(59,130,246,0.4);
  color: #93c5fd;
}
.tlc-sidebar-divider {
  height: 1px;
  background: var(--border-slate-200);
  margin: 12px -12px 12px -20px;
}
[data-theme='dark'] .tlc-sidebar-divider { background: #2d3748; }
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

/* ── Main ───────────────────────────────────────────── */
.tlc-main {
  min-width: 0;
  padding: 0 16px 24px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tlc-toolbar {
  position: sticky;
  top: 60px;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--bg-pure-white);
  border-bottom: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .tlc-toolbar {
  background: #0f1419;
  border-bottom-color: #1f2937;
}
.tlc-body {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Desktop ≥ 1100px ────────────────────────────────── */
@media (min-width: 1100px) {
  .tlc-toggle-btn { display: none !important; }
  .tlc-shell-wrap.is-sidebar-closed .tlc-shell {
    grid-template-columns: minmax(0, 1fr);
  }
  .tlc-shell-wrap.is-sidebar-closed > .tlc-shell > aside.tlc-sidebar {
    display: none;
  }
}

/* ── Tablet / Mobile < 1100px ────────────────────────── */
@media (max-width: 1099.98px) {
  .tlc-toggle-btn { display: inline-flex; }
  .tlc-shell { grid-template-columns: minmax(0, 1fr); }
  .tlc-shell > aside.tlc-sidebar {
    position: fixed;
    top: 60px;
    left: 0;
    width: 280px;
    height: calc(100vh - 64px - 60px);
    z-index: 60;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    box-shadow: 1px 0 0 var(--border-slate-200);
  }
  .tlc-shell-wrap.is-sidebar-open > .tlc-shell > aside.tlc-sidebar {
    transform: translateX(0);
  }
  .tlc-shell-wrap.is-sidebar-open > .tlc-sidebar-backdrop {
    display: block;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.35);
    z-index: 55;
  }
}
`;
