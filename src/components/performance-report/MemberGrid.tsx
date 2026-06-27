'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Empty, Input, Pagination, Spin, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Briefcase, GraduationCap, Building2, ArrowRight } from 'lucide-react';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import PerformanceReportService, { ReportMember } from '@/services/performanceReportService';
import { ProjectService } from '@/services/projectService';

const PAGE_SIZE = 12; // 3 rows × 4 cards

type Opt = { value: string; label: string };

// Reports landing — a paginated, server-side member directory. Picking a card
// opens that member's report (handled by the parent).
export default function MemberGrid({
  onSelect,
}: {
  onSelect: (member: ReportMember, projectId?: string) => void;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  const [projects, setProjects] = useState<Opt[]>([]);
  const [members, setMembers] = useState<ReportMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Project options for the filter.
  useEffect(() => {
    ProjectService.getProjectsForSelect()
      .then((p) => setProjects((p || []).map((x: any) => ({ value: x.value, label: x.label }))))
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
      });
      setMembers(res.data);
      setTotal(res.total);
    } catch (err: any) {
      message.error(err?.response?.data?.error || err?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [page, debounced, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const rangeLabel = useMemo(() => {
    if (total === 0) return '0 members';
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `${start}–${end} of ${total}`;
  }, [page, total]);

  return (
    <div className="mg-wrap">
      {/* ── 1. Title / subtitle ─────────────────────────────────────────────── */}
      <div className="mg-head">
        <h2 className="mg-title">Reports</h2>
        <p className="mg-sub">
          Pick a team member to review their performance across tickets, time tracking,
          daily updates, attendance and leaves.
        </p>
      </div>

      {/* ── 2. Project + search ─────────────────────────────────────────────── */}
      <div className="mg-filters">
        <SearchableDropdown
          placeholder="All projects"
          searchPlaceholder="Search projects"
          itemNoun="projects"
          value={projectId ?? undefined}
          onChange={(v) => {
            setProjectId(v ?? null);
            setPage(1);
          }}
          options={projects}
          width={240}
          allowClear
        />
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
          placeholder="Search members by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mg-search"
        />
      </div>

      {/* ── 3. Cards ────────────────────────────────────────────────────────── */}
      <div className="mg-body">
        {loading ? (
          <div className="mg-center">
            <Spin />
          </div>
        ) : members.length === 0 ? (
          <div className="mg-center">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No members found" />
          </div>
        ) : (
          <div className="mg-grid">
            {members.map((m) => (
              <button key={m.id} type="button" className="mg-card" onClick={() => onSelect(m, projectId || undefined)}>
                <div className="mg-card-glow" />
                <div className="mg-avatar-ring">
                  <Avatar
                    size={64}
                    src={m.avatarUrl || undefined}
                    style={{
                      background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                      color: '#fff',
                      fontSize: 24,
                      fontWeight: 800,
                    }}
                  >
                    {m.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </div>
                <div className="mg-card-name">{m.name}</div>
                <div className="mg-card-pos">
                  <Briefcase size={12} />
                  {m.position || 'Team member'}
                </div>
                {(m.department || m.grade) && (
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
                  </div>
                )}
                <span className="mg-card-cta">
                  View report <ArrowRight size={13} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Fixed bottom pagination ──────────────────────────────────────── */}
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
        /* Box-shaped: square every corner (avatars stay round). */
        .mg-wrap *, .mg-wrap *::before, .mg-wrap *::after { border-radius: 0 !important; }
        .mg-wrap .ant-avatar, .mg-wrap .mg-avatar-ring { border-radius: 50% !important; }
        /* Match the project dropdown height to the search bar. */
        .mg-filters .mg-search { height: 42px; }
        .mg-filters .sd-trigger { height: 42px !important; }
        .mg-head { margin-bottom: 14px; }
        .mg-title { margin: 0; font-size: 19px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .mg-sub { margin: 4px 0 0; font-size: 13px; color: var(--text-slate-500); max-width: 620px; line-height: 1.5; }

        .mg-filters {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          padding: 14px 16px; border: 1px solid var(--border-slate-200); border-radius: 14px; background: var(--bg-secondary);
          margin-bottom: 16px;
        }
        .mg-search { flex: 1; min-width: 240px; max-width: 460px; border-radius: 10px; }

        .mg-body { flex: 1; min-height: 0; padding-bottom: 4px; }
        .mg-center { display: flex; align-items: center; justify-content: center; padding: 64px 0; }
        .mg-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px;
        }
        @media (max-width: 1100px) { .mg-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 820px)  { .mg-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 540px)  { .mg-grid { grid-template-columns: 1fr; } }

        .mg-card {
          position: relative;
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px;
          padding: 22px 16px 18px; border: 1px solid var(--border-slate-200); border-radius: 18px;
          background: var(--bg-secondary); cursor: pointer; overflow: hidden;
          transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
        }
        .mg-card:hover {
          border-color: #bfdbfe;
          box-shadow: 0 14px 34px rgba(30, 64, 175, 0.12);
          transform: translateY(-3px);
        }
        /* soft accent glow that fades in on hover */
        .mg-card-glow {
          position: absolute; top: -40px; left: 50%; width: 180px; height: 120px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(59,130,246,0.16), transparent 70%);
          opacity: 0; transition: opacity .2s ease; pointer-events: none;
        }
        .mg-card:hover .mg-card-glow { opacity: 1; }

        .mg-avatar-ring {
          position: relative; z-index: 1; padding: 4px; border-radius: 50%;
          background: var(--bg-secondary);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08), 0 8px 18px rgba(15, 23, 42, 0.08);
          transition: box-shadow .16s ease;
        }
        .mg-card:hover .mg-avatar-ring {
          box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.14), 0 10px 22px rgba(30, 64, 175, 0.16);
        }
        .mg-card-name { font-size: 15px; font-weight: 800; color: var(--text-slate-900); margin-top: 12px; letter-spacing: -0.015em; }
        .mg-card-pos {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12.5px; color: var(--text-slate-500); font-weight: 500;
        }
        .mg-card-pos svg { color: var(--text-slate-400); flex-shrink: 0; }
        .mg-card-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-top: 8px; }
        .mg-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
          white-space: nowrap;
        }
        .mg-tag svg { flex-shrink: 0; }
        .mg-tag--dept { color: var(--text-blue-700); background: var(--bg-blue-50); }
        .mg-tag--grade { color: var(--text-slate-700); background: var(--bg-slate-100); }

        .mg-card-cta {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 700; color: #3b82f6;
          margin-top: 14px; opacity: 0; transform: translateY(4px);
          transition: opacity .16s ease, transform .16s ease;
        }
        .mg-card:hover .mg-card-cta { opacity: 1; transform: translateY(0); }

        .mg-footer {
          position: sticky; bottom: 0; z-index: 5;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 14px 16px; margin: 8px 0 0;
          border-top: 1px solid var(--border-slate-100); flex-shrink: 0;
          background: var(--bg-secondary);
          box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.05);
        }
        .mg-footer-info { font-size: 12.5px; color: var(--text-slate-500); font-weight: 600; }
      `}</style>
    </div>
  );
}
