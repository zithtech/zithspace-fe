'use client';
import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import StatCards from "@/components/common/StatCards";
import { FilterBar, FilterToggleButton, TicketFilterPill } from "@/components/common/FilterBar";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Row,
  Col,
  Typography,
  Input,
  Avatar,
  Tooltip,
  Modal,
  message,
  Button,
  Alert,
  Dropdown,
} from 'antd';
import {
  SearchOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  SortAscendingOutlined,
  DownOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { ProjectService } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { ProjectFormDrawer } from '@/components/projects/ProjectFormDrawer';

const { Title, Text, Paragraph } = Typography;

type SortKey = 'recent' | 'name' | 'progress';
type StatusFilter = 'all' | 'active' | 'paused' | 'completed';

// Curated palette for project identity accents
const ACCENT_PALETTE = [
  { from: '#3b82f6', to: '#60a5fa', soft: '#eff6ff', text: '#1d4ed8' }, // blue
  { from: '#10b981', to: '#34d399', soft: '#ecfdf5', text: '#047857' }, // emerald
  { from: '#6366f1', to: '#818cf8', soft: '#eef2ff', text: '#4338ca' }, // indigo
  { from: '#f59e0b', to: '#fbbf24', soft: '#fffbeb', text: '#b45309' }, // amber
  { from: '#06b6d4', to: '#22d3ee', soft: '#ecfeff', text: '#0e7490' }, // cyan
  { from: '#8b5cf6', to: '#a78bfa', soft: '#f5f3ff', text: '#6d28d9' }, // purple
];

function accentFor(seed: string) {
  if (!seed) return ACCENT_PALETTE[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ACCENT_PALETTE[h % ACCENT_PALETTE.length];
}

function initialsOf(name?: string) {
  if (!name) return 'PR';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function ProjectSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { canReadProject, canCreateProject } = usePermission();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [filterOpen, setFilterOpen] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (search.trim() ? 1 : 0) + (sortKey !== 'recent' ? 1 : 0);

  const { data: response, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'selection'],
    queryFn: () => ProjectService.getSelectionProjects(),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const projects: any[] = Array.isArray(response) ? response : response?.data || [];
  const isLoading = authLoading || projectsLoading;

  // Optimized redirect logic with verification
  useEffect(() => {
    if (authLoading || projectsLoading) return;

    const isExplicitSelect = searchParams.get('select') === 'true';
    if (isExplicitSelect) {
      setIsRedirecting(false);
      return;
    }

    const lastProjectId = localStorage.getItem('lastProjectId');
    if (lastProjectId) {
      const isValid = projects.some((p: any) => p.id === lastProjectId || p.value === lastProjectId);
      if (isValid) {
        router.replace(`/projects/${lastProjectId}/tickets`);
        return;
      }
      localStorage.removeItem('lastProjectId');
    }
    setIsRedirecting(false);
  }, [authLoading, projectsLoading, projects, router, searchParams]);

  // Stats overview
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => (p?.status || 'active').toLowerCase() === 'active').length;
    const paused = projects.filter(p => (p?.status || '').toLowerCase() === 'paused').length;
    const completed = projects.filter(p => (p?.status || '').toLowerCase() === 'completed').length;
    const avgProgress =
      total === 0
        ? 0
        : Math.round(
          projects.reduce((acc, p) => {
            const t = p?.totalTickets || 0;
            const c = p?.completedTickets || 0;
            return acc + (t > 0 ? (c / t) * 100 : 0);
          }, 0) / total,
        );
    const memberIds = new Set<string>();
    projects.forEach(p => p?.members?.forEach((m: any) => m?.user?.id && memberIds.add(m.user.id)));
    return { total, active, paused, completed, avgProgress, teamSize: memberIds.size };
  }, [projects]);

  const pillCounts = useMemo(() => {
    return {
      all: projects.length,
      active: stats.active,
      paused: stats.paused,
      completed: stats.completed,
    };
  }, [projects, stats]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = projects.filter(p => {
      const name = (p?.name || '').toLowerCase();
      const code = (p?.code || '').toLowerCase();
      const matchSearch = !q || name.includes(q) || code.includes(q);
      const status = (p?.status || 'active').toLowerCase();
      const matchStatus = statusFilter === 'all' || status === statusFilter;
      return matchSearch && matchStatus;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === 'name') return (a?.name || '').localeCompare(b?.name || '');
      if (sortKey === 'progress') {
        const pa = (a?.totalTickets || 0) > 0 ? (a?.completedTickets || 0) / a.totalTickets : 0;
        const pb = (b?.totalTickets || 0) > 0 ? (b?.completedTickets || 0) / b.totalTickets : 0;
        return pb - pa;
      }
      // recent (default): newest updatedAt/createdAt first
      const ta = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      const tb = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
      return tb - ta;
    });

    return list;
  }, [projects, search, statusFilter, sortKey]);

  if (!canReadProject && !authLoading) {
    return (
      <MainLayout noPadding>
        <div style={{ padding: 20, maxWidth: 600, margin: '100px auto' }}>
          <Alert
            message="Permission Required"
            description="Without project permission, you cannot read tickets."
            type="warning"
            showIcon
          />
        </div>
      </MainLayout>
    );
  }

  if ((!user && !authLoading) || isRedirecting) {
    return (
      <MainLayout noPadding>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--bg-pure-white)',
          }}
        >
          <ZukvoLoader size="lg" message="Redirecting..." />
        </div>
      </MainLayout>
    );
  }

  const statusPills: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All projects', count: pillCounts.all },
    { key: 'active', label: 'Active', count: pillCounts.active },
    { key: 'paused', label: 'Paused', count: pillCounts.paused },
    { key: 'completed', label: 'Completed', count: pillCounts.completed },
  ];

  const sortLabel: Record<SortKey, string> = {
    recent: 'Recently updated',
    name: 'Name (A–Z)',
    progress: 'Progress (high → low)',
  };

  return (
    <MainLayout noPadding>
      <div className="zs-projects-shell" data-tour="tickets-project-view">
        {/* Hero header */}
        <header className="zs-hero">
          <div className="zs-hero-text">
            <Title level={1} className="zs-hero-title">
              Your projects
            </Title>
            <Paragraph className="zs-hero-sub">
              Pick up where you left off, or jump into something new. Everything you ship, in one place.
            </Paragraph>
          </div>

          <div className="zs-hero-actions">
            <FilterToggleButton
              isOpen={filterOpen}
              onToggle={() => setFilterOpen(v => !v)}
              activeCount={activeFilterCount}
            />
            {canCreateProject && (
              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                onClick={() => setCreateDrawerOpen(true)}
                className="zs-cta-btn"
              >
                New project
              </Button>
            )}
          </div>
        </header>

        {/* Divider */}
        <div className="zs-divider" />

        {/* Shared StatCards Header */}
        <StatCards
          title="Projects Overview"
          statusText="ACTIVE"
          progressPct={stats.avgProgress}
          dotColor="#3b82f6"
          cells={[
            {
              label: 'Total projects',
              value: isLoading ? '—' : stats.total,
              icon: <AppstoreOutlined />,
              color: '#3b82f6',
            },
            {
              label: 'Active',
              value: isLoading ? '—' : stats.active,
              icon: <RiseOutlined />,
              color: '#10b981',
            },
            {
              label: 'Completed',
              value: isLoading ? '—' : stats.completed,
              icon: <CheckCircleOutlined />,
              color: '#6366f1',
            },
            {
              label: 'Avg. completion',
              value: isLoading ? '—' : `${stats.avgProgress}%`,
              icon: <ClockCircleOutlined />,
              color: '#3b82f6',
            },
            {
              label: 'Teammates',
              value: isLoading ? '—' : stats.teamSize,
              icon: <TeamOutlined />,
              color: '#64748b',
            },
          ]}
        />

        {/* FilterBar (Collapsible inline filter row) */}
        {filterOpen && (
          <FilterBar
            isOpen={filterOpen}
            activeCount={activeFilterCount}
            onReset={() => {
              setStatusFilter('all');
              setSearch('');
              setSortKey('recent');
            }}
            onClose={() => setFilterOpen(false)}
          >
            <TicketFilterPill
              label="Status"
              icon={<CheckCircleOutlined style={{ fontSize: 12 }} />}
              value={statusFilter !== 'all' ? statusFilter : undefined}
              options={[
                { value: 'active', label: `Active (${pillCounts.active})`, dotColor: '#10b981' },
                { value: 'paused', label: `Paused (${pillCounts.paused})`, dotColor: '#f59e0b' },
                { value: 'completed', label: `Completed (${pillCounts.completed})`, dotColor: '#3b82f6' },
              ]}
              onChange={v => {
                setStatusFilter((v as StatusFilter) || 'all');
              }}
              multiple={false}
            />

            <Input
              size="middle"
              prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 13 }} />}
              placeholder="Search projects or codes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
              style={{ width: 260, height: 32, borderRadius: 8, fontSize: 12.5 }}
            />

            <Dropdown
              menu={{
                selectable: true,
                selectedKeys: [sortKey],
                onClick: ({ key }) => setSortKey(key as SortKey),
                items: [
                  { key: 'recent', label: 'Recently updated' },
                  { key: 'name', label: 'Name (A–Z)' },
                  { key: 'progress', label: 'Progress (high → low)' },
                ],
              }}
              trigger={['click']}
            >
              <button type="button" className="zs-filter-sort-btn">
                <SortAscendingOutlined style={{ fontSize: 12 }} />
                <span>{sortLabel[sortKey]}</span>
                <DownOutlined style={{ fontSize: 10 }} />
              </button>
            </Dropdown>
          </FilterBar>
        )}

        {/* Grid */}
        <section className="zs-grid-wrap">
          {isLoading ? (
            <Row gutter={[20, 20]}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Col xs={24} sm={12} lg={8} key={i}>
                  <div className="zs-skeleton" />
                </Col>
              ))}
            </Row>
          ) : filteredProjects.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <NoData description={
                <div className="zs-empty pp-empty">
                  <div className="zs-empty-icon pp-empty-orb">
                    <FolderOpenOutlined />
                  </div>
                  <Text strong className="zs-empty-title pp-empty-title">
                    {search || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
                  </Text>
                  <Text className="zs-empty-sub pp-empty-sub">
                    {search
                      ? `We couldn't find anything matching "${search}".`
                      : statusFilter !== 'all'
                        ? 'Try a different status filter, or clear it to see everything.'
                        : "You haven't been assigned to any projects yet."}
                  </Text>
                  {canCreateProject && !search && statusFilter === 'all' && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateDrawerOpen(true)}
                      className="zs-empty-cta"
                    >
                      Create your first project
                    </Button>
                  )}
                </div>
              } />
            </div>
          ) : (
            <Row gutter={[14, 14]}>
              {filteredProjects.map(project => {
                const total = project?.totalTickets || 0;
                const done = project?.completedTickets || 0;
                const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
                const accent = accentFor(project?.code || project?.name || project?.id || '');
                const status = (project?.status || 'active').toLowerCase();

                return (
                  <Col xs={24} sm={12} md={8} xl={6} key={project?.id || 'unknown'}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => project?.id && router.push(`/projects/${project.id}/tickets`)}
                      onKeyDown={e => {
                        if ((e.key === 'Enter' || e.key === ' ') && project?.id) {
                          e.preventDefault();
                          router.push(`/projects/${project.id}/tickets`);
                        }
                      }}
                      className="zs-card"
                      style={
                        {
                          ['--card-accent-from' as any]: accent.from,
                          ['--card-accent-to' as any]: accent.to,
                          ['--card-accent-soft' as any]: accent.soft,
                          ['--card-accent-text' as any]: accent.text,
                        } as React.CSSProperties
                      }
                    >
                      <div className="zs-card-top-rail" aria-hidden />

                      <div className="zs-card-head">
                        <div className="zs-card-id">
                          <div
                            className="zs-card-mark"
                            style={{
                              background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                            }}
                          >
                            {initialsOf(project?.name)}
                          </div>
                          <div className="zs-card-id-text">
                            <Tooltip title={project?.name} placement="topLeft">
                              <div className="zs-card-name">{project?.name || 'Untitled Project'}</div>
                            </Tooltip>
                            <div className="zs-card-code">#{project?.code || 'N/A'}</div>
                          </div>
                        </div>

                        <span className={`zs-status zs-status-${status}`}>
                          <span className="zs-status-dot" />
                          {project?.status || 'Active'}
                        </span>
                      </div>

                      <div className="zs-card-desc">
                        {project?.description ||
                          'Empowering teams to achieve project milestones with efficiency.'}
                      </div>

                      <div className="zs-card-progress">
                        <div className="zs-card-progress-row">
                          <span className="zs-card-progress-label">
                            <ClockCircleOutlined style={{ fontSize: 11, marginRight: 4, color: 'var(--text-slate-400)' }} />
                            <strong>{done}</strong>/{total} tasks
                          </span>
                          <span className="zs-card-progress-pct" style={{ color: accent.text }}>
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="zs-card-progress-track">
                          <div
                            className="zs-card-progress-fill"
                            style={{
                              width: `${progressPercent}%`,
                              background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="zs-card-foot">
                        <div className="zs-card-meta">
                          <span className="zs-card-meta-item">
                            <AppstoreOutlined />
                            <strong>{total}</strong>
                          </span>
                          <span className="zs-card-meta-item">
                            <TeamOutlined />
                            <strong>{project?.members?.length || 0}</strong>
                          </span>
                        </div>

                        <div className="zs-card-foot-right">
                          <Avatar.Group
                            size={20}
                            max={{
                              count: 3,
                              style: {
                                color: 'var(--text-slate-700)',
                                backgroundColor: 'var(--bg-slate-100)',
                                fontSize: 8,
                                fontWeight: 700,
                                border: '1.5px solid var(--bg-pure-white)',
                              },
                            }}
                          >
                            {project?.members?.map((member: any, idx: number) => (
                              <Tooltip title={member?.user?.name} key={idx}>
                                <Avatar
                                  src={member?.user?.avatar}
                                  style={{
                                    backgroundColor: accent.from,
                                    border: '1.5px solid var(--bg-pure-white)',
                                    fontSize: 8,
                                    fontWeight: 700,
                                  }}
                                >
                                  {member?.user?.name?.[0]?.toUpperCase()}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </Avatar.Group>

                          <span className="zs-card-arrow" aria-hidden>
                            <ArrowRightOutlined />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </section>
      </div>

      <ProjectFormDrawer
        visible={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => {
          setCreateDrawerOpen(false);
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }}
      />

      <style jsx global>{`
        .zs-projects-shell {
          margin: 0;
          padding: 0 0 32px 0;
          min-height: calc(100vh - 60px);
          background: var(--bg-pure-white);
          font-family: inherit;
        }

        /* Hero */
        .zs-hero {
          padding: 18px 24px 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .zs-hero-text { flex: 1 1 auto; min-width: 280px; }
        .zs-hero-title.ant-typography {
          margin: 0;
          font-weight: 800;
          font-size: 24px;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: var(--text-slate-900);
        }
        .zs-hero-sub.ant-typography {
          margin: 4px 0 0 0;
          max-width: 700px;
          font-size: 13px;
          line-height: 1.45;
          color: var(--text-slate-500);
        }
        .zs-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .zs-cta-btn.ant-btn {
          height: 32px;
          padding: 0 14px;
          border-radius: 6px;
          font-weight: 700;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          border: none;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.22);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .zs-cta-btn.ant-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.32);
        }

        /* Divider */
        .zs-divider {
          margin: 14px 0 0 0;
          height: 1px;
          background: var(--border-slate-200);
        }

        /* FilterBar components */
        .zs-filter-sort-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 12px;
          border-radius: 6px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          color: var(--text-slate-700);
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .zs-filter-sort-btn:hover {
          border-color: var(--border-slate-300);
          background: var(--bg-slate-50);
        }

        /* Grid */
        .zs-grid-wrap {
          padding: 20px 24px 0 24px;
        }

        /* Card */
        .zs-card {
          position: relative;
          height: 100%;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          padding: 12px 14px 10px 14px;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
          display: flex;
          flex-direction: column;
          min-height: 0;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .zs-card:focus-visible {
          outline: none;
          border-color: var(--card-accent-from);
          box-shadow: 0 0 0 2.5px rgba(59, 130, 246, 0.18);
        }
        .zs-card:hover {
          transform: translateY(-2px);
          border-color: #93c5fd;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.07);
        }
        .zs-card-top-rail {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2.5px;
          background: linear-gradient(90deg, var(--card-accent-from), var(--card-accent-to));
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .zs-card:hover .zs-card-top-rail {
          opacity: 1;
        }

        .zs-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
        }
        .zs-card-id {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }
        .zs-card-mark {
          width: 30px; height: 30px;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.03em;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.10);
        }
        .zs-card-id-text { min-width: 0; flex: 1; }
        .zs-card-name {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.015em;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .zs-card-code {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-400);
          margin-top: 1px;
          letter-spacing: 0.01em;
        }

        .zs-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: capitalize;
          background: var(--bg-slate-100);
          color: var(--text-slate-600);
          border: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        .zs-status-dot {
          width: 5px; height: 5px; border-radius: 999px;
          background: var(--text-slate-400);
        }
        .zs-status-active { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
        .zs-status-active .zs-status-dot { background: #10b981; }
        .zs-status-paused { background: #fff7ed; color: #b45309; border-color: #fed7aa; }
        .zs-status-paused .zs-status-dot { background: #f59e0b; }
        .zs-status-completed { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .zs-status-completed .zs-status-dot { background: #3b82f6; }

        .zs-card-desc {
          font-size: 11.5px;
          line-height: 1.4;
          color: var(--text-slate-500);
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 32px;
        }

        .zs-card-progress { margin-bottom: 8px; }
        .zs-card-progress-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .zs-card-progress-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-slate-500);
        }
        .zs-card-progress-label strong {
          font-weight: 700;
          color: var(--text-slate-800);
        }
        .zs-card-progress-pct {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .zs-card-progress-track {
          height: 4px;
          background: var(--bg-slate-100);
          border-radius: 999px;
          overflow: hidden;
        }
        .zs-card-progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }

        .zs-card-foot {
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid var(--border-slate-100);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .zs-card-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .zs-card-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-slate-500);
        }
        .zs-card-meta-item .anticon { color: var(--text-slate-400); font-size: 11px; }
        .zs-card-meta-item strong { color: var(--text-slate-800); font-weight: 700; }

        .zs-card-foot-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .zs-card-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px; height: 20px;
          border-radius: 999px;
          color: var(--card-accent-text);
          background: var(--card-accent-soft);
          font-size: 9px;
          opacity: 0;
          transform: translateX(-3px);
          transition: all 0.15s ease;
        }
        .zs-card:hover .zs-card-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* Skeleton */
        .zs-skeleton {
          height: 140px;
          border-radius: 10px;
          border: 1px solid var(--border-slate-200);
          background:
            linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.08), transparent),
            var(--bg-pure-white);
          background-size: 200% 100%;
          animation: zs-shimmer 1.6s linear infinite;
        }
        @keyframes zs-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Empty */
        .zs-empty {
          background: var(--bg-pure-white);
          border: 1px dashed var(--border-slate-300);
          border-radius: 16px;
          padding: 72px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .zs-empty-icon {
          width: 60px; height: 60px;
          border-radius: 16px;
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
          font-size: 26px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .zs-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); margin-bottom: 4px; }
        .zs-empty-sub { color: var(--text-slate-500); font-size: 13.5px; max-width: 420px; }
        .zs-empty-cta.ant-btn {
          margin-top: 18px;
          height: 38px;
          border-radius: 10px;
          font-weight: 700;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          border: none;
        }

        @media (max-width: 768px) {
          .zs-projects-shell {
            padding: 16px;
          }
          .zs-search.ant-input-affix-wrapper {
            width: 100%;
          }
          .zs-toolbar-right {
            width: 100%;
          }
        }
      `}</style>
    </MainLayout>
  );
}

export default function ProjectSelectPage() {
  return (
    <Suspense
      fallback={
        <MainLayout noPadding>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              background: 'var(--bg-pure-white)',
            }}
          >
            <ZukvoLoader size="lg" message="Loading Zukvo..." />
          </div>
        </MainLayout>
      }
    >
      <ProjectSelectContent />
    </Suspense>
  );
}

