"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dropdown } from "antd";
import { ArrowRight, Briefcase, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { ProjectService } from "@/services/projectService";
import { useAuth } from "@/context/AuthContext";

/**
 * Project scoping for the QA Space lists — Scope, Cases, Suites and Runs.
 *
 * These pages used to treat the project as one optional filter among many,
 * defaulting to "All projects". They now work the way the Bug List does: a
 * project comes first, the choice is remembered, and the list only loads once
 * one is picked. The selection is shared across all four pages, so opening
 * Runs after Cases lands on the same project.
 */

export interface QaProject {
  value: string;
  label: string;
  code?: string;
  description?: string;
}

/** Shared with the Bug List's own key kept separate — QA Space remembers its own. */
const STORAGE_KEY = "qaspace_selected_project";

/** How many projects the picker lists before "Show more". */
const PICKER_PREVIEW = 6;

/**
 * The projects the signed-in user is an explicit member of. Cached per tenant
 * so all four QA pages share one fetch.
 */
export function useQaProjects() {
  const { user } = useAuth();
  return useQuery<QaProject[]>({
    queryKey: ["qa", "userProjects", user?.tenantId, user?.id],
    queryFn: async () => {
      const res: any = await ProjectService.getUserProjects(true);
      const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      return list
        .map((p: any) => ({
          value: String(p.value ?? p.id ?? ""),
          label: String(p.label ?? p.name ?? ""),
          code: p.code || undefined,
          description: p.code || undefined,
        }))
        .filter((p) => p.value && p.label);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!user,
  });
}

/**
 * The remembered QA project.
 *
 * `ready` is false until localStorage has been read — the pages wait on it so a
 * remembered project doesn't flash the picker for a frame on every load.
 */
export function useQaProject() {
  const { data: projects = [], isLoading } = useQaProjects();
  const [projectId, setStoredId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoredId(window.localStorage.getItem(STORAGE_KEY) || null);
    }
    setHydrated(true);
  }, []);

  const setProjectId = useCallback((id: string | null) => {
    setStoredId(id);
    if (typeof window === "undefined") return;
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  /* A project the user has since been removed from would otherwise leave the
     page permanently empty with no way to tell why. */
  useEffect(() => {
    if (isLoading || !projectId || projects.length === 0) return;
    if (!projects.some((p) => p.value === projectId)) setProjectId(null);
  }, [isLoading, projectId, projects, setProjectId]);

  const project = useMemo(
    () => projects.find((p) => p.value === projectId),
    [projects, projectId]
  );

  return {
    projects,
    loading: isLoading,
    /** localStorage has been read and the project list has arrived. */
    ready: hydrated && !isLoading,
    projectId,
    project,
    /** Test Scopes key off the project *name*, not its id. */
    projectName: project?.label,
    setProjectId,
  };
}

/**
 * The empty state shown until a project is chosen. Deliberately the whole
 * content area rather than a hint pointing at the sidebar — with no project
 * there is nothing else to show.
 */
export function QaProjectPicker({
  projects,
  loading,
  onChoose,
  title = "Choose a project",
  subtitle,
}: {
  projects: QaProject[];
  loading?: boolean;
  onChoose: (id: string) => void;
  title?: string;
  subtitle: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? projects : projects.slice(0, PICKER_PREVIEW);
  const hidden = Math.max(0, projects.length - PICKER_PREVIEW);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: QA_PROJECT_PICKER_STYLES }} />
      <div className="qpg-wrap">
        <div className="qpg-head">
          <span className="qpg-badge"><Briefcase size={20} /></span>
          <h3 className="qpg-title">{title}</h3>
          <p className="qpg-sub">{subtitle}</p>
        </div>

        <div className="qpg-search">
          <SearchableDropdown
            options={projects.map((p) => ({
              value: p.value,
              label: p.label,
              description: p.code ? `#${p.code}` : undefined,
            }))}
            value={undefined}
            onChange={(v: any) => v && onChoose(v)}
            placeholder={loading ? "Loading projects…" : "Search all projects"}
            searchPlaceholder="Type a project name or code…"
            itemNoun="projects"
            loading={loading}
            allowClear={false}
            style={{ width: "100%" }}
          />
        </div>

        {projects.length > 0 && (
          <>
            <div className="qpg-divider">
              <span>{showAll ? "All projects" : "Your projects"}</span>
            </div>

            <div className="qpg-grid">
              {visible.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className="qpg-card"
                  onClick={() => onChoose(p.value)}
                >
                  <span className="qpg-card__code">
                    {(p.code || "PRJ").substring(0, 3).toUpperCase()}
                  </span>
                  <span className="qpg-card__text">
                    <span className="qpg-card__name">{p.label}</span>
                    <span className="qpg-card__meta">#{p.code || "N/A"}</span>
                  </span>
                  <ArrowRight size={14} className="qpg-card__go" />
                </button>
              ))}
            </div>

            {hidden > 0 && (
              <button type="button" className="qpg-more" onClick={() => setShowAll((v) => !v)}>
                <ChevronDown size={13} className={showAll ? "is-open" : ""} />
                {showAll ? "Show less" : `Show ${hidden} more`}
              </button>
            )}
          </>
        )}

        {!loading && projects.length === 0 && (
          <p className="qpg-none">
            You don’t belong to any project yet — ask a project manager to add you.
          </p>
        )}
      </div>
    </>
  );
}

