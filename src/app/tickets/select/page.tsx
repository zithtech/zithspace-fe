'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Row,
  Col,
  Typography,
  Input,
  Empty,
  Avatar,
  Tooltip,
  Spin,
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
  DeleteOutlined,
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

const { Title, Text, Paragraph } = Typography;

type SortKey = 'recent' | 'name' | 'progress';
type StatusFilter = 'all' | 'active' | 'paused' | 'completed';

// Curated palette for project identity accents
const ACCENT_PALETTE = [
  { from: '#3b82f6', to: '#6366f1', soft: '#eff6ff', text: '#1d4ed8' }, // blue/indigo
  { from: '#8b5cf6', to: '#a855f7', soft: '#f5f3ff', text: '#6d28d9' }, // violet
  { from: '#06b6d4', to: '#0ea5e9', soft: '#ecfeff', text: '#0e7490' }, // cyan
  { from: '#10b981', to: '#14b8a6', soft: '#ecfdf5', text: '#047857' }, // emerald
  { from: '#f59e0b', to: '#f97316', soft: '#fff7ed', text: '#b45309' }, // amber
  { from: '#f43f5e', to: '#ec4899', soft: '#fff1f2', text: '#be123c' }, // rose
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
  const { canReadProject, canCreateProject, canDeleteProject } = usePermission();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [isRedirecting, setIsRedirecting] = useState(true);
  const queryClient = useQueryClient();

  const { data: response, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'selection'],
    queryFn: () => ProjectService.getSelectionProjects(),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ProjectService.deleteProject(id),
    onSuccess: () => {
      message.success('Project moved to trash');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to delete project');
    },
  });

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    Modal.confirm({
      title: 'Are you sure you want to delete this project?',
      icon: <ExclamationCircleFilled style={{ color: '#ef4444' }} />,
      content: `The project "${name}" will be moved to trash.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: () => deleteMutation.mutateAsync(id),
    });
  };

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
    return { total, active, completed, avgProgress, teamSize: memberIds.size };
  }, [projects]);

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
      <MainLayout>
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
      <MainLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--bg-pure-white)',
          }}
        >
          <Spin size="large" tip="Redirecting..." />
        </div>
      </MainLayout>
    );
  }

  const statusPills: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All projects' },
    { key: 'active', label: 'Active' },
    { key: 'paused', label: 'Paused' },
    { key: 'completed', label: 'Completed' },
  ];

  const sortLabel: Record<SortKey, string> = {
    recent: 'Recently updated',
    name: 'Name (A–Z)',
    progress: 'Progress (high → low)',
  };

  return (
    <MainLayout>
      <div className="zs-projects-shell">
        {/* Hero header */}
        <header className="zs-hero">
          <div className="zs-hero-text">
            <div className="zs-eyebrow">
              <span className="zs-eyebrow-dot" />
              Workspace
            </div>
            <Title level={1} className="zs-hero-title">
              Your projects
            </Title>
            <Paragraph className="zs-hero-sub">
              Pick up where you left off, or jump into something new. Everything you ship, in one place.
            </Paragraph>
          </div>

          {canCreateProject && (
            <div className="zs-hero-cta">
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => router.push('/tickets/create')}
                className="zs-cta-btn"
              >
                New project
              </Button>
            </div>
          )}
        </header>

        {/* Stats overview */}
        <section className="zs-stats">
          <StatTile
            icon={<AppstoreOutlined />}
            label="Total projects"
            value={isLoading ? '—' : String(stats.total)}
            tint="blue"
          />
          <StatTile
            icon={<RiseOutlined />}
            label="Active"
            value={isLoading ? '—' : String(stats.active)}
            tint="emerald"
          />
          <StatTile
            icon={<CheckCircleOutlined />}
            label="Avg. completion"
            value={isLoading ? '—' : `${stats.avgProgress}%`}
            tint="violet"
          />
          <StatTile
            icon={<TeamOutlined />}
            label="Teammates"
            value={isLoading ? '—' : String(stats.teamSize)}
            tint="amber"
          />
        </section>

        {/* Toolbar */}
        <section className="zs-toolbar">
          <div className="zs-pills">
            {statusPills.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => setStatusFilter(p.key)}
                className={`zs-pill ${statusFilter === p.key ? 'is-active' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="zs-toolbar-right">
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 16 }} />}
              placeholder="Search projects or codes"
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
              className="zs-search"
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
              <button type="button" className="zs-sort-btn">
                <SortAscendingOutlined />
                <span>{sortLabel[sortKey]}</span>
                <DownOutlined style={{ fontSize: 10 }} />
              </button>
            </Dropdown>
          </div>
        </section>

        {/* Grid */}
        <section className="zs-grid-wrap">
          {isLoading ? (
            <Row gutter={[24, 24]}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Col xs={24} sm={12} lg={8} key={i}>
                  <div className="zs-skeleton" />
                </Col>
              ))}
            </Row>
          ) : filteredProjects.length === 0 ? (
            <div className="zs-empty">
              <div className="zs-empty-icon">
                <FolderOpenOutlined />
              </div>
              <Text strong className="zs-empty-title">
                {search || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
              </Text>
              <Text className="zs-empty-sub">
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
                  onClick={() => router.push('/tickets/create')}
                  className="zs-empty-cta"
                >
                  Create your first project
                </Button>
              )}
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {filteredProjects.map(project => {
                const total = project?.totalTickets || 0;
                const done = project?.completedTickets || 0;
                const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
                const accent = accentFor(project?.code || project?.name || project?.id || '');
                const status = (project?.status || 'active').toLowerCase();

                return (
                  <Col xs={24} sm={12} lg={8} key={project?.id || 'unknown'}>
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
                          // CSS vars consumed by the static stylesheet — no JS interpolation in <style>
                          ['--card-accent-from' as any]: accent.from,
                          ['--card-accent-to' as any]: accent.to,
                          ['--card-accent-soft' as any]: accent.soft,
                          ['--card-accent-text' as any]: accent.text,
                        } as React.CSSProperties
                      }
                    >
                      <div className="zs-card-accent" aria-hidden />

                      <div className="zs-card-head">
                        <div className="zs-card-id">
                          <div className="zs-card-mark">{initialsOf(project?.name)}</div>
                          <div className="zs-card-id-text">
                            <Tooltip title={project?.name} placement="topLeft">
                              <div className="zs-card-name">{project?.name || 'Untitled Project'}</div>
                            </Tooltip>
                            <div className="zs-card-code">#{project?.code || 'N/A'}</div>
                          </div>
                        </div>

                        <div className="zs-card-head-right">
                          <span className={`zs-status zs-status-${status}`}>
                            <span className="zs-status-dot" />
                            {project?.status || 'Active'}
                          </span>
                          {canDeleteProject && searchParams.get('select') !== 'true' && (
                            <Tooltip title="Delete project">
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={e =>
                                  project?.id &&
                                  handleDelete(e, project.id, project.name || 'Untitled Project')
                                }
                                className="zs-card-delete"
                              />
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      <div className="zs-card-desc">
                        {project?.description ||
                          'Empowering teams to achieve project milestones with efficiency and transparency.'}
                      </div>

                      <div className="zs-card-progress">
                        <div className="zs-card-progress-row">
                          <span className="zs-card-progress-label">
                            <ClockCircleOutlined style={{ fontSize: 12, marginRight: 6 }} />
                            {done} of {total} tasks done
                          </span>
                          <span className="zs-card-progress-pct">{progressPercent}%</span>
                        </div>
                        <div className="zs-card-progress-track">
                          <div className="zs-card-progress-fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div>

                      <div className="zs-card-foot">
                        <div className="zs-card-meta">
                          <span className="zs-card-meta-item">
                            <AppstoreOutlined />
                            <strong>{total}</strong>
                            <span className="zs-card-meta-mute">tasks</span>
                          </span>
                          <span className="zs-card-meta-item">
                            <TeamOutlined />
                            <strong>{project?.members?.length || 0}</strong>
                            <span className="zs-card-meta-mute">members</span>
                          </span>
                        </div>

                        <Avatar.Group
                          size={28}
                          max={{
                            count: 3,
                            style: {
                              color: 'var(--text-slate-700)',
                              backgroundColor: 'var(--bg-slate-100)',
                              fontSize: 11,
                              fontWeight: 700,
                              border: '2px solid var(--bg-pure-white)',
                            },
                          }}
                        >
                          {project?.members?.map((member: any, idx: number) => (
                            <Tooltip title={member?.user?.name} key={idx}>
                              <Avatar
                                src={member?.user?.avatar}
                                style={{
                                  backgroundColor: '#64748b',
                                  border: '2px solid var(--bg-pure-white)',
                                }}
                              >
                                {member?.user?.name?.[0]?.toUpperCase()}
                              </Avatar>
                            </Tooltip>
                          ))}
                        </Avatar.Group>
                      </div>

                      <span className="zs-card-arrow" aria-hidden>
                        <ArrowRightOutlined />
                      </span>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </section>
      </div>

      {/* No JS interpolation here — relies on CSS variables set on elements above */}
      <style>{`
        .zs-projects-shell {
          margin: 0 -40px;
          padding: 40px 40px 64px 40px;
          min-height: calc(100vh - 64px);
          background:
            radial-gradient(1200px 600px at 100% -200px, var(--bg-blue-50), transparent 60%),
            radial-gradient(900px 500px at -200px 100%, var(--bg-purple-50), transparent 55%),
            var(--bg-pure-white);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Hero */
        .zs-hero {
          max-width: 1280px;
          margin: 0 auto 32px auto;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .zs-hero-text { flex: 1 1 auto; min-width: 280px; }
        .zs-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-slate-600);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          margin-bottom: 12px;
        }
        .zs-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 999px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        }
        .zs-hero-title.ant-typography {
          margin: 0;
          font-weight: 800;
          font-size: 40px;
          line-height: 1.1;
          letter-spacing: -0.035em;
          color: var(--text-primary);
        }
        .zs-hero-sub.ant-typography {
          margin: 8px 0 0 0;
          max-width: 560px;
          font-size: 15px;
          line-height: 1.55;
          color: var(--text-secondary);
        }
        .zs-hero-cta { flex: 0 0 auto; }
        .zs-cta-btn.ant-btn {
          height: 44px;
          padding: 0 20px;
          border-radius: 10px;
          font-weight: 600;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border: none;
        }
        .zs-cta-btn.ant-btn:hover { filter: brightness(1.05); }

        /* Stats */
        .zs-stats {
          max-width: 1280px;
          margin: 0 auto 32px auto;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 900px) {
          .zs-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .zs-stat {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .zs-stat:hover { border-color: var(--text-slate-400); }
        .zs-stat-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .zs-stat-icon.tint-blue    { background: #eff6ff; color: #2563eb; }
        .zs-stat-icon.tint-emerald { background: #ecfdf5; color: #059669; }
        .zs-stat-icon.tint-violet  { background: #f5f3ff; color: #7c3aed; }
        .zs-stat-icon.tint-amber   { background: #fff7ed; color: #d97706; }
        .zs-stat-label {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 600;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .zs-stat-value {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1;
        }

        /* Toolbar */
        .zs-toolbar {
          max-width: 1280px;
          margin: 0 auto 24px auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .zs-pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .zs-pill {
          appearance: none;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-color);
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-600);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .zs-pill:hover { color: var(--text-primary); border-color: var(--text-slate-400); }
        .zs-pill.is-active {
          background: var(--text-primary);
          color: var(--bg-pure-white);
          border-color: var(--text-primary);
        }

        .zs-toolbar-right { display: flex; align-items: center; gap: 12px; }
        .zs-search.ant-input-affix-wrapper {
          width: 320px;
          height: 44px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          padding: 0 14px;
        }
        .zs-search.ant-input-affix-wrapper:hover,
        .zs-search.ant-input-affix-wrapper-focused {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
        .zs-sort-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-pure-white);
          color: var(--text-slate-700);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .zs-sort-btn:hover { border-color: var(--text-slate-400); color: var(--text-primary); }

        /* Grid */
        .zs-grid-wrap { max-width: 1280px; margin: 0 auto; }

        /* Card */
        .zs-card {
          position: relative;
          height: 100%;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 22px 22px 20px 22px;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.2s ease, transform 0.2s ease;
          display: flex;
          flex-direction: column;
          min-height: 280px;
        }
        .zs-card:focus-visible {
          outline: none;
          border-color: var(--card-accent-from);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
        }
        .zs-card:hover {
          transform: translateY(-3px);
          border-color: var(--card-accent-from);
        }
        .zs-card-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--card-accent-from), var(--card-accent-to));
          opacity: 0.85;
        }

        .zs-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .zs-card-id {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        .zs-card-mark {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.04em;
          background: linear-gradient(135deg, var(--card-accent-from), var(--card-accent-to));
          flex-shrink: 0;
        }
        .zs-card-id-text { min-width: 0; flex: 1; }
        .zs-card-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .zs-card-code {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-500);
          margin-top: 3px;
          letter-spacing: 0.02em;
        }

        .zs-card-head-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .zs-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          background: var(--bg-slate-100);
          color: var(--text-slate-700);
          border: 1px solid var(--border-slate-200);
        }
        .zs-status-dot {
          width: 6px; height: 6px; border-radius: 999px;
          background: var(--text-slate-400);
        }
        .zs-status-active { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
        .zs-status-active .zs-status-dot { background: #10b981; }
        .zs-status-paused { background: #fff7ed; color: #b45309; border-color: #fed7aa; }
        .zs-status-paused .zs-status-dot { background: #f59e0b; }
        .zs-status-completed { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .zs-status-completed .zs-status-dot { background: #3b82f6; }

        .zs-card-delete.ant-btn { border-radius: 8px; }

        .zs-card-desc {
          font-size: 13.5px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 18px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .zs-card-progress { margin-bottom: 18px; }
        .zs-card-progress-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .zs-card-progress-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .zs-card-progress-pct {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .zs-card-progress-track {
          height: 6px;
          background: var(--bg-slate-100);
          border-radius: 999px;
          overflow: hidden;
        }
        .zs-card-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--card-accent-from), var(--card-accent-to));
          border-radius: 999px;
          transition: width 0.4s ease;
        }

        .zs-card-foot {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .zs-card-meta {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .zs-card-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: var(--text-slate-600);
        }
        .zs-card-meta-item .anticon { color: var(--text-slate-400); }
        .zs-card-meta-item strong { color: var(--text-primary); font-weight: 700; }
        .zs-card-meta-mute { color: var(--text-slate-500); }

        .zs-card-arrow {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 28px; height: 28px;
          border-radius: 999px;
          display: flex; align-items: center; justify-content: center;
          color: var(--card-accent-text);
          background: var(--card-accent-soft);
          opacity: 0;
          transform: translate(-6px, 0);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .zs-card:hover .zs-card-arrow {
          opacity: 1;
          transform: translate(0, 0);
        }

        /* Skeleton */
        .zs-skeleton {
          height: 280px;
          border-radius: 18px;
          border: 1px solid var(--border-color);
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
          border: 1px dashed var(--border-color);
          border-radius: 18px;
          padding: 72px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .zs-empty-icon {
          width: 64px; height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #eff6ff, #f5f3ff);
          color: #6366f1;
          font-size: 28px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .zs-empty-title { font-size: 18px; color: var(--text-primary); margin-bottom: 6px; }
        .zs-empty-sub { color: var(--text-secondary); font-size: 14px; max-width: 420px; }
        .zs-empty-cta.ant-btn {
          margin-top: 20px;
          height: 40px;
          border-radius: 10px;
          font-weight: 600;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border: none;
        }
      `}</style>
    </MainLayout>
  );
}

function StatTile({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: 'blue' | 'emerald' | 'violet' | 'amber';
}) {
  return (
    <div className="zs-stat">
      <div className={`zs-stat-icon tint-${tint}`}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div className="zs-stat-label">{label}</div>
        <div className="zs-stat-value">{value}</div>
      </div>
    </div>
  );
}

export default function ProjectSelectPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              background: 'var(--bg-pure-white)',
            }}
          >
            <Spin size="large" tip="Loading Zukvo..." />
          </div>
        </MainLayout>
      }
    >
      <ProjectSelectContent />
    </Suspense>
  );
}
