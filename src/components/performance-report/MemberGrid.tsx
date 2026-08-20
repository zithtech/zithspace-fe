'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Input, Pagination, message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import {
  Briefcase,
  Building2,
  GraduationCap,
  ArrowRight,
  Search,
  LayoutGrid,
  Rows3,
  Users,
  Mail,
  SlidersHorizontal,
  X,
  UserSearch,
} from 'lucide-react';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import PerformanceReportService, {
  ReportMember,
  MemberFilterOptions,
} from '@/services/performanceReportService';
import { ProjectService } from '@/services/projectService';

const PAGE_SIZE = 12;

type Opt = { value: string; label: string };
type ViewMode = 'grid' | 'list';

// Reports landing — a paginated, server-side member directory. Picking a card
// opens that member's report (handled by the parent).
export default function MemberGrid({
  onSelect,
}: {
  onSelect: (member: ReportMember, projectId?: string) => void;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>('grid');

  const [projects, setProjects] = useState<Opt[]>([]);
  const [filterOpts, setFilterOpts] = useState<MemberFilterOptions>({
    positions: [],
    departments: [],
  });
  const [members, setMembers] = useState<ReportMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Project options for the filter.
  useEffect(() => {
    ProjectService.getProjectsForSelect()
      .then((p) => setProjects((p || []).map((x: any) => ({ value: x.value, label: x.label }))))
      .catch(() => {});
  }, []);

  // Position + department options (only values actually held by members).
  useEffect(() => {
    PerformanceReportService.getMemberFilterOptions()
      .then(setFilterOpts)
      .catch(() => {});
  }, []);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PerformanceReportService.getMembers({
        page,
        limit: PAGE_SIZE,
        search: debounced || undefined,
        projectId: projectId || undefined,
        positionId: positionId || undefined,
        departmentId: departmentId || undefined,
      });
      setMembers(res.data);
      setTotal(res.total);
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [page, debounced, projectId, positionId, departmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const rangeLabel = useMemo(() => {
    if (total === 0) return 'No members';
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `Showing ${start}–${end} of ${total}`;
  }, [page, total]);

  // Active filters, rendered as removable chips under the toolbar.
  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; value: string; clear: () => void }> = [];
    if (debounced)
      out.push({
        key: 'search',
        label: 'Search',
        value: debounced,
        clear: () => setSearch(''),
      });
    if (departmentId)
      out.push({
        key: 'department',
        label: 'Department',
        value: filterOpts.departments.find((d) => d.id === departmentId)?.label ?? '—',
        clear: () => setDepartmentId(null),
      });
    if (positionId)
      out.push({
        key: 'position',
        label: 'Position',
        value: filterOpts.positions.find((p) => p.id === positionId)?.label ?? '—',
        clear: () => setPositionId(null),
      });
    if (projectId)
      out.push({
        key: 'project',
        label: 'Project',
        value: projects.find((p) => p.value === projectId)?.label ?? '—',
        clear: () => setProjectId(null),
      });
    return out;
  }, [debounced, departmentId, positionId, projectId, filterOpts, projects]);

  const resetAll = () => {
    setSearch('');
    setDepartmentId(null);
    setPositionId(null);
    setProjectId(null);
    setPage(1);
  };

  const onFilterChange = (setter: (v: string | null) => void) => (v?: string) => {
    setter(v ?? null);
    setPage(1);
  };

  return (
    <div className="mg-wrap">
      {/* ── 1. Hero band ────────────────────────────────────────────────────── */}
      <div className="mg-header">
        <div className="mg-hero-glow" />
        <div className="mg-hero-inner">
          <div className="mg-hero-text">
            <h2 className="mg-title">Reports</h2>
            <p className="mg-sub">Pick a member to open their performance report.</p>
          </div>

          <div className="mg-kpis">
            <div className="mg-kpi">
              <span className="mg-kpi-ic mg-kpi-ic--blue">
                <Users size={14} />
              </span>
              <span className="mg-kpi-body">
                <span className="mg-kpi-num">{total}</span>
                <span className="mg-kpi-label">Members</span>
              </span>
            </div>
            <div className="mg-kpi">
              <span className="mg-kpi-ic mg-kpi-ic--green">
                <Building2 size={14} />
              </span>
              <span className="mg-kpi-body">
                <span className="mg-kpi-num">{filterOpts.departments.length}</span>
                <span className="mg-kpi-label">Departments</span>
              </span>
            </div>
            <div className="mg-kpi">
              <span className="mg-kpi-ic mg-kpi-ic--slate">
                <Briefcase size={14} />
              </span>
              <span className="mg-kpi-body">
                <span className="mg-kpi-num">{filterOpts.positions.length}</span>
                <span className="mg-kpi-label">Positions</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Command bar: search + filters + view switch ──────────────────── */}
      <div className="mg-toolbar">
        <div className="mg-search-wrap">
          <Input
            allowClear
            prefix={<Search size={15} style={{ color: 'var(--text-slate-400)' }} />}
            placeholder="Search members by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mg-search"
          />
        </div>

        <span className="mg-toolbar-divider" />

        <div className="mg-filter-group">
          <span className="mg-filter-hint">
            <SlidersHorizontal size={13} />
          </span>

          <SearchableDropdown
            placeholder="All positions"
            searchPlaceholder="Search positions"
            itemNoun="positions"
            value={positionId ?? undefined}
            onChange={onFilterChange(setPositionId)}
            options={filterOpts.positions.map((p) => ({
              value: p.id,
              label: p.label,
              badge: (
                <span className="mg-opt-ic">
                  <Briefcase size={13} />
                </span>
              ),
              meta: <span className="mg-opt-count">{p.count}</span>,
            }))}
            width={280}
            allowClear
            className="mg-dd"
          />

          <SearchableDropdown
            placeholder="All departments"
            searchPlaceholder="Search departments"
            itemNoun="departments"
            value={departmentId ?? undefined}
            onChange={onFilterChange(setDepartmentId)}
            options={filterOpts.departments.map((d) => ({
              value: d.id,
              label: d.label,
              badge: (
                <span className="mg-opt-ic">
                  <Building2 size={13} />
                </span>
              ),
              meta: <span className="mg-opt-count">{d.count}</span>,
            }))}
            width={280}
            allowClear
            className="mg-dd"
          />

          <SearchableDropdown
            placeholder="All projects"
            searchPlaceholder="Search projects"
            itemNoun="projects"
            value={projectId ?? undefined}
            onChange={onFilterChange(setProjectId)}
            options={projects}
            width={260}
            allowClear
            className="mg-dd"
          />
        </div>
        <Button
          icon={<SyncOutlined />}
          loading={loading}
          onClick={load}
          style={{ height: 38, width: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Refresh"
        />

        <div className="mg-view-switch" role="group" aria-label="View mode">
          <button
            type="button"
            className={`mg-view-btn ${view === 'grid' ? 'is-active' : ''}`}
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
            title="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            className={`mg-view-btn ${view === 'list' ? 'is-active' : ''}`}
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
            title="List view"
          >
            <Rows3 size={15} />
          </button>
        </div>
      </div>

      {/* ── 3. Active filter chips ──────────────────────────────────────────── */}
      {chips.length > 0 && (
        <div className="mg-chips">
          {chips.map((c) => (
            <span key={c.key} className="mg-chip">
              <span className="mg-chip-label">{c.label}</span>
              <span className="mg-chip-value">{c.value}</span>
              <button
                type="button"
                className="mg-chip-x"
                onClick={c.clear}
                aria-label={`Clear ${c.label} filter`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <button type="button" className="mg-chip-reset" onClick={resetAll}>
            Clear all
          </button>
        </div>
      )}

      {/* ── 4. Results ──────────────────────────────────────────────────────── */}
      <div className="mg-body">
        {loading ? (
          <div className={view === 'grid' ? 'mg-grid' : 'mg-list'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`mg-skel mg-skel--${view}`}>
                <div className="mg-skel-avatar" />
                <div className="mg-skel-lines">
                  <div className="mg-skel-line" style={{ width: '52%' }} />
                  <div className="mg-skel-line" style={{ width: '34%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="mg-empty">
            <span className="mg-empty-ic">
              <UserSearch size={26} />
            </span>
            <div className="mg-empty-title">No members match these filters</div>
            <p className="mg-empty-sub">
              Try a different position or department, or clear the filters to see the full team.
            </p>
            {chips.length > 0 && (
              <button type="button" className="mg-empty-btn" onClick={resetAll}>
                Clear all filters
              </button>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="mg-grid">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                className="mg-card"
                onClick={() => onSelect(m, projectId || undefined)}
              >
                <span className="mg-card-rail" />
                <div className="mg-card-glow" />

                <div className="mg-card-top">
                  <div className="mg-avatar-ring">
                    <Avatar
                      size={48}
                      src={m.avatarUrl || undefined}
                      style={{
                        background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
                        color: '#fff',
                        fontSize: 18,
                        fontWeight: 800,
                      }}
                    >
                      {m.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <span className="mg-avatar-dot" />
                  </div>
                  <div className="mg-card-id">
                    <div className="mg-card-name">{m.name}</div>
                    <div className="mg-card-pos">
                      <Briefcase size={12} />
                      <span className="mg-ellipsis">{m.position || 'Team member'}</span>
                    </div>
                  </div>
                </div>

                {m.workEmail && (
                  <div className="mg-card-mail">
                    <Mail size={12} />
                    <span className="mg-ellipsis">{m.workEmail}</span>
                  </div>
                )}

                <div className="mg-card-foot">
                  <div className="mg-card-tags">
                    {m.department && (
                      <span className="mg-tag mg-tag--dept">
                        <Building2 size={11} />
                        {m.department}
                      </span>
                    )}
                    {m.grade && (
                      <span className="mg-tag mg-tag--grade">
                        <GraduationCap size={11} />
                        {m.grade}
                      </span>
                    )}
                    {!m.department && !m.grade && (
                      <span className="mg-tag mg-tag--muted">No department set</span>
                    )}
                  </div>
                  <span className="mg-card-cta">
                    View report
                    <ArrowRight size={13} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mg-list">
            <div className="mg-list-head">
              <span>Member</span>
              <span>Position</span>
              <span>Department</span>
              <span>Grade</span>
              <span />
            </div>
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                className="mg-row"
                onClick={() => onSelect(m, projectId || undefined)}
              >
                <span className="mg-row-member">
                  <Avatar
                    size={36}
                    src={m.avatarUrl || undefined}
                    style={{
                      background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {m.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <span className="mg-row-id">
                    <span className="mg-row-name">{m.name}</span>
                    <span className="mg-row-mail">{m.workEmail || '—'}</span>
                  </span>
                </span>
                <span className="mg-row-cell">{m.position || '—'}</span>
                <span className="mg-row-cell">
                  {m.department ? (
                    <span className="mg-tag mg-tag--dept">
                      <Building2 size={11} />
                      {m.department}
                    </span>
                  ) : (
                    '—'
                  )}
                </span>
                <span className="mg-row-cell">
                  {m.grade ? <span className="mg-tag mg-tag--grade">{m.grade}</span> : '—'}
                </span>
                <span className="mg-row-arrow">
                  <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. Fixed bottom pagination ──────────────────────────────────────── */}
      <div className="mg-footer">
        <span className="mg-footer-info">{rangeLabel}</span>
        <Pagination
          current={page}
          pageSize={PAGE_SIZE}
          total={total}
          showSizeChanger={false}
          onChange={setPage}
        />
      </div>

      <style jsx global>{`
        .mg-wrap { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .mg-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }

        /* ── Hero band (full-bleed via the layout's -header rule) ───────────── */
        /* The negative top margin swallows .pr-main + .pr-content's top padding
           so the tinted band starts flush with the top of the page. */
        .mg-header {
          position: relative;
          overflow: hidden;
          margin-top: -12px;
          padding: 14px 0 13px;
          margin-bottom: 14px;
          border-bottom: 1px solid var(--border-slate-100);
          background:
            linear-gradient(180deg, rgba(59, 130, 246, 0.055), rgba(59, 130, 246, 0) 82%),
            var(--bg-pure-white);
        }
        .mg-hero-glow {
          position: absolute; top: -130px; right: -60px; width: 380px; height: 240px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 68%);
          pointer-events: none;
        }
        .mg-hero-inner {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
        }
        .mg-hero-text { min-width: 0; }
        .mg-title {
          margin: 0; font-size: 20px; font-weight: 800; color: var(--text-slate-900);
          letter-spacing: -0.03em; line-height: 1.15;
        }
        .mg-sub {
          margin: 3px 0 0; font-size: 12.5px; color: var(--text-slate-500);
          line-height: 1.45; max-width: 560px;
        }

        .mg-kpis { display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap; }
        .mg-kpi {
          display: flex; align-items: center; gap: 9px;
          padding: 7px 14px 7px 9px; border-radius: 12px;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          min-width: 112px;
        }
        .mg-kpi-ic {
          width: 28px; height: 28px; flex-shrink: 0; border-radius: 9px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .mg-kpi-ic--blue  { color: #2563eb; background: rgba(59, 130, 246, 0.11); }
        .mg-kpi-ic--green { color: #059669; background: rgba(16, 185, 129, 0.12); }
        .mg-kpi-ic--slate { color: var(--text-slate-500); background: var(--bg-slate-100); }
        .mg-kpi-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .mg-kpi-num {
          font-size: 16px; font-weight: 800; color: var(--text-slate-900);
          line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums;
        }
        .mg-kpi-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--text-slate-400);
        }

        /* ── Command bar ────────────────────────────────────────────────────── */
        .mg-toolbar {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          padding: 10px 12px; margin-bottom: 12px;
          border: 1px solid var(--border-slate-200); border-radius: 16px;
          background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.035);
        }
        .mg-search-wrap { flex: 1 1 260px; min-width: 220px; max-width: 400px; }
        .mg-toolbar .mg-search { height: 38px; }
        .mg-toolbar .mg-search,
        .mg-toolbar .mg-search .ant-input,
        .mg-toolbar .mg-search.ant-input-affix-wrapper {
          border-radius: 11px !important; background: var(--bg-slate-50) !important;
        }
        .mg-toolbar .mg-search.ant-input-affix-wrapper { border-color: transparent; }
        .mg-toolbar .mg-search.ant-input-affix-wrapper:hover { border-color: #bfdbfe; }
        .mg-toolbar .mg-search.ant-input-affix-wrapper-focused {
          background: var(--bg-pure-white) !important; border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }
        .mg-toolbar-divider {
          width: 1px; height: 26px; background: var(--border-slate-200); flex-shrink: 0;
        }
        .mg-filter-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
        .mg-filter-hint {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0;
          color: var(--text-slate-400); background: var(--bg-slate-50);
        }
        .mg-filter-group .sd-trigger {
          height: 38px !important; border-radius: 11px !important; min-width: 170px;
          background: var(--bg-pure-white) !important;
        }
        .mg-filter-group .sd-trigger:hover { border-color: #bfdbfe !important; }
        .mg-opt-ic {
          width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--text-slate-500); background: var(--bg-slate-100);
        }
        .mg-opt-count {
          font-size: 11px; font-weight: 700; color: var(--text-slate-500);
          background: var(--bg-slate-100); padding: 2px 7px; border-radius: 999px;
          font-variant-numeric: tabular-nums;
        }

        .mg-view-switch {
          display: inline-flex; gap: 2px; padding: 3px; margin-left: auto; flex-shrink: 0;
          border: 1px solid var(--border-slate-200); border-radius: 11px; background: var(--bg-slate-50);
        }
        .mg-view-btn {
          width: 32px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
          border: none; background: transparent; border-radius: 8px; cursor: pointer;
          color: var(--text-slate-400); transition: color .14s ease, background .14s ease, box-shadow .14s ease;
        }
        .mg-view-btn:hover { color: var(--text-slate-700); }
        .mg-view-btn.is-active {
          color: #2563eb; background: var(--bg-pure-white);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }

        /* ── Active filter chips ────────────────────────────────────────────── */
        .mg-chips { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 14px; }
        .mg-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 5px 4px 10px; border-radius: 999px;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          font-size: 12px; max-width: 280px;
        }
        .mg-chip-label {
          font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-slate-400);
        }
        .mg-chip-value {
          font-weight: 600; color: var(--text-slate-700);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .mg-chip-x {
          width: 18px; height: 18px; flex-shrink: 0; border: none; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; border-radius: 50%;
          color: var(--text-slate-400); background: var(--bg-slate-100);
          transition: color .14s ease, background .14s ease;
        }
        .mg-chip-x:hover { color: var(--text-slate-900); background: var(--border-slate-200); }
        .mg-chip-reset {
          border: none; background: transparent; cursor: pointer; padding: 4px 6px;
          font-size: 12px; font-weight: 700; color: #2563eb;
        }
        .mg-chip-reset:hover { text-decoration: underline; }

        /* ── Body ───────────────────────────────────────────────────────────── */
        .mg-body { flex: 1; min-height: 0; padding-bottom: 6px; }
        .mg-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px;
        }

        /* Card */
        .mg-card {
          position: relative; overflow: hidden; text-align: left;
          display: flex; flex-direction: column; gap: 12px;
          padding: 16px 18px; border: 1px solid var(--border-slate-200); border-radius: 16px;
          background: var(--bg-pure-white); cursor: pointer;
          transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
        }
        .mg-card:hover {
          border-color: #bfdbfe;
          box-shadow: 0 12px 30px rgba(30, 64, 175, 0.11);
          transform: translateY(-3px);
        }
        .mg-card-rail {
          position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: linear-gradient(180deg, #60a5fa, #2563eb);
          transform: scaleY(0); transform-origin: top;
          transition: transform .2s ease;
        }
        .mg-card:hover .mg-card-rail { transform: scaleY(1); }
        .mg-card-glow {
          position: absolute; top: -60px; right: -30px; width: 180px; height: 140px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.14), transparent 70%);
          opacity: 0; transition: opacity .2s ease; pointer-events: none;
        }
        .mg-card:hover .mg-card-glow { opacity: 1; }

        .mg-card-top { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .mg-avatar-ring {
          position: relative; z-index: 1; padding: 3px; border-radius: 50%; flex-shrink: 0;
          background: var(--bg-pure-white);
          box-shadow: 0 0 0 1.5px rgba(59, 130, 246, 0.18), 0 6px 14px rgba(15, 23, 42, 0.08);
          transition: box-shadow .16s ease;
        }
        .mg-card:hover .mg-avatar-ring {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16), 0 8px 18px rgba(30, 64, 175, 0.16);
        }
        .mg-avatar-dot {
          position: absolute; right: 2px; bottom: 2px; width: 10px; height: 10px; border-radius: 50%;
          background: #10b981; border: 2px solid var(--bg-pure-white);
        }
        .mg-card-id { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
        .mg-card-name {
          font-size: 15px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.015em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mg-card-pos {
          display: flex; align-items: center; gap: 6px; min-width: 0;
          font-size: 12.5px; color: var(--text-slate-500); font-weight: 500;
        }
        .mg-card-pos svg { color: var(--text-slate-400); flex-shrink: 0; }
        .mg-card-mail {
          display: flex; align-items: center; gap: 6px; min-width: 0;
          font-size: 12px; color: var(--text-slate-400); font-weight: 500;
        }
        .mg-card-mail svg { flex-shrink: 0; }

        .mg-card-foot {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding-top: 12px; border-top: 1px dashed var(--border-slate-200); min-width: 0;
        }
        .mg-card-tags { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
        .mg-tag {
          display: inline-flex; align-items: center; gap: 5px; max-width: 100%;
          font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mg-tag svg { flex-shrink: 0; }
        .mg-tag--dept { color: var(--text-blue-700); background: var(--bg-blue-50); }
        .mg-tag--grade { color: var(--text-slate-700); background: var(--bg-slate-100); }
        .mg-tag--muted { color: var(--text-slate-400); background: var(--bg-slate-50); font-weight: 600; }

        .mg-card-cta {
          display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
          font-size: 12px; font-weight: 800; color: #2563eb;
          opacity: 0; transform: translateX(-6px);
          transition: opacity .16s ease, transform .16s ease;
        }
        .mg-card:hover .mg-card-cta { opacity: 1; transform: translateX(0); }

        /* List view */
        .mg-list { display: flex; flex-direction: column; gap: 6px; }
        .mg-list-head {
          display: grid; grid-template-columns: minmax(200px, 2.2fr) 1.4fr 1.2fr 0.8fr 40px;
          gap: 14px; align-items: center; padding: 0 16px 8px;
          font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); border-bottom: 1px solid var(--border-slate-100);
        }
        .mg-row {
          display: grid; grid-template-columns: minmax(200px, 2.2fr) 1.4fr 1.2fr 0.8fr 40px;
          gap: 14px; align-items: center; text-align: left; width: 100%;
          padding: 11px 16px; border: 1px solid transparent; border-radius: 12px;
          background: var(--bg-pure-white); cursor: pointer;
          transition: border-color .14s ease, background .14s ease, box-shadow .14s ease;
        }
        .mg-row:hover {
          border-color: #bfdbfe; background: var(--bg-blue-50);
          box-shadow: 0 4px 14px rgba(30, 64, 175, 0.08);
        }
        .mg-row-member { display: flex; align-items: center; gap: 11px; min-width: 0; }
        .mg-row-id { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .mg-row-name {
          font-size: 13.5px; font-weight: 700; color: var(--text-slate-900);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mg-row-mail {
          font-size: 11.5px; color: var(--text-slate-400);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mg-row-cell {
          font-size: 12.5px; color: var(--text-slate-700); min-width: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mg-row-arrow {
          display: inline-flex; align-items: center; justify-content: center; color: #2563eb;
          opacity: 0; transform: translateX(-4px); transition: opacity .14s ease, transform .14s ease;
        }
        .mg-row:hover .mg-row-arrow { opacity: 1; transform: translateX(0); }

        /* Skeletons — standalone boxes so they don't inherit the card/row grid. */
        .mg-skel {
          pointer-events: none; display: flex; align-items: center; gap: 12px;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
        }
        .mg-skel--grid { padding: 24px 18px; border-radius: 16px; }
        .mg-skel--list { padding: 14px 16px; border-radius: 12px; }
        .mg-skel-avatar {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          background: var(--bg-slate-100);
        }
        .mg-skel-lines { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
        .mg-skel-line { height: 10px; border-radius: 6px; background: var(--bg-slate-100); }
        /* Opacity pulse (not a white sweep) so it reads correctly in dark mode too. */
        .mg-skel-avatar, .mg-skel-line { animation: mg-pulse 1.4s ease-in-out infinite; }
        .mg-skel-line:last-child { animation-delay: .18s; }
        @keyframes mg-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }

        /* Empty state */
        .mg-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; padding: 64px 24px; text-align: center;
          border: 1px dashed var(--border-slate-200); border-radius: 16px; background: var(--bg-slate-50);
        }
        .mg-empty-ic {
          width: 54px; height: 54px; border-radius: 16px; margin-bottom: 4px;
          display: inline-flex; align-items: center; justify-content: center;
          color: #2563eb; background: var(--bg-blue-50);
        }
        .mg-empty-title { font-size: 15px; font-weight: 800; color: var(--text-slate-900); }
        .mg-empty-sub {
          margin: 0; font-size: 13px; color: var(--text-slate-500); max-width: 380px; line-height: 1.55;
        }
        .mg-empty-btn {
          margin-top: 8px; padding: 8px 16px; border-radius: 10px; cursor: pointer;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          font-size: 12.5px; font-weight: 700; color: var(--text-slate-700);
          transition: color .14s ease, border-color .14s ease;
        }
        .mg-empty-btn:hover { color: #2563eb; border-color: #bfdbfe; }

        /* ── Footer ─────────────────────────────────────────────────────────── */
        .mg-footer {
          position: sticky; bottom: 0; z-index: 5;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 14px 32px; margin: 8px -32px 0;
          border-top: 1px solid var(--border-slate-100); flex-shrink: 0;
          background: var(--bg-pure-white);
          box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.05);
        }
        .mg-footer-info { font-size: 12.5px; color: var(--text-slate-500); font-weight: 600; }

        /* ── Responsive ─────────────────────────────────────────────────────── */
        @media (max-width: 1180px) {
          .mg-list-head, .mg-row { grid-template-columns: minmax(180px, 2fr) 1.4fr 1.2fr 40px; }
          .mg-list-head > span:nth-child(4), .mg-row > .mg-row-cell:nth-child(4) { display: none; }
        }
        @media (max-width: 1024px) {
          .mg-footer { margin-left: -16px; margin-right: -16px; padding-left: 16px; padding-right: 16px; }
        }
        @media (max-width: 860px) {
          .mg-hero-inner { align-items: flex-start; gap: 12px; }
          .mg-title { font-size: 18px; }
          .mg-kpi { min-width: 98px; padding: 7px 11px; }
          .mg-toolbar-divider { display: none; }
          .mg-search-wrap { max-width: 100%; flex-basis: 100%; }
          .mg-view-switch { margin-left: 0; }
          .mg-list-head { display: none; }
          .mg-row {
            grid-template-columns: 1fr 40px;
            border-color: var(--border-slate-200);
          }
          /* Only the member identity + arrow survive on narrow screens. */
          .mg-row > .mg-row-cell { display: none; }
        }
        @media (max-width: 560px) {
          .mg-filter-group { width: 100%; }
          .mg-filter-group .sd-trigger { flex: 1 1 140px; min-width: 140px; }
          .mg-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