export const QA_PROJECT_PICKER_STYLES = `
.qpg-wrap { max-width: 620px; margin: 40px auto; padding: 0 16px 40px; }
.qpg-head { text-align: center; margin-bottom: 20px; }
.qpg-badge { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; background: rgba(59,130,246,.1); color: #2563eb; margin-bottom: 12px; }
.qpg-title { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -.01em; color: var(--text-slate-900); }
.qpg-sub { margin: 6px auto 0; max-width: 420px; font-size: 12.5px; line-height: 1.55; color: var(--text-slate-500); }
.qpg-search { margin-bottom: 18px; }
.qpg-divider { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-slate-400); }
.qpg-divider::after { content: ''; flex: 1; height: 1px; background: var(--border-slate-100); }
.qpg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px; }
.qpg-card { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; text-align: left; border: 1px solid var(--border-slate-200); border-radius: 10px; background: var(--bg-pure-white); cursor: pointer; transition: border-color .15s ease, background .15s ease; }
.qpg-card:hover { border-color: #bfdbfe; background: var(--bg-slate-50); }
.qpg-card:focus-visible { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }
.qpg-card__code { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px; background: rgba(59,130,246,.1); color: #2563eb; font-size: 10px; font-weight: 800; letter-spacing: .02em; }
.qpg-card__text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.qpg-card__name { font-size: 13px; font-weight: 600; color: var(--text-slate-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qpg-card__meta { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
.qpg-card__go { flex-shrink: 0; color: var(--text-slate-300); }
.qpg-card:hover .qpg-card__go { color: #2563eb; }
.qpg-more { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 6px 10px; border: none; background: none; font-size: 11.5px; font-weight: 600; color: #2563eb; cursor: pointer; }
.qpg-more svg { transition: transform .15s ease; }
.qpg-more svg.is-open { transform: rotate(180deg); }
.qpg-none { margin-top: 16px; text-align: center; font-size: 12.5px; color: var(--text-slate-400); }
`;

/**
 * The project switcher that sits in the page's top bar, the same shape as the
 * Bug List's — the project a QA list is reading is a heading, not a filter
 * buried in the rail.
 */
