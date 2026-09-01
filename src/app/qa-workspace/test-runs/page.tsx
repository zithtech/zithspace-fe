"use client";
import NoData from "@/components/common/NoData";
import React, { Suspense, useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Progress, message, Input, Drawer, Select, Typography, Tooltip, Popover, Space, Segmented, Divider } from "antd";
import { PlusOutlined, PlayCircleOutlined, CheckCircleOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, SnippetsOutlined, CloseOutlined, FilterOutlined, ExpandAltOutlined, ReloadOutlined, ApartmentOutlined, ThunderboltOutlined, CopyOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { PlayCircle, Target, Activity, Trash2, Layers } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios, apiClient } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import ZukvoLoader, { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import dayjs from "dayjs";
import { useDebounce } from "@/hooks/useDebounce";
import { useQaProject, QaProjectPicker, QaProjectSwitcher } from "@/components/qa/QaProjectGate";
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import TestRunFilters from "./TestRunFilters";

const { Text } = Typography;

const PROGRESS_OPTIONS = [
  { value: 'notStarted', label: 'Not started' },
  { value: 'active', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

const CARD_ACCENTS = [
  ['#3b82f6', '#1d4ed8'],
  ['#10b981', '#047857'],
  ['#8b5cf6', '#6d28d9'],
  ['#f59e0b', '#b45309']
];

function accentFor(str: string) {
  const h = Math.abs(hashCode(str || 'default'));
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
}

function initialsOf(name: string) {
  if (!name) return 'TR';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function TestRunsContent() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestRuns" });

  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  
  const [runs, setRuns] = useState<any[]>([]);
  const [suites, setSuites] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  /** Scopes a run can be attributed to, so QA Submissions can find it later. */
  const [scopes, setScopes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [suiteFilter, setSuiteFilter] = useState<string | undefined>();
  const [progressFilter, setProgressFilter] = useState<string | undefined>();
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  /* Runs are read inside one project, the way the Bug List works — the choice
     is remembered and shared with the other QA Space lists. */
  const {
    projects: projectOptions,
    loading: loadingProjects,
    ready: projectReady,
    projectId: selectedProjectId,
    setProjectId,
  } = useQaProject();
  const projectFilter = selectedProjectId || undefined;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<any>({});

  // For dynamic suite search beyond the initial 1000
  const [suiteSearchTerm, setSuiteSearchTerm] = useState("");
  const debouncedSuiteSearch = useDebounce(suiteSearchTerm, 500);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, suiteFilter, progressFilter, moduleFilter, projectFilter]);
  
  useEffect(() => {
    if (!debouncedSuiteSearch || debouncedSuiteSearch.trim().length < 2) return;
    const searchSuites = async () => {
      try {
        const res = await axios.get("/api/v2/qa/suites/all", {
          params: { search: debouncedSuiteSearch, limit: 50, project_id: projectFilter }
        });
        const fetched = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setSuites((prev: any[]) => {
          const map = new Map(prev.map(s => [s.id, s]));
          fetched.forEach((s: any) => map.set(s.id, s));
          return Array.from(map.values());
        });
      } catch (e) {}
    };
    searchSuites();
  }, [debouncedSuiteSearch, projectFilter]);
  
  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const filteredSuites = useMemo(() => {
    if (!formData?.module_id) return suites;
    return suites.filter((s: any) => s.parent_test_case_id === formData.module_id);
  }, [suites, formData?.module_id]);

  /** The suite chosen in the create drawer, for the coverage preview. */
  const selectedSuite = useMemo(
    () => suites.find((s: any) => s.id === formData?.suite_id),
    [suites, formData?.suite_id]
  );
  const selectedSuiteCases = parseInt(selectedSuite?.case_count || '0', 10) || 0;

  const { canReadRun, canCreateRun, canUpdateRun, canDeleteRun } = usePermission();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [runsRes, suitesRes, modRes, scopeRes] = await Promise.all([
        apiClient.get("/api/v2/qa/runs/all", {
          params: {
            page,
            pageSize,
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
            ...(suiteFilter ? { suite_id: suiteFilter } : {}),
            ...(progressFilter ? { progress: progressFilter } : {}),
            ...(moduleFilter ? { module_id: moduleFilter } : {}),
            project_id: projectFilter || undefined,
            allowed_projects: projectOptions.length > 0 ? projectOptions.map(p => p.value).join(',') : undefined
          }
        }),
        axios.get("/api/v2/qa/suites/all", { params: { limit: 1000, project_id: projectFilter } }),
        axios.get("/api/v2/qa/parents", { params: { limit: 1000, project_id: projectFilter } }),
        // The scopes endpoint paginates on pageSize, not limit — without it we'd only get 10.
        // Scopes are keyed by project *name*, not id.
        axios.get("/api/v2/qa/test-scopes", {
          params: {
            pageSize: 1000,
            product: projectOptions.find(pj => pj.value === projectFilter)?.label || undefined,
          },
        }),
      ]);
      const body = (runsRes as any).data;
      setRuns(body?.data || []);
      setTotalItems(body?.pagination?.total || 0);
      setStats(body?.stats || {});
      setSuites(Array.isArray(suitesRes) ? suitesRes : (suitesRes?.data?.data || suitesRes?.data || []));
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
      setScopes(Array.isArray(scopeRes) ? scopeRes : (scopeRes?.data?.data || scopeRes?.data || []));
    } catch (error) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    /* Nothing is worth fetching until a project is chosen — an unscoped list
       is exactly what this page moved away from. */
    if (canReadRun && projectFilter) {
      fetchData();
    }
  }, [canReadRun, projectFilter, page, pageSize, debouncedSearch, suiteFilter, progressFilter, moduleFilter]);

  /** Switching project drops filters that name things from the old one. */
  const chooseProject = (id: string | null) => {
    setProjectId(id);
    setSuiteFilter(undefined);
    setModuleFilter(undefined);
    setProgressFilter(undefined);
    setSearchTerm('');
    setPage(1);
  };

  const openCreateModal = () => {
    setFormData({});
    setModalOpen(true);
  };

  const handleCreateRun = async () => {
    try {
      if (!formData.run_name) return message.error("Run Name is required");
      if (!formData.scope_id) return message.error("Test Scope is required");
      if (!formData.suite_id) return message.error("Test Suite is required");

      setSaving(true);
      await axios.post("/api/v2/qa/runs", formData);
      message.success("Test Run created successfully");
      setModalOpen(false);
      fetchData();
    } catch (error) {
      message.error("Failed to create test run");
    } finally {
      setSaving(false);
    }
  };

  /** Execution now lives on its own page, so results survive a refresh. */
  const openExecuteDrawer = (record: any) => {
    router.push(`/qa-workspace/test-runs/${record.id}`);
  };

  const handleDeleteRun = async (id: string) => {
    try {
      await axios.delete(`/api/v2/qa/runs/${id}`);
      message.success("Test Run deleted");
      fetchData();
    } catch (error) {
      message.error("Failed to delete run");
    }
  };

  if (!canReadRun) return null;

  /** Which progress bucket a run falls into. */
  const runState = (r: any) => {
    const total = parseInt(r.total_cases) || 0;
    const executed = total - (parseInt(r.not_executed_count) || 0);
    if (!total || executed === 0) return 'notStarted';
    return executed >= total ? 'completed' : 'active';
  };

  const filteredRuns = runs; // Data is already filtered by backend

  const suiteFilterOptions = suites.map(s => ({ value: s.id, label: s.suite_name }));

  const moduleFilterOptions = modules.map(m => ({ value: m.id, label: m.module_name || m.name || "Unnamed Module" }));
  const selectedSuiteLabel = suiteFilterOptions.find(o => o.value === suiteFilter)?.label;

  /* ── Banner figures ───────────────────────────────────────────────────
     The Ticket List's sprint head reads a sprint's completion; here the same
     three rows read execution — how much of the plan has actually been run. */
  const projectName = projectOptions.find(p => p.value === selectedProjectId)?.label;
  const activeRuns = stats?.activeRuns || 0;
  const completedRuns = stats?.completedRuns || 0;
  const executedCases = stats?.totalExecutedCases || 0;
  const completedPct = totalItems > 0 ? Math.round((completedRuns / totalItems) * 100) : 0;
  const bannerAccent = completedPct >= 80 ? '#10b981' : activeRuns > 0 ? '#3b82f6' : '#64748b';

  const activeFilterCount =
    (searchTerm.trim() ? 1 : 0) + (suiteFilter ? 1 : 0) + (progressFilter ? 1 : 0) + (moduleFilter ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setSuiteFilter(undefined);
    setProgressFilter(undefined);
    setModuleFilter(undefined);
  };

  // Client-side pagination variables are now derived from totalItems for the footer
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, totalItems);
  const pagedRuns = runs;


  const suiteNameOf = (record: any) => {
    const suite = suites.find(s => s.id === record.suite_id);
    return record.suite_name || suite?.suite_name || 'Unassigned';
  };

  const moduleNameOf = (record: any) => {
    const suite = suites.find(s => s.id === record.suite_id);
    const mod = modules.find(m => m.id === suite?.parent_test_case_id);
    return mod?.name || mod?.title || 'Unassigned';
  };

  /** Executed vs total for a run, plus the derived percentage. */
  const progressOf = (record: any) => {
    const total = parseInt(record.total_cases) || 0;
    const executed = total - (parseInt(record.not_executed_count) || 0);
    return { total, executed, percent: total > 0 ? Math.round((executed / total) * 100) : 0 };
  };

  /* Columns mirror the Ticket List: a copyable ID, the title, then the
     one-glance attributes, with row actions pinned to the right. */
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 118,
      render: (id: string) => (
        <span
          className="pp-run-id"
          onClick={(e) => { e.stopPropagation(); router.push(`/qa-workspace/test-runs/${id}`); }}
          title={id}
        >
          {String(id || '').slice(0, 8).toUpperCase()}
          <CopyOutlined
            style={{ fontSize: 10, opacity: 0.6 }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(id);
              message.success("Run ID copied!");
            }}
          />
        </span>
      ),
    },
    {
      title: "Title",
      dataIndex: "run_name",
      key: "run_name",
      width: 280,
      ellipsis: true,
      render: (t: string) => (
        <div className="pp-name-cell" title={t || 'Untitled run'}>
          <span className="pp-name-icon"><PlayCircle size={13} /></span>
          <span className="pp-name-title">{t || 'Untitled run'}</span>
        </div>
      )
    },
    {
      title: "State",
      key: "state",
      width: 140,
      render: (_: any, record: any) => {
        const { total, executed, percent } = progressOf(record);
        const meta = (!total || executed === 0)
          ? { label: 'Not started', color: '#64748b' }
          : percent === 100
            ? { label: 'Completed', color: '#10b981' }
            : { label: 'In progress', color: '#3b82f6' };
        return (
          <span className="pp-vis-pill" style={{ color: meta.color, background: `${meta.color}1A`, borderColor: `${meta.color}40` }}>
            <span className="pp-vis-dot" style={{ background: meta.color }} />
            {meta.label}
          </span>
        );
      }
    },
    {
      title: "Progress",
      key: "progress",
      width: 200,
      render: (_: any, record: any) => {
        const { total, executed, percent } = progressOf(record);
        if (!total) return <span className="sc-muted">No cases</span>;
        return (
          <div className="rn-progress">
            <div className="rn-progress__bar">
              <span className={percent === 100 ? 'is-done' : ''} style={{ width: `${percent}%` }} />
            </div>
            <span className="rn-progress__label">{executed}/{total}</span>
          </div>
        );
      }
    },
    {
      title: "Suite",
      key: "suite",
      width: 200,
      ellipsis: true,
      render: (_: any, record: any) => (
        <span className="pp-vis-pill pp-vis-pill--ash">{suiteNameOf(record)}</span>
      )
    },
    {
      title: "Module",
      key: "module",
      width: 170,
      ellipsis: true,
      render: (_: any, record: any) => (
        <span className="pp-vis-pill pp-vis-pill--ash">{moduleNameOf(record)}</span>
      )
    },
    {
      title: "Cases",
      key: "cases",
      width: 84,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const n = parseInt(record.total_cases) || 0;
        return <span className={`pp-count${n === 0 ? ' is-zero' : ''}`}>{n}</span>;
      }
    },
    {
      title: "Started",
      dataIndex: "started_at",
      key: "started_at",
      width: 150,
      render: (t: string) => (
        <span className="sc-timeline__range">{t ? dayjs(t).format("D MMM, HH:mm") : '—'}</span>
      )
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      align: "right" as const,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <div className="sc-rowactions" onClick={e => e.stopPropagation()}>
          <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => openExecuteDrawer(record)} className="rn-exec">
            {canUpdateRun ? 'Execute' : 'View'}
          </Button>
          {canDeleteRun && (
            <ConfirmDialog
              tone="danger"
              title="Delete Test Run?"
              description="Are you sure you want to delete this test run and all its execution records?"
              confirmText="Delete"
              onConfirm={() => handleDeleteRun(record.id)}
            >
              <Tooltip title="Delete">
                <button className="is-danger" onClick={(e) => e.stopPropagation()} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </Tooltip>
            </ConfirmDialog>
          )}
        </div>
      )
    }
  ];

  /** One empty state for the table and the card grid, on the shared NoData
      illustration so every list reads the same when it has nothing to show. */
  const renderEmpty = () => (
    <NoData
      description={
        <div className="sc-empty">
          <SnippetsOutlined className="sc-empty__icon" />
          <p className="sc-empty__title">{activeFilterCount > 0 ? 'No runs match these filters' : 'No test runs yet'}</p>
          <p className="sc-empty__desc">
            {activeFilterCount > 0
              ? 'Try widening your search or clearing the filters.'
              : 'Create a run to execute a suite and record pass/fail results.'}
          </p>
          {activeFilterCount > 0
            ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
            : canCreateRun && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreateModal}>Create Test Run</Button>}
        </div>
      }
    />
  );

  const renderRunCard = (r: any) => {
    const accent = accentFor(r.run_name || r.id);
    const suite = suites.find(s => s.id === r.suite_id);
    const suiteName = r.suite_name || suite?.suite_name || 'Unassigned';
    
    const total = parseInt(r.total_cases) || 0;
    const executed = total - (parseInt(r.not_executed_count) || 0);
    const percent = total > 0 ? Math.round((executed / total) * 100) : 0;

    return (
      <div key={r.id} className="pc-card" onClick={() => openExecuteDrawer(r)}>
        <div className="pc-top">
          <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
            {initialsOf(r.run_name)}
          </div>
          <div className="pc-identity-body">
            <div className="pc-title">{r.run_name}</div>
            <div className="pc-client-line">
              <span className="pc-client-key">Suite:</span>
              <span className="pc-client-val">{suiteName}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
            {canDeleteRun && (
              <ConfirmDialog
                tone="danger"
                title="Delete Test Run?"
                description="Are you sure you want to delete this test run and all its execution records?"
                confirmText="Delete"
                onConfirm={() => handleDeleteRun(r.id)}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<Trash2 size={15} />}
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  title="Delete Test Run"
                />
              </ConfirmDialog>
            )}
          </div>
        </div>

        <div style={{ padding: '4px 16px 12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-slate-500)', marginBottom: 4 }}>
            <span>Execution Progress</span>
            <strong style={{ color: 'var(--text-slate-800)' }}>{executed} / {total} Cases ({percent}%)</strong>
          </div>
          <Progress percent={percent} size="small" showInfo={false} />
        </div>

        <div className="pc-foot">
          <div className="pc-foot-row" style={{ justifyContent: 'space-between' }}>
            <span className="pc-foot-item">
              <span className="pc-foot-key">Module:</span>
              <Tag color="purple" style={{ margin: 0 }}>
                {(() => {
                  const s = suites.find(suite => suite.id === r.suite_id);
                  const mod = modules.find(m => m.id === s?.parent_test_case_id);
                  return mod?.name || mod?.title || 'Unassigned';
                })()}
              </Tag>
            </span>
            <span className="pc-foot-item">
              <span className="pc-foot-key">Started:</span>
              <span className="pc-foot-val">{r.started_at ? dayjs(r.started_at).format("MMM DD, HH:mm") : '—'}</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: RUNS_PAGE_STYLES }} />

      <div className="tl-shell-wrap">
        <div className="tl-shell">
          <div className="tl-main">

            {/* ── Header row — project, search, filters, view controls ───── */}
            <div className="saas-header-container sc-header">
              <QaProjectSwitcher
                projects={projectOptions}
                value={selectedProjectId}
                onChange={chooseProject}
                loading={loadingProjects}
              />

              <Divider type="vertical" style={{ height: 24, margin: 0, opacity: 0.5 }} />

              <div className="sc-header-controls">
                <Input
                  placeholder="Quick search runs, suites..."
                  prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />}
                  className="saas-input"
                  style={{ maxWidth: 240, borderRadius: 8, height: 30, background: 'transparent', fontSize: 12 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!projectFilter}
                  allowClear
                />

                <Space.Compact className="ticket-filter-group">
                  <Popover
                    content={
                      <TestRunFilters
                        filters={{ suiteFilter, moduleFilter, progressFilter }}
                        onFilterChange={(key, val) => {
                          if (key === 'suiteFilter') setSuiteFilter(val || undefined);
                          if (key === 'moduleFilter') setModuleFilter(val || undefined);
                          if (key === 'progressFilter') setProgressFilter(val || undefined);
                        }}
                        onReset={clearFilters}
                        suiteOptions={suiteFilterOptions}
                        moduleOptions={moduleFilterOptions}
                        progressOptions={PROGRESS_OPTIONS}
                        onSuiteSearch={setSuiteSearchTerm}
                      />
                    }
                    trigger="click"
                    open={isFilterPanelOpen}
                    onOpenChange={setIsFilterPanelOpen}
                    placement="bottomLeft"
                    overlayClassName="tf-popover-overlay"
                    styles={{ body: { padding: 0 } }}
                  >
                    <Button
                      icon={<FilterOutlined />}
                      disabled={!projectFilter}
                      className={activeFilterCount > 0 ? 'saas-tag-blue' : ''}
                      style={{ height: 30, fontWeight: 600, fontSize: 12 }}
                    >
                      Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                  </Popover>
                  <Button
                    icon={<ExpandAltOutlined />}
                    style={{ height: 30 }}
                    disabled={!projectFilter}
                    aria-label="Expand filters"
                    onClick={() => setIsFilterRowOpen(prev => !prev)}
                  />
                </Space.Compact>
              </div>

              {/* Right side — the progress switch that used to live in the
                  rail, then the view controls. */}
              <Space size={10} className="sc-header-right">
                <Segmented
                  className="saas-segmented-premium sc-owner-seg"
                  value={progressFilter || 'any'}
                  onChange={(v) => setProgressFilter(v === 'any' ? undefined : String(v))}
                  options={[
                    {
                      value: 'any',
                      label: (
                        <span className="sc-owner-opt">
                          <Layers size={13} />
                          <span className="sc-owner-opt__label">All Runs</span>
                          <span className="sc-owner-opt__count">{totalItems}</span>
                        </span>
                      ),
                    },
                    {
                      value: 'active',
                      label: (
                        <span className="sc-owner-opt">
                          <Activity size={13} />
                          <span className="sc-owner-opt__label">In Progress</span>
                          <span className="sc-owner-opt__count">{activeRuns}</span>
                        </span>
                      ),
                    },
                    {
                      value: 'completed',
                      label: (
                        <span className="sc-owner-opt">
                          <CheckCircleOutlined style={{ fontSize: 12 }} />
                          <span className="sc-owner-opt__label">Completed</span>
                          <span className="sc-owner-opt__count">{completedRuns}</span>
                        </span>
                      ),
                    },
                    {
                      value: 'notStarted',
                      label: (
                        <span className="sc-owner-opt">
                          <PlayCircle size={13} />
                          <span className="sc-owner-opt__label">Not Started</span>
                        </span>
                      ),
                    },
                  ]}
                />

                <Segmented
                  className="saas-segmented-premium"
                  value={viewMode}
                  onChange={(v) => setViewMode(v as 'list' | 'grid')}
                  options={[
                    {
                      value: 'list',
                      label: (
                        <Tooltip title="List View" mouseEnterDelay={0.5}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}>
                            <UnorderedListOutlined style={{ fontSize: 13 }} />
                          </span>
                        </Tooltip>
                      )
                    },
                    {
                      value: 'grid',
                      label: (
                        <Tooltip title="Grid View" mouseEnterDelay={0.5}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}>
                            <AppstoreOutlined style={{ fontSize: 13 }} />
                          </span>
                        </Tooltip>
                      )
                    },
                  ]}
                />

                <Tooltip title="Refresh view">
                  <Button
                    icon={<ReloadOutlined spin={loading} />}
                    onClick={fetchData}
                    disabled={loading || !projectFilter}
                    style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </Tooltip>

                {canCreateRun && projectFilter && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreateModal}
                    style={{ height: 36, borderRadius: 8, fontWeight: 700 }}
                    data-tour="test-runs"
                  >
                    Create Test Run
                  </Button>
                )}
              </Space>
            </div>

            {/* ── Inline filter row — the pill strip the Ticket List uses ── */}
            {isFilterRowOpen && projectFilter && (
              <div className="tl-filter-row">
                <div className="tl-filter-row-label">
                  <FilterOutlined style={{ fontSize: 11 }} />
                  <span>Filters</span>
                  <span className="tl-filter-row-count">{activeFilterCount > 0 ? activeFilterCount : '0'}</span>
                </div>
                <div className="tl-filter-row-pills">
                  <TicketFilterPill
                    icon={<AppstoreOutlined style={{ fontSize: 11 }} />}
                    label="Suite"
                    value={suiteFilter || ""}
                    options={suiteFilterOptions}
                    onChange={(val) => setSuiteFilter(val || undefined)}
                    onSearch={setSuiteSearchTerm}
                    itemNoun="suites"
                    width={280}
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<ApartmentOutlined style={{ fontSize: 11 }} />}
                    label="Module"
                    value={moduleFilter || ""}
                    options={moduleFilterOptions}
                    onChange={(val) => setModuleFilter(val || undefined)}
                    itemNoun="modules"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<ThunderboltOutlined style={{ fontSize: 11 }} />}
                    label="Progress"
                    value={progressFilter || ""}
                    options={PROGRESS_OPTIONS}
                    onChange={(val) => setProgressFilter(val || undefined)}
                    itemNoun="states"
                    multiple={false}
                  />
                </div>
                <div className="tl-filter-row-actions">
                  {activeFilterCount > 0 && (
                    <button type="button" className="tl-filter-row-reset" onClick={clearFilters}>
                      <ReloadOutlined style={{ fontSize: 10 }} />
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    className="tl-filter-row-close"
                    onClick={() => setIsFilterRowOpen(false)}
                    aria-label="Close filters"
                    title="Close filters"
                  >
                    <CloseOutlined style={{ fontSize: 10 }} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Body ───────────────────────────────────────────────────── */}
            {!projectFilter ? (
              /* Until the project is known there are no runs, stats or filters
                 worth showing — the picker takes the whole area. */
              <div className="sc-pickerwrap">
                {!projectReady ? (
                  /* Reading the remembered project — showing the picker first
                     would flash it away a frame later. */
                  <ZukvoLoader size="md" message="Loading projects…" />
                ) : (
                  <QaProjectPicker
                    projects={projectOptions}
                    loading={loadingProjects}
                    onChoose={chooseProject}
                    subtitle="Test runs are executed inside a project. Pick one to open its runs."
                  />
                )}
              </div>
            ) : (
              <div className="tl-section">
                {/* ── Overview banner — the Ticket List's sprint head, reading
                     execution instead: how much of the plan has been run. ── */}
                <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
                  <div className="tl-sprint-row1">
                    <div className="tl-sprint-title-block">
                      <span
                        className="tl-sprint-dot"
                        style={{ background: bannerAccent, boxShadow: `0 0 0 3px ${bannerAccent}33` }}
                      />
                      <Text
                        className="tl-sprint-title"
                        ellipsis={{ tooltip: `${projectName || 'Project'} — All Test Runs` }}
                      >
                        {projectName || 'Project'} — All Test Runs
                      </Text>
                      <span className="tl-sprint-tags">
                        <span className="tl-sprint-tag tl-sprint-tag-active">{totalItems} RUNS</span>
                        {activeRuns > 0 && (
                          <span className="tl-sprint-tag tl-sprint-tag-running">{activeRuns} RUNNING</span>
                        )}
                        {selectedSuiteLabel && (
                          <span className="tl-sprint-tag tl-sprint-tag-module">{selectedSuiteLabel}</span>
                        )}
                      </span>
                    </div>
                    <div className="tl-sprint-actions">
                      <Button
                        type="default"
                        size="small"
                        icon={<Layers size={13} />}
                        onClick={() => router.push('/qa-workspace/test-suites')}
                        className="saas-button-item tl-sprint-burndown-btn"
                      >
                        Suites{suites.length ? ` (${suites.length})` : ''}
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        icon={<Target size={13} />}
                        onClick={() => router.push('/qa-workspace/coverage-map')}
                        className="saas-button-item tl-sprint-complete-btn"
                      >
                        Coverage Map
                      </Button>
                    </div>
                  </div>

                  <div className="tl-sprint-row2">
                    <span className="tl-sprint-meta">
                      <Layers size={11} />
                      <span>across {suites.length} suites</span>
                    </span>
                    <span className="tl-sprint-meta">
                      <b>{completedRuns}</b>/{totalItems} runs completed
                    </span>
                    <span className="tl-sprint-meta">
                      <b>{activeRuns}</b> partially executed
                    </span>
                    <span className="tl-sprint-meta">
                      <b>{executedCases}</b> case results recorded
                    </span>
                  </div>

                  <div className="tl-sprint-row3">
                    <div className="tl-sprint-progress-bar">
                      <div className="tl-sprint-progress-fill" style={{ width: `${Math.min(100, completedPct)}%` }} />
                    </div>
                    <span className="tl-sprint-progress-pct">{completedPct}%</span>
                  </div>
                </div>

                <div className="tl-section-body">
                  {/* Only the results blur, so the filters above stay usable
                      while a search refetches. */}
                  <ZukvoLoadingOverlay loading={loading} message="Loading test runs…">
                    {viewMode === 'list' ? (
                      <div className="pp-table-wrap">
                        <Table
                          className="saas-table tl-table pp-table"
                          dataSource={pagedRuns}
                          columns={columns}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          scroll={{ x: 'max-content' }}
                          onRow={(record) => ({
                            className: 'pp-row',
                            onClick: (e) => {
                              const t = e.target as HTMLElement;
                              if (t.closest('button, a, .ant-dropdown-trigger, .sc-rowactions, .pp-run-id')) return;
                              openExecuteDrawer(record);
                            },
                          })}
                          locale={{
                            /* Holding the height beats claiming "no runs" mid-fetch. */
                            emptyText: loading ? <div style={{ minHeight: 240 }} /> : renderEmpty()
                          }}
                        />
                      </div>
                    ) : (
                      <div className="sc-gridwrap">
                        <div className="pp-grid">
                          {loading ? null : filteredRuns.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1' }}>{renderEmpty()}</div>
                          ) : (
                            pagedRuns.map(r => renderRunCard(r))
                          )}
                        </div>
                      </div>
                    )}
                  </ZukvoLoadingOverlay>

                  {/* Pager sits outside the scroll area so it stays pinned to
                      the bottom of the pane whether or not the list overflows. */}
                  {filteredRuns.length > 0 && (
                    <div className="pp-footer">
                      <div className="pp-footer-info">
                        Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{totalItems}</strong>
                      </div>
                      <div className="pp-pager">
                        <button type="button" className="pp-pager-btn" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
                        {Array.from({ length: pageCount }, (_, i) => i + 1)
                          .slice(Math.max(0, safePage - 3), Math.max(0, safePage - 3) + 5)
                          .map((p) => (
                            <button key={p} type="button" className={`pp-pager-num ${p === safePage ? 'is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                          ))}
                        <button type="button" className="pp-pager-btn" disabled={safePage >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p + 1))}>›</button>
                        <Select
                          className="pp-pagesize"
                          value={pageSize}
                          onChange={(v) => { setPageSize(v); setPage(1); }}
                          options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                          popupMatchSelectWidth={120}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Test Run Drawer */}
      <Drawer
        {...commonDrawerProps}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        width={520}
      >
        <div className="rd">
          <div className="rd__head">
            <span className="rd__icon"><PlayCircleOutlined /></span>
            <div className="rd__headtext">
              <h3 className="rd__title">Create Test Run</h3>
              <span className="rd__sub">Pick a suite to execute — every case in it gets a result to record</span>
            </div>
            <button className="rd__close" onClick={() => setModalOpen(false)} aria-label="Close"><CloseOutlined /></button>
          </div>

          <div className="rd__body">
            <div className="rd__field">
              <label className="rd__label">Run Name <span className="rd__req">*</span></label>
              <Input
                placeholder="E.g. Release v2.1 Smoke"
                value={formData.run_name}
                onChange={(e) => setFormData({ ...formData, run_name: e.target.value })}
                autoFocus
              />
              <p className="rd__hint">Name it after what you&apos;re validating, so results stay easy to find later.</p>
            </div>

            <div className="rd__field">
              <label className="rd__label">Test Scope <span className="rd__req">*</span></label>
              <SearchableDropdown
                options={scopes.map(s => ({
                  value: s.id,
                  label: s.name,
                  description: [s.type, s.status].filter(Boolean).join(' · '),
                }))}
                value={formData.scope_id}
                onChange={(val) => setFormData({ ...formData, scope_id: val })}
                placeholder="Select the scope this run covers"
                itemNoun="scopes"
                className="rd__control"
              />
              <p className="rd__hint">
                Every run belongs to a scope — it&apos;s what lets a QA Submission report this run as evidence.
              </p>
            </div>

            <div className="rd__field">
              <label className="rd__label">Module</label>
              <SearchableDropdown
                options={modules.map(m => ({ value: m.id, label: m.name || m.title || "Unnamed Module" }))}
                value={formData.module_id}
                onChange={(val) => setFormData({ ...formData, module_id: val, suite_id: undefined })}
                placeholder="All modules"
                itemNoun="modules"
                className="rd__control"
              />
              <p className="rd__hint">Optional — narrows the suite list below.</p>
            </div>

            <div className="rd__field">
              <label className="rd__label">Suite <span className="rd__req">*</span></label>
              <SearchableDropdown
                options={filteredSuites.map(s => ({
                  value: s.id,
                  label: s.suite_name,
                  description: s.case_count ? `${s.case_count} case${Number(s.case_count) === 1 ? '' : 's'}` : 'No cases linked',
                }))}
                value={formData.suite_id}
                onChange={(val) => setFormData({ ...formData, suite_id: val })}
                onSearch={(val) => setSuiteSearchTerm(val)}
                placeholder={filteredSuites.length ? "Select a suite to execute" : "No suites in this module"}
                itemNoun="suites"
                className="rd__control"
              />
            </div>

            {/* What this run will cover, once a suite is chosen */}
            {selectedSuite && (
              <div className="rd__preview">
                <span className="rd__preview-key">This run will execute</span>
                <div className="rd__preview-row">
                  <span className="rd__preview-count">{selectedSuiteCases}</span>
                  <span className="rd__preview-label">
                    case{selectedSuiteCases === 1 ? '' : 's'} from <strong>{selectedSuite.suite_name}</strong>
                  </span>
                </div>
                {selectedSuiteCases === 0 && (
                  <p className="rd__preview-warn">This suite has no linked cases — link some before running it.</p>
                )}
              </div>
            )}
          </div>

          <div className="rd__foot">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={saving}
              icon={<PlayCircleOutlined />}
              disabled={!formData.run_name?.trim() || !formData.scope_id || !formData.suite_id}
              onClick={handleCreateRun}
            >
              Start Run
            </Button>
          </div>
        </div>
      </Drawer>

    </MainLayout>
  );
}

export default function TestRunsPage() {
  return (
    <Suspense fallback={<ZukvoLoader size="lg" fullscreen message="Loading test runs…" />}>
      <TestRunsContent />
    </Suspense>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Styles — the Ticket List's shell, header, banner, table and pager, with the
   run-specific cells and the create drawer layered on top.
   ──────────────────────────────────────────────────────────────────────── */
const RUNS_PAGE_STYLES = `
/* ── Shell: one column, no rail ───────────────────────────────────────── */
.tl-shell-wrap {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
}
.tl-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  overflow: hidden;
}
.tl-main {
  min-width: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  overflow: hidden;
}

/* ── Header row ───────────────────────────────────────────────────────── */
.sc-header {
  position: sticky;
  top: 0;
  z-index: 100;
  margin: 0;
  padding: 9.7px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: var(--bg-pure-white);
  border-bottom: 1px solid var(--border-slate-200);
  flex-shrink: 0;
}
.sc-header-controls { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.sc-header-right { flex-shrink: 0; }

.sc-owner-seg .ant-segmented-item-label { padding: 0 4px; }
.sc-owner-opt { display: inline-flex; align-items: center; gap: 6px; height: 100%; }
.sc-owner-opt__label { font-size: 12px; font-weight: 600; white-space: nowrap; }
.sc-owner-opt__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 17px; padding: 0 5px;
  border-radius: 999px; background: var(--bg-slate-100); color: var(--text-slate-500);
  font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
}
.ant-segmented-item-selected .sc-owner-opt__count { background: var(--bg-blue-50); color: #3B82F6; }
[data-theme='dark'] .sc-owner-opt__count { background: #1e293b; color: #94a3b8; }

/* ── Section + scope banner (Ticket List sprint head) ─────────────────── */
.tl-section {
  background: var(--bg-pure-white);
  border-top: 1px solid var(--border-slate-200);
  border-bottom: 1px solid var(--border-slate-200);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
[data-theme='dark'] .tl-section {
  background: transparent;
  border-top-color: #1f2937;
  border-bottom-color: #1f2937;
}
.tl-section-head {
  padding: 6px 12px;
  background: var(--bg-slate-50);
  border-bottom: 1px solid var(--border-slate-200);
  position: relative;
  flex-shrink: 0;
}
[data-theme='dark'] .tl-section-head {
  background: #0f1419;
  border-bottom-color: #1f2937;
}
.tl-section-body {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
/* The loading overlay is a plain wrapper — it has to grow like the table would. */
.tl-section-body > .zlo,
.tl-section-body > .zlo > .zlo__content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.tl-sprint-head-v2 { display: flex !important; flex-direction: column; gap: 6px; padding: 10px 12px !important; }
.tl-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.tl-sprint-title-block { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
.tl-sprint-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.tl-sprint-title {
  font-size: 14px !important; font-weight: 800 !important; color: var(--text-slate-900) !important;
  letter-spacing: -0.01em; max-width: 460px;
}
[data-theme='dark'] .tl-sprint-title { color: #f1f5f9 !important; }
.tl-sprint-tags { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
.tl-sprint-tag {
  display: inline-flex; align-items: center; height: 18px; padding: 0 6px;
  font-size: 9px; font-weight: 800; letter-spacing: 0.04em; border-radius: 4px;
  border: 1px solid transparent; text-transform: uppercase; line-height: 1;
}
.tl-sprint-tag-active { background: transparent; color: #10b981; border-color: rgba(16, 185, 129, 0.32); }
.tl-sprint-tag-delayed { background: transparent; color: #ef4444; border-color: rgba(239, 68, 68, 0.32); }
[data-theme='dark'] .tl-sprint-tag-active { color: #34d399; }
[data-theme='dark'] .tl-sprint-tag-delayed { color: #fca5a5; }

.tl-sprint-actions { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; }
.tl-sprint-burndown-btn.ant-btn { height: 28px; font-size: 12px; font-weight: 600; border-radius: 6px; }
.tl-sprint-complete-btn.ant-btn.ant-btn-primary {
  height: 28px; font-size: 12px; font-weight: 700;
  background: #10b981; border-color: #10b981; border-radius: 6px;
}
.tl-sprint-complete-btn.ant-btn.ant-btn-primary:hover {
  background: #059669 !important; border-color: #059669 !important;
}

.tl-sprint-row2 { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding-left: 15px; }
.tl-sprint-meta {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -0.005em;
}
.tl-sprint-meta b { color: var(--text-slate-900); font-weight: 800; }
[data-theme='dark'] .tl-sprint-meta { color: #94a3b8 !important; }
[data-theme='dark'] .tl-sprint-meta b { color: #f1f5f9 !important; }

.tl-sprint-row3 { display: flex; align-items: center; gap: 12px; padding-left: 15px; }
.tl-sprint-progress-bar {
  flex: 1 1 auto; position: relative; height: 6px;
  background: var(--bg-slate-100); border-radius: 999px; overflow: hidden; min-width: 60px;
}
[data-theme='dark'] .tl-sprint-progress-bar { background: #1f2937 !important; }
.tl-sprint-progress-fill {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 999px; transition: width 0.4s ease;
}
.tl-sprint-progress-pct {
  flex-shrink: 0; font-size: 12px; font-weight: 800; color: var(--text-slate-900);
  font-variant-numeric: tabular-nums; min-width: 36px; text-align: right;
}
[data-theme='dark'] .tl-sprint-progress-pct { color: #f1f5f9 !important; }

/* ── Inline filter row ────────────────────────────────────────────────── */
.tl-filter-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px;
  background: var(--bg-slate-50); border-bottom: 1px solid var(--border-slate-200);
  flex-shrink: 0;
}
[data-theme='dark'] .tl-filter-row { background: #0f1419; border-bottom-color: #1f2937; }
.tl-filter-row-label {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 10.5px; font-weight: 800; color: var(--text-slate-500);
  text-transform: uppercase; letter-spacing: 0.08em; flex-shrink: 0;
}
[data-theme='dark'] .tl-filter-row-label { color: #94a3b8; }
.tl-filter-row-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 6px;
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
  color: var(--text-slate-500); border-radius: 999px;
  font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
}
[data-theme='dark'] .tl-filter-row-count { background: #111720; border-color: #2d3748; color: #cbd5e1; }
.tl-filter-row-pills { flex: 1 1 auto; min-width: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.tl-filter-row-actions { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; }
.tl-filter-row-reset {
  display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px;
  background: transparent; border: 1px dashed var(--border-slate-200); border-radius: 8px;
  font-family: inherit; font-size: 11px; font-weight: 700; color: var(--text-slate-500); cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.tl-filter-row-reset:hover {
  color: #1d4ed8; border-color: rgba(59,130,246,0.45);
  background: rgba(59,130,246,0.06); border-style: solid;
}
.tl-filter-row-close {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; background: transparent;
  border: 1px solid var(--border-slate-200); border-radius: 8px;
  color: var(--text-slate-500); cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}
.tl-filter-row-close:hover { color: var(--text-slate-900); background: var(--bg-pure-white); border-color: var(--text-slate-400); }
[data-theme='dark'] .tl-filter-row-reset,
[data-theme='dark'] .tl-filter-row-close { border-color: #2d3748; color: #94a3b8; }

/* ── Table shell + rows ───────────────────────────────────────────────── */
.pp-table-wrap {
  background: var(--bg-pure-white);
  border: 1px solid var(--border-slate-200);
  border-left: none; border-right: none; border-radius: 0;
  flex: 1; min-height: 0; overflow-y: auto; overflow-x: auto; margin: 0;
  -ms-overflow-style: none; scrollbar-width: none;
}
.pp-table-wrap::-webkit-scrollbar,
.pp-table-wrap .ant-table-body::-webkit-scrollbar,
.pp-table-wrap .ant-table-content::-webkit-scrollbar { width: 0; height: 0; display: none; }
.pp-table-wrap .ant-table-body,
.pp-table-wrap .ant-table-content { -ms-overflow-style: none; scrollbar-width: none; }
[data-theme='dark'] .pp-table-wrap { background: #0f1419; border-color: #1f2937; }

.pp-table .ant-table { background: transparent; font-size: 12px; }
.pp-table .ant-table-thead > tr > th {
  background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
  font-size: 10px !important; font-weight: 800 !important; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--text-slate-400) !important; padding: 5px 10px !important;
  white-space: nowrap !important; position: sticky !important; top: 0 !important; z-index: 2 !important;
}
[data-theme='dark'] .pp-table .ant-table-thead > tr > th {
  background: #0f1419 !important; border-bottom-color: #1f2937 !important; color: #94a3b8 !important;
}
.pp-table .ant-table-tbody > tr > td {
  border-bottom: 1px solid var(--border-slate-100) !important;
  padding: 6px 10px !important; font-size: 11.5px !important; line-height: 1.35 !important;
}
[data-theme='dark'] .pp-table .ant-table-tbody > tr > td { border-bottom-color: #1f2937 !important; }
.pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
.pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }
.pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
[data-theme='dark'] .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: #1e293b !important; }
.pp-table .ant-table-pagination { display: none !important; }
.pp-table .ant-table-cell-fix-right { background: var(--bg-pure-white) !important; }
[data-theme='dark'] .pp-table .ant-table-cell-fix-right { background: #0f1419 !important; }
.pp-table .ant-table-tbody > tr.pp-row:hover > td.ant-table-cell-fix-right { background: var(--bg-slate-50) !important; }
[data-theme='dark'] .pp-table .ant-table-tbody > tr.pp-row:hover > td.ant-table-cell-fix-right { background: #1e293b !important; }
.pp-table .ant-table-row-expand-icon-cell { padding-inline: 6px !important; width: 34px; }

/* ── Cells ────────────────────────────────────────────────────────────── */
.pp-scope-id {
  cursor: pointer; color: var(--premium-blue, #3B82F6); font-weight: 700; font-size: 11px;
  font-family: 'JetBrains Mono', monospace; letter-spacing: -0.02em;
  padding: 2px 6px; background: var(--bg-blue-50); border-radius: 4px;
  border: 1px solid var(--border-blue-200); white-space: nowrap;
  display: inline-flex; align-items: center; gap: 4px;
  transition: opacity .15s ease;
}
.pp-scope-id:hover { opacity: 0.8; }

.pp-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; overflow: hidden; }
.pp-name-icon {
  width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #3B82F6; background: var(--bg-blue-50);
}
[data-theme='dark'] .pp-name-icon { background: rgba(59,130,246,0.15); }
.pp-name-icon .anticon { font-size: 12px !important; }
.pp-name-title {
  flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900);
  letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
[data-theme='dark'] .pp-name-title { color: #f1f5f9; }

.pp-vis-pill {
  display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
  border-radius: 6px; font-size: 11px; font-weight: 600;
  border: 1px solid transparent; white-space: nowrap;
}
.pp-vis-pill--ash { color: #64748b; background: rgba(100,116,139,0.10); border-color: rgba(100,116,139,0.25); }
.pp-vis-dot { width: 6px; height: 6px; border-radius: 50%; }

.pp-creator { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.pp-creator-name {
  font-size: 11.5px; color: var(--text-slate-700); white-space: nowrap; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis;
}
[data-theme='dark'] .pp-creator-name { color: #cbd5e1; }

.pp-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 20px; padding: 0 6px; border-radius: 5px;
  background: var(--bg-blue-50); color: #3B82F6;
  font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums;
}
.pp-count.is-zero { background: var(--bg-slate-100); color: var(--text-slate-400); }
[data-theme='dark'] .pp-count { background: rgba(59,130,246,0.15); }
[data-theme='dark'] .pp-count.is-zero { background: #1e293b; color: #64748b; }

.sc-muted { color: var(--text-slate-400); }

.sc-prio { display: inline-flex; align-items: center; gap: 8px; }
.sc-prio__bars { display: inline-flex; align-items: flex-end; gap: 2px; }
.sc-prio__bar { width: 4px; height: 12px; border-radius: 2px; background: var(--border-slate-200); }
.sc-prio__bar.is-on { background: #60a5fa; }
.sc-prio__bar.is-on.is-max { background: #2563eb; }
.sc-prio__label { font-size: 11.5px; font-weight: 500; color: var(--text-slate-600); }
[data-theme='dark'] .sc-prio__bar { background: #1f2937; }
[data-theme='dark'] .sc-prio__label { color: #94a3b8; }

.sc-person__av {
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(59,130,246,.12); color: #2563eb; font-size: 9px; font-weight: 800;
}
.sc-person__av.is-muted { background: rgba(100,116,139,.12); color: #64748b; }

.sc-timeline { display: flex; flex-direction: column; line-height: 1.3; }
.sc-timeline__range { font-size: 11.5px; color: var(--text-slate-700); font-variant-numeric: tabular-nums; white-space: nowrap; }
.sc-timeline__hint { font-size: 10px; color: var(--text-slate-400); }
.sc-timeline__hint.is-late { color: #dc2626; font-weight: 600; }
[data-theme='dark'] .sc-timeline__range { color: #cbd5e1; }

.sc-rowactions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
.sc-rowactions button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid transparent; background: transparent;
  color: var(--text-slate-400); cursor: pointer;
  transition: color .15s ease, background .15s ease, border-color .15s ease;
}
.sc-rowactions button:hover { color: #2563eb; background: var(--bg-blue-50); border-color: #bfdbfe; }
.sc-rowactions button.is-danger:hover { color: #dc2626; background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.25); }

/* ── Expander + linked-items child row ────────────────────────────────── */
.sc-expand {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 6px;
  border: 1px solid var(--border-slate-200); background: transparent;
  color: var(--text-slate-400); cursor: pointer; font-size: 10px;
  transition: transform .18s ease, color .15s ease, border-color .15s ease;
}
.sc-expand:hover { color: #2563eb; border-color: #bfdbfe; }
.sc-expand.is-open { transform: rotate(90deg); color: #2563eb; border-color: #bfdbfe; }
.sc-linked {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px; padding: 12px 14px; background: var(--bg-slate-50);
}
[data-theme='dark'] .sc-linked { background: #111720; }
.sc-linked__col { min-width: 0; }
.sc-linked__head { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; color: var(--text-slate-400); }
.sc-linked__label { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; }
.sc-linked__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px;
  background: var(--bg-slate-100); color: var(--text-slate-500); font-size: 9.5px; font-weight: 800;
}
.sc-linked__items { display: flex; flex-wrap: wrap; gap: 5px; }
.sc-linked__chip {
  display: inline-flex; align-items: center; gap: 5px; max-width: 100%;
  height: 22px; padding: 0 8px; border-radius: 6px;
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
  font-size: 11.5px; color: var(--text-slate-700);
}
.sc-linked__chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sc-linked__chip-ext { flex-shrink: 0; opacity: 0; transition: opacity .15s ease; }
.sc-linked__chip.is-link { cursor: pointer; text-decoration: none; }
.sc-linked__chip.is-link:hover { color: #2563eb; border-color: #bfdbfe; background: var(--bg-blue-50); }
.sc-linked__chip.is-link:hover .sc-linked__chip-ext { opacity: 1; }
.sc-linked__chip.is-link:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }
.sc-linked__none { font-size: 11.5px; color: var(--text-slate-300); }
.sc-linked__empty { padding: 10px 14px; font-size: 12.5px; color: var(--text-slate-400); background: var(--bg-slate-50); }
[data-theme='dark'] .sc-linked__empty { background: #111720; }

/* ── Footer + pager ───────────────────────────────────────────────────── */
.pp-footer {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 10px; padding: 8px 12px;
  background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200);
  box-sizing: border-box; flex-shrink: 0;
  box-shadow: 0 -4px 14px rgba(15,23,42,0.04); margin: 0;
}
[data-theme='dark'] .pp-footer { background: #0f1419; border-top-color: #1f2937; }
.pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
.pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
[data-theme='dark'] .pp-footer-info strong { color: #f1f5f9; }
.pp-pager { display: flex; align-items: center; gap: 3px; }
.pp-pager-btn, .pp-pager-num {
  min-width: 28px; height: 28px; border-radius: 7px;
  border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
  color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center;
}
[data-theme='dark'] .pp-pager-btn, [data-theme='dark'] .pp-pager-num {
  background: #1e293b; border-color: #334155; color: #cbd5e1;
}
.pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
.pp-pagesize { margin-left: 5px; }
.pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

/* ── Grid view ────────────────────────────────────────────────────────── */
.sc-gridwrap { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 16px 16px; }
.pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (max-width: 1024px) { .pp-grid { grid-template-columns: 1fr; } }

.pc-card {
  border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
  cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
  transition: box-shadow .15s ease, border-color .15s ease;
}
.pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }
.pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 12px; flex: 1; }
.pc-avatar {
  width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 800; font-size: 13px;
}
.pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 4px; flex: 1; }
.pc-title {
  font-size: 14px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
.pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
.pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pc-actions {
  width: 26px; height: 26px; border-radius: 6px; border: 1px solid transparent;
  background: transparent; color: var(--text-slate-400); cursor: pointer; flex-shrink: 0;
}
.pc-actions:hover { color: #2563eb; background: var(--bg-blue-50); border-color: #bfdbfe; }
.pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
.pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 12px; }
.pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
.pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
.pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
.pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
.pc-status-tag {
  display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px;
  border-radius: 5px; font-size: 10.5px; font-weight: 700;
}

/* ── Row action menu (grid card kebab) ────────────────────────────────── */
.pp-action-pop .ant-dropdown-menu {
  padding: 6px; border-radius: 0 !important; min-width: 236px; overflow: hidden !important;
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-100);
  box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
}
.pp-action-pop .ant-dropdown-menu-item { padding: 7px 9px !important; border-radius: 0 !important; margin: 1px 0; transition: background .12s ease; }
.pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
.pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
.pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
.pp-menu-item { display: flex; align-items: center; gap: 11px; }
.pp-menu-ic { width: 30px; height: 30px; border-radius: 0; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; }
.pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
.pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
.pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
.pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
.pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
.pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
.pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }
[data-theme='dark'] .pp-action-pop .ant-dropdown-menu { background: #0B0F1A !important; border: 1px solid #1E293B !important; }
[data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item:hover { background: #161B22 !important; }
[data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item-divider { background: #1E293B !important; }
[data-theme='dark'] .pp-menu-title { color: #cbd5e1 !important; }
[data-theme='dark'] .pp-menu-desc { color: #64748b !important; }

/* ── Empty + project picker ───────────────────────────────────────────── */
.sc-pickerwrap { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 20px; }
.sc-empty { padding: 44px 24px; text-align: center; }
.sc-empty__icon { font-size: 26px; color: var(--border-slate-200); }
.sc-empty__title { margin: 12px 0 4px; font-size: 14px; font-weight: 600; color: var(--text-slate-700); }
.sc-empty__desc { margin: 0 auto 14px; max-width: 340px; font-size: 12.5px; color: var(--text-slate-400); }

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 1200px) {
  .sc-owner-opt__label { display: none; }
}
@media (max-width: 900px) {
  .sc-header { padding: 8px 12px; }
  .sc-header-controls { order: 3; flex-basis: 100%; }
  .sc-header-right { margin-left: auto; }
  .tl-sprint-row2 { gap: 12px; }
}
@media (max-width: 640px) {
  .tl-shell-wrap { height: auto; min-height: calc(100vh - 64px); overflow: visible; }
  .tl-main { height: auto; overflow: visible; }
  .tl-section { overflow: visible; }
  .tl-section-body { overflow: visible; }
  .pp-table-wrap { overflow-x: auto !important; }
  .sc-linked { grid-template-columns: 1fr; }
  .pp-footer { flex-wrap: wrap; height: auto; min-height: 44px; padding: 8px 14px; gap: 6px; }
  .pp-footer-info { font-size: 11px; }
  .tl-filter-row-label { display: none; }
}
/* ── Cases-specific cells ─────────────────────────────────────────────── */
.pp-run-id {
  cursor: pointer; color: var(--premium-blue, #3B82F6); font-weight: 700; font-size: 11px;
  font-family: 'JetBrains Mono', monospace; letter-spacing: -0.02em;
  padding: 2px 6px; background: var(--bg-blue-50); border-radius: 4px;
  border: 1px solid var(--border-blue-200); white-space: nowrap;
  display: inline-flex; align-items: center; gap: 4px;
  transition: opacity .15s ease;
}
.pp-run-id:hover { opacity: 0.8; }

.pp-plain { font-size: 11.5px; color: var(--text-slate-700); }
[data-theme='dark'] .pp-plain { color: #cbd5e1; }

/* Inline execution progress */
.rn-progress { display: flex; align-items: center; gap: 9px; }
.rn-progress__bar {
  flex: 1; min-width: 70px; height: 5px; border-radius: 999px;
  background: var(--border-slate-100); overflow: hidden;
}
.rn-progress__bar > span { display: block; height: 100%; background: #3B82F6; transition: width .3s ease; }
.rn-progress__bar > span.is-done { background: #10b981; }
.rn-progress__label {
  flex-shrink: 0; font-size: 11.5px; font-weight: 600; color: var(--text-slate-600);
  font-variant-numeric: tabular-nums;
}

.sc-rowactions .rn-exec { height: 26px; border-radius: 7px; font-size: 11.5px; font-weight: 600; }

/* ── Create Test Run drawer ───────────────────────────────────────────── */
.rd { display: flex; flex-direction: column; height: 100%; background: var(--bg-pure-white); }
.rd__head {
  display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100);
}
.rd__icon {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 32px; height: 32px; border-radius: 9px; font-size: 15px;
  background: rgba(59,130,246,.1); color: #3B82F6; border: 1px solid rgba(59,130,246,.18);
}
.rd__headtext { flex: 1; min-width: 0; }
.rd__title { margin: 0; font-size: 14px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -.01em; }
.rd__sub { display: block; margin-top: 1px; font-size: 11.5px; line-height: 1.4; color: var(--text-slate-500); }
.rd__close {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 28px; height: 28px; border-radius: 8px; font-size: 12px;
  color: var(--text-slate-400); background: none; border: none; cursor: pointer;
  transition: all .15s ease;
}
.rd__close:hover { color: var(--text-slate-900); background: var(--bg-slate-50); }

.rd__body { flex: 1; overflow-y: auto; padding: 16px; }
.rd__field { margin-bottom: 16px; }
.rd__label { display: block; margin-bottom: 5px; font-size: 12px; font-weight: 600; color: var(--text-slate-700); }
.rd__req { color: #ef4444; }
.rd__hint { margin: 5px 0 0; font-size: 11.5px; line-height: 1.45; color: var(--text-slate-400); }
.rd__body .ant-input { height: 34px; border-radius: 8px; font-size: 12.5px; }
.rd__control { width: 100%; }
.rd__body .sd-trigger { height: 34px !important; min-height: 34px !important; border-radius: 8px !important; padding: 0 12px !important; }

.rd__preview {
  padding: 12px 14px; border-radius: 10px;
  background: rgba(59,130,246,.06); border: 1px solid rgba(59,130,246,.22);
}
.rd__preview-key {
  display: block; margin-bottom: 6px;
  font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: #2563eb;
}
.rd__preview-row { display: flex; align-items: baseline; gap: 8px; }
.rd__preview-count { font-size: 22px; font-weight: 800; line-height: 1; color: var(--text-slate-900); }
.rd__preview-label { font-size: 12.5px; color: var(--text-slate-600); }
.rd__preview-label strong { color: var(--text-slate-900); font-weight: 650; }
.rd__preview-warn { margin: 8px 0 0; font-size: 11.5px; color: #b45309; }

.rd__foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-shrink: 0;
  padding: 10px 16px; border-top: 1px solid var(--border-slate-100);
  background: var(--bg-slate-50);
}
.rd__foot .ant-btn { height: 32px; border-radius: 8px; font-size: 12.5px; font-weight: 600; padding: 0 14px; }

/* A run still executing is worth calling out in the banner. */
.tl-sprint-tag-running { background: transparent; color: #3b82f6; border-color: rgba(59,130,246,0.32); }

/* The suite the list is narrowed to, when one is picked. */
.tl-sprint-tag-module { background: transparent; color: #3b82f6; border-color: rgba(59,130,246,0.32); }

.sc-empty__icon { display: inline-block; }
`;