export function QaProjectSwitcher({
  projects,
  value,
  onChange,
  loading,
  placeholder = "Select Project",
}: {
  projects: QaProject[];
  value: string | null;
  onChange: (id: string | null) => void;
  loading?: boolean;
  /** What the trigger reads with nothing selected. Filters say "All projects". */
  placeholder?: string;
}) {
  const selected = projects.find((p) => p.value === value);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);

  /* A workspace can carry dozens of projects, so the menu filters as you type
     rather than making you scroll for one. */
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.code || "").toLowerCase().includes(q),
    );
  }, [projects, query]);

  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: QA_PROJECT_SWITCHER_STYLES }} />
      <Dropdown
        trigger={["click"]}
        open={open}
        onOpenChange={setOpen}
        popupRender={() => (
          <div className="qps-panel">
            <div className="qps-menu-head">
              <span className="qps-menu-head__title">Projects</span>
              <span className="qps-menu-head__count">
                {loading ? "Loading…" : `${projects.length} Total`}
              </span>
            </div>

            <div className="qps-search">
              <Search size={13} className="qps-search__ic" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects…"
                aria-label="Search projects"
              />
              {query && (
                <X size={12} className="qps-search__clear" onClick={() => setQuery("")} />
              )}
            </div>

            <div className="qps-list">
              {filtered.length === 0 ? (
                <div className="qps-none">
                  {projects.length === 0 ? "No projects available." : "No projects match."}
                </div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={`qps-menu-item ${p.value === value ? "is-active" : ""}`}
                    onClick={() => {
                      onChange(p.value);
                      setOpen(false);
                    }}
                  >
                    <span className="qps-menu-ic">{(p.code || "PRJ").substring(0, 3).toUpperCase()}</span>
                    <span className="qps-menu-text">
                      <span className="qps-menu-title">{p.label}</span>
                      <span className="qps-menu-desc">#{p.code || "N/A"}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        overlayClassName="qps-pop"
      >
        <div className="qps-trigger" role="button" tabIndex={0} data-tour="qa-project-select">
          <div className="qps-trigger__main">
            <Briefcase size={14} className="qps-trigger__icon" />
            <span className="qps-trigger__name">{selected?.label || placeholder}</span>
          </div>
          <div className="qps-trigger__foot">
            <span className="qps-trigger__hint">Switch Project</span>
            {value ? (
              <X
                size={12}
                className="qps-trigger__arrow"
                onClick={(e) => {
                  /* The X clears the project rather than opening the menu it
                     sits inside. */
                  e.stopPropagation();
                  onChange(null);
                }}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <ChevronRight size={9} className="qps-trigger__arrow" />
            )}
          </div>
        </div>
      </Dropdown>
    </>
  );
}

export const QA_PROJECT_SWITCHER_STYLES = `
.qps-trigger { display: flex; flex-direction: column; padding: 2px 8px; border-radius: 6px; cursor: pointer; user-select: none; transition: background .15s ease; }
.qps-trigger:hover { background: var(--bg-slate-50); }
.qps-trigger:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }
.qps-trigger__main { display: flex; align-items: center; gap: 6px; margin-bottom: -1px; }
.qps-trigger__icon { color: #2563eb; opacity: .85; flex-shrink: 0; }
.qps-trigger__name { font-size: 13.5px; font-weight: 700; letter-spacing: -.01em; color: var(--text-slate-900); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qps-trigger__foot { display: flex; align-items: center; gap: 2px; }
.qps-trigger__hint { font-size: 9px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--text-slate-400); }
.qps-trigger__arrow { color: var(--text-slate-400); opacity: .8; }
.qps-trigger__arrow:hover { color: #2563eb; opacity: 1; }
.qps-pop .ant-dropdown-menu { max-height: 340px; overflow-y: auto; padding: 4px; border-radius: 10px; }
.qps-panel {
  width: 268px;
  background: var(--bg-pure-white);
  border: 1px solid var(--border-slate-200);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.06);
}
[data-theme='dark'] .qps-panel { background: #0f1419; border-color: #2d3748; }
.qps-panel .qps-menu-head {
  padding: 10px 12px 8px;
  background: var(--bg-slate-50);
  border-bottom: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .qps-panel .qps-menu-head { background: #111720; border-bottom-color: #1f2937; }
.qps-search {
  display: flex; align-items: center; gap: 7px;
  margin: 8px 8px 4px; padding: 0 9px; height: 30px;
  border: 1px solid var(--border-slate-200); border-radius: 8px;
  background: var(--bg-pure-white);
}
.qps-search:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }
[data-theme='dark'] .qps-search { background: #111720; border-color: #2d3748; }
.qps-search__ic { color: var(--text-slate-400); flex-shrink: 0; }
.qps-search input {
  flex: 1; min-width: 0; border: none; outline: none; background: transparent;
  font-family: inherit; font-size: 12.5px; color: var(--text-slate-900);
}
[data-theme='dark'] .qps-search input { color: #f1f5f9; }
.qps-search input::placeholder { color: var(--text-slate-400); }
.qps-search__clear { color: var(--text-slate-400); cursor: pointer; flex-shrink: 0; }
.qps-search__clear:hover { color: var(--text-slate-900); }
.qps-list { max-height: 268px; overflow-y: auto; padding: 4px 6px 8px; }
.qps-list .qps-menu-item {
  width: 100%; padding: 6px 7px; border-radius: 8px;
  border: 1px solid transparent; background: none; cursor: pointer;
  font-family: inherit; text-align: left;
  transition: background .12s ease, border-color .12s ease;
}
.qps-list .qps-menu-item:hover { background: var(--bg-slate-50); border-color: var(--border-slate-200); }
[data-theme='dark'] .qps-list .qps-menu-item:hover { background: #161B22; border-color: #2d3748; }
.qps-list .qps-menu-item.is-active { background: var(--bg-blue-50); border-color: rgba(59,130,246,0.22); }
.qps-menu-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 4px 6px 2px; }
.qps-menu-head__title { font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--text-slate-400); }
.qps-menu-head__count { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
.qps-menu-item { display: flex; align-items: center; gap: 9px; min-width: 200px; }
.qps-menu-ic { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 26px; height: 26px; border-radius: 7px; background: rgba(100,116,139,.1); color: var(--text-slate-500); font-size: 9.5px; font-weight: 800; }
.qps-menu-item.is-active .qps-menu-ic { background: #3b82f6; color: #fff; }
.qps-menu-text { display: flex; flex-direction: column; min-width: 0; }
.qps-menu-title { font-size: 12.5px; font-weight: 600; color: var(--text-slate-800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qps-menu-item.is-active .qps-menu-title { color: #2563eb; }
.qps-menu-desc { font-size: 10.5px; color: var(--text-slate-400); }
`;
