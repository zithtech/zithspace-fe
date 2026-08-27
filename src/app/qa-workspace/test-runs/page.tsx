"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Progress, message, Input, Drawer, Select, Typography, Tooltip } from "antd";
import { PlusOutlined, PlayCircleOutlined, CheckCircleOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, SnippetsOutlined, CloseOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { PlayCircle, Target, Activity, Trash2, Layers, ChevronDown, Menu, RotateCw } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios, apiClient } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import ZukvoLoader, { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import dayjs from "dayjs";
import { useDebounce } from "@/hooks/useDebounce";
import { useQaProject, QaProjectPicker, QaProjectSwitcher } from "@/components/qa/QaProjectGate";

const { Text } = Typography;

/** How many entries each sidebar section shows before "Show more". */
const SUITES_PREVIEW = 5;

const PROGRESS_OPTIONS = [
  { value: 'notStarted', label: 'Not started' },
  { value: 'active', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

/** Collapses a list to its preview window, keeping the selected entry visible. */
function previewList<T extends { value: string }>(items: T[], limit: number, expanded: boolean, selected?: string) {
  if (expanded) return items;
  const head = items.slice(0, limit);
  if (selected && !head.some(i => i.value === selected)) {
    const active = items.find(i => i.value === selected);
    if (active) return [...head, active];
  }
  return head;
}

/* Product-standard stat tile */
const StatTile = ({ label, value, icon: Icon, color, bgColor, sub }: { label: string; value: string | number; icon: any; color: string; bgColor: string; sub?: string; }) => (
  <div className="pp-stat-card">
    <div className="pp-stat-top">
      <div className="pp-stat-left">
        <span className="pp-stat-icon" style={{ background: bgColor, color }}>
          <Icon size={14} style={{ fontSize: 14 }} />
        </span>
        <span className="pp-stat-label">{label}</span>
      </div>
    </div>
    <div className="pp-stat-bottom">
      <div className="pp-stat-value-wrap">
        <span className="pp-stat-value">{value}</span>
      </div>
      {sub && <span className="pp-stat-period">{sub}</span>}
    </div>
  </div>
);

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
  const [showAllSuites, setShowAllSuites] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
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

  /* Sidebar sections — the same option lists the filter row uses. */
  const visibleSuites = previewList(suiteFilterOptions, SUITES_PREVIEW, showAllSuites, suiteFilter);
  const hiddenSuiteCount = Math.max(0, suiteFilterOptions.length - SUITES_PREVIEW);
  const selectedSuiteLabel = suiteFilterOptions.find(o => o.value === suiteFilter)?.label;

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

  const columns = [
    {
      title: "Run",
      dataIndex: "run_name",
      key: "run_name",
      width: 300,
      render: (t: string, record: any) => (
        <div className="sc-name">
          <span className="sc-name__badge">{initialsOf(t || '')}</span>
          <span className="sc-name__text">
            <span className="sc-name__title" title={t}>{t || 'Untitled run'}</span>
            <span className="sc-name__meta">{suiteNameOf(record)} · {moduleNameOf(record)}</span>
          </span>
        </div>
      )
    },
    {
      title: "Progress",
      key: "progress",
      width: 210,
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
      title: "State",
      key: "state",
      width: 130,
      render: (_: any, record: any) => {
        const { total, executed, percent } = progressOf(record);
        if (!total || executed === 0) return <span className="sc-pill sc-pill--ash"><span className="sc-pill__dot" />Not started</span>;
        if (percent === 100) return <span className="sc-pill sc-pill--green"><span className="sc-pill__dot" />Completed</span>;
        return <span className="sc-pill sc-pill--blue"><span className="sc-pill__dot" />In progress</span>;
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
      <style dangerouslySetInnerHTML={{
        __html: `
        .dh-shell { display: flex; height: calc(100vh - 64px); background: transparent; overflow: hidden; position: relative; }
        .dh-sidebar {
          width: 194px; background: transparent; border-right: 1px solid var(--border-slate-200);
          display: flex; flex-direction: column; z-index: 10; flex-shrink: 0;
        }
        .dh-sidebar-top { padding: 12px 10px 10px; flex-shrink: 0; border-bottom: 1px solid var(--border-slate-100); }
        .pp-side-head { display: flex; align-items: center; gap: 9px; margin-bottom: 0; padding: 0 2px; }
        .pp-side-logo {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          background: var(--bg-blue-50); color: #3B82F6;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(59,130,246,.16);
        }
        .pp-side-title { font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); line-height: 1.15; margin: 0; }
        .pp-side-subtitle { font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; margin: 1px 0 0; letter-spacing: .02em; }
        .pp-side-cta { margin-top: 12px; height: 34px !important; border-radius: 8px !important; font-size: 12.5px; font-weight: 600; }

        .dh-sidebar-scroll { flex: 1; overflow-y: auto; padding: 12px 8px 16px; }
        .pp-nav-caption {
          display: block; padding: 0 8px; margin: 0 0 6px;
          font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
          color: var(--text-slate-400);
        }
        .pp-nav-item {
          position: relative;
          display: flex; align-items: center; gap: 9px; width: 100%; height: 33px; padding: 0 9px;
          border-radius: 7px; border: none; background: transparent; color: var(--text-slate-600);
          font-size: 12.5px; font-weight: 500; cursor: pointer; text-align: left;
          transition: background .15s ease, color .15s ease; margin-bottom: 2px;
        }
        .pp-nav-icon { flex-shrink: 0; color: var(--text-slate-400); transition: color .15s ease; }
        .pp-nav-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pp-nav-count {
          flex-shrink: 0; min-width: 20px; padding: 1px 6px; border-radius: 999px;
          font-size: 10.5px; font-weight: 700; text-align: center;
          background: var(--bg-slate-50); color: var(--text-slate-500);
          border: 1px solid var(--border-slate-100); transition: all .15s ease;
        }
        .pp-nav-item:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .pp-nav-item:hover .pp-nav-icon { color: var(--text-slate-600); }
        .pp-nav-item.is-active { background: var(--bg-blue-50); color: #3B82F6; font-weight: 650; }
        .pp-nav-item.is-active .pp-nav-icon { color: #3B82F6; }
        .pp-nav-item.is-active .pp-nav-count { background: rgba(59,130,246,.14); color: #2563eb; border-color: transparent; }
        .pp-nav-caption + .pp-nav-item { margin-top: 0; }
        .pp-nav-item ~ .pp-nav-caption, .pp-nav-more + .pp-nav-caption { margin-top: 16px; }
        .pp-nav-more {
          display: flex; align-items: center; gap: 6px; width: 100%; height: 28px; padding: 0 9px;
          margin-top: 2px; border: none; background: transparent; border-radius: 7px;
          color: var(--text-slate-500); font-size: 11.5px; font-weight: 600; cursor: pointer; text-align: left;
          transition: background .15s ease, color .15s ease;
        }
        .pp-nav-more:hover { background: var(--bg-slate-50); color: #3B82F6; }
        .pp-nav-more-icon { transition: transform .18s ease; }
        .pp-nav-more.is-open .pp-nav-more-icon { transform: rotate(180deg); }
        .pp-nav-empty { display: block; padding: 4px 9px 2px; font-size: 11.5px; color: var(--text-slate-400); }
        .pp-nav-item.is-active::before {
          content: ''; position: absolute; left: -8px; top: 7px; bottom: 7px;
          width: 3px; border-radius: 0 3px 3px 0; background: #3B82F6;
        }

        .dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
        .dh-main-topbar { height: auto; min-height: 64px; border-bottom: 1px solid var(--border-slate-200); background: transparent; display: flex; align-items: center; padding: 12px 24px; justify-content: space-between; }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; background: transparent; }

        /* ── Topbar: title + subtitle on one line ───────────────────── */
        .sc-topbar { min-height: 52px !important; padding: 8px 20px !important; }
        .sc-topbar__title { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .sc-topbar__h1 { font-size: 15px; font-weight: 700; color: var(--text-slate-900); white-space: nowrap; }
        .sc-topbar__div { width: 1px; height: 14px; background: var(--border-slate-200); flex-shrink: 0; }
        .sc-topbar__sub { font-size: 12px; color: var(--text-slate-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        @media (max-width: 860px) { .sc-topbar__div, .sc-topbar__sub { display: none; } }
        .sc-topbar .dh-main-controls { display: flex; align-items: center; gap: 8px; }
        .sc-topbar .dh-main-controls .ant-btn { height: 32px !important; border-radius: 8px; }
        .sc-topbar .pp-segmented { height: 32px; display: inline-flex; align-items: center; border-radius: 8px; overflow: hidden; }
        .sc-topbar .pp-segmented button { height: 32px; width: 34px; display: inline-flex; align-items: center; justify-content: center; }

        /* ── Stat tiles ─────────────────────────────────────────────── */
        .pp-stat-card {
          background: transparent; border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 10px 12px; min-height: 84px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 8px;
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 18px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; }
        .sc-stat-hit { cursor: pointer; outline: none; }
        .sc-stat-hit .pp-stat-card { transition: border-color .15s ease, background .15s ease; }
        .sc-stat-hit:hover .pp-stat-card { border-color: #bfdbfe; background: var(--bg-slate-50); }
        .sc-stat-hit.is-active .pp-stat-card { border-color: #3b82f6; box-shadow: inset 0 -2px 0 #3b82f6; }
        .sc-stat-hit:focus-visible .pp-stat-card { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }

        /* ── Filter row ─────────────────────────────────────────────── */
        .sc-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .sc-filters__search { width: 240px; }
        .sc-filters .ant-input-affix-wrapper { height: 32px !important; border-radius: 8px; }
        .sc-filters__field { min-width: 150px; }
        .sc-filters .sd-trigger { height: 32px !important; min-height: 32px !important; border-radius: 8px !important; padding-block: 0 !important; }
        .sc-clear {
          height: 32px; display: inline-flex; align-items: center;
          font-size: 12px; font-weight: 600; color: #3b82f6;
          padding: 0 11px; border-radius: 8px;
          border: 1px solid var(--border-slate-200); background: transparent;
          cursor: pointer; transition: all .15s ease;
        }
        .sc-clear:hover { background: var(--bg-blue-50); border-color: #bfdbfe; }

        /* ── Table ──────────────────────────────────────────────────── */
        .sc-tablewrap { background: transparent; border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .sc-table .ant-table { background: transparent; }
        .sc-table, .sc-table.ant-table-wrapper, .sc-table .ant-table, .sc-table .ant-table-container, .sc-table .ant-table-content, .sc-table .ant-table-header, .sc-table .ant-table-body { border-radius: 0 !important; }
        .sc-table .ant-table-thead > tr > th, .sc-table .ant-table-thead > tr > td { border-radius: 0 !important; border-start-start-radius: 0 !important; border-start-end-radius: 0 !important; }
        .sc-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; padding: 8px 14px !important; letter-spacing: .06em !important; }
        .sc-table .ant-table-tbody > tr > td { padding: 8px 14px !important; }
        .sc-table .ant-table-tbody > tr { cursor: pointer; }
        .sc-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        .sc-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .sc-table .ant-table-tbody > tr > td:last-child { padding-right: 12px !important; }

        .sc-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .sc-name__badge {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 27px; height: 27px; border-radius: 7px;
          background: rgba(59,130,246,.1); color: #2563eb;
          font-size: 10px; font-weight: 700; letter-spacing: .02em;
        }
        .sc-name__text { display: flex; flex-direction: column; min-width: 0; }
        .sc-name__title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
        .sc-name__meta { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
        .sc-muted { color: var(--text-slate-400); font-size: 12.5px; }
        .sc-timeline__range { font-size: 12.5px; color: var(--text-slate-700); font-variant-numeric: tabular-nums; white-space: nowrap; }

        .sc-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 10px; border-radius: 999px; white-space: nowrap;
          font-size: 11.5px; font-weight: 600;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); color: var(--text-slate-600);
        }
        .sc-pill__dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
        .sc-pill--blue { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.22); }
        .sc-pill--green { color: #047857; background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.24); }
        .sc-pill--ash { color: #64748b; background: rgba(100,116,139,.1); border-color: rgba(100,116,139,.2); }

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

        .sc-rowactions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
        .sc-rowactions .rn-exec { height: 26px; border-radius: 7px; font-size: 11.5px; font-weight: 600; }
        .sc-rowactions button.is-danger {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 7px; cursor: pointer;
          border: 1px solid transparent; background: transparent; color: var(--text-slate-400);
          transition: all .15s ease;
        }
        .sc-rowactions button.is-danger:hover { color: #dc2626; background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.25); }

        .sc-empty { padding: 44px 24px; text-align: center; }
        .sc-empty__icon { font-size: 26px; color: var(--border-slate-200); display: inline-block; }
        .sc-empty__title { margin: 12px 0 4px; font-size: 14px; font-weight: 600; color: var(--text-slate-700); }
        .sc-empty__desc { margin: 0 auto 14px; max-width: 340px; font-size: 12.5px; color: var(--text-slate-400); }

        /* ── Create Test Run drawer ────────────────────────────────── */
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

        /* ── Pager pinned to the bottom of the pane ─────────────────── */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap; gap: 10px;
          padding: 0 20px; border-top: 1px solid var(--border-slate-200);
          height: 52px; min-height: 52px; box-sizing: border-box; flex-shrink: 0;
          background: var(--bg-pure-white); box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer;
          font-size: 12.5px; font-weight: 600;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }
        
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); margin-left: 12px; }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }

        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
        @media (max-width: 1024px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

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

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }

        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0 !important; min-width: 220px;
          overflow: hidden !important;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 7px 9px !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }

        .ts-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase !important; color: var(--text-slate-500) !important;
          white-space: nowrap !important;
        }
        .ts-table, .ts-table .ant-table { background: transparent !important; }
        .ts-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; }
        .ts-table .ant-table-tbody > tr:hover > td { background: rgba(255, 255, 255, 0.05) !important; }

        .dh-mobile-menu-btn { display: none !important; }

        @media (max-width: 820px) {
          .dh-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
          .dh-main { height: auto; overflow: visible; width: 100%; }
          .dh-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; margin-right: 8px; color: var(--text-slate-600); }
          .dh-mobile-menu-btn:hover { background: var(--bg-slate-100); }

          .dh-sidebar-backdrop {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
            opacity: 0; pointer-events: none; transition: opacity 0.3s;
            display: block !important;
          }
          .dh-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }

          .dh-sidebar {
            position: fixed; top: 0; left: -320px; bottom: 0;
            z-index: 1100; height: 100%; max-height: none;
            border-right: 1px solid var(--border-slate-200); border-bottom: 0;
            display: flex; flex-direction: column; align-items: stretch;
            background: var(--bg-pure-white); width: 280px; box-sizing: border-box;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 4px 0 24px rgba(0,0,0,0.08);
          }
          .dh-sidebar.is-mobile-open { left: 0; }

          /* Stats grid → 2 columns on mobile */
          .dh-main-scroll { padding: 12px 14px !important; }
          .grid.grid-cols-2.lg\:grid-cols-4 { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }

          /* Filter bar: full-width search, other filters wrap */
          .sc-filters { gap: 6px; }
          .sc-filters__search { width: 100% !important; min-width: 0; }
          .sc-filters__field { min-width: 130px; flex: 1 1 130px; }

          /* Table: horizontal scroll */
          .sc-tablewrap { overflow-x: auto !important; }
          .sc-table .ant-table { min-width: 640px; }

          /* Topbar: compress controls */
          .sc-topbar { padding: 8px 14px !important; }

          /* Footer: wrap on small screens */
          .pp-footer { flex-wrap: wrap; height: auto; min-height: 44px; padding: 8px 14px; gap: 6px; }
        }

        @media (max-width: 480px) {
          .grid.grid-cols-2.lg\:grid-cols-4 { grid-template-columns: 1fr !important; }
          .sc-topbar__sub, .sc-topbar__div { display: none !important; }
          .pp-footer-info { font-size: 11px; }
        }
        `}} />

      <div className="dh-shell">
        <div
          className={`dh-sidebar-backdrop ${mobileSidebarOpen ? 'is-open' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
        <aside className={`dh-sidebar ${mobileSidebarOpen ? 'is-mobile-open' : ''}`}>
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo">
                <PlayCircle size={18} />
              </div>
              <div className="pp-side-head-text">
                <h1 className="pp-side-title">Runs</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateRun && projectFilter && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                block
                className="pp-side-cta"
              >
                Create Test Run
              </Button>
            )}
          </div>

          <div className="dh-sidebar-scroll">
            <span className="pp-nav-caption">Suites</span>
            <button
              className={`pp-nav-item ${!suiteFilter ? 'is-active' : ''}`}
              onClick={() => { setSuiteFilter(undefined); setMobileSidebarOpen(false); }}
            >
              <Layers size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">All Suites</span>
              {suiteFilterOptions.length > 0 ? <span className="pp-nav-count">{suiteFilterOptions.length}</span> : null}
            </button>
            {visibleSuites.map(su => (
              <button
                key={su.value}
                className={`pp-nav-item ${suiteFilter === su.value ? 'is-active' : ''}`}
                onClick={() => { setSuiteFilter(su.value); setMobileSidebarOpen(false); }}
                title={su.label}
              >
                <Layers size={15} className="pp-nav-icon" />
                <span className="pp-nav-label">{su.label}</span>
              </button>
            ))}
            {suiteFilterOptions.length === 0 && (
              <span className="pp-nav-empty">No suites yet</span>
            )}
            {hiddenSuiteCount > 0 && (
              <button
                type="button"
                className={`pp-nav-more ${showAllSuites ? 'is-open' : ''}`}
                onClick={() => setShowAllSuites(v => !v)}
              >
                <ChevronDown size={13} className="pp-nav-more-icon" />
                {showAllSuites ? 'Show less' : `Show ${hiddenSuiteCount} more`}
              </button>
            )}

            <span className="pp-nav-caption">Progress</span>
            <button
              className={`pp-nav-item ${!progressFilter ? 'is-active' : ''}`}
              onClick={() => { setProgressFilter(undefined); setMobileSidebarOpen(false); }}
            >
              <Activity size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">Any progress</span>
            </button>
            {PROGRESS_OPTIONS.map(o => (
              <button
                key={o.value}
                className={`pp-nav-item ${progressFilter === o.value ? 'is-active' : ''}`}
                onClick={() => { setProgressFilter(o.value); setMobileSidebarOpen(false); }}
              >
                <PlayCircle size={15} className="pp-nav-icon" />
                <span className="pp-nav-label">{o.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar sc-topbar">
            {/* Title and subtitle share one line, split by a divider */}
            <div className="sc-topbar__title" style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                className="dh-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
              <span className="sc-topbar__h1">All Test Runs</span>
              <span className="sc-topbar__div" />
              <QaProjectSwitcher
                projects={projectOptions}
                value={selectedProjectId}
                onChange={chooseProject}
                loading={loadingProjects}
              />
              {selectedSuiteLabel && (
                <>
                  <span className="sc-topbar__div" />
                  <span className="sc-topbar__sub">{selectedSuiteLabel}</span>
                </>
              )}
            </div>

            <div className="dh-main-controls">
              <Button
                type="default"
                icon={<RotateCw size={14} className={loading ? "animate-spin" : ""} />}
                onClick={fetchData}
                disabled={loading || !projectFilter}
                title="Refresh"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0 }}
              />
              <div className="pp-segmented">
                <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => setViewMode('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')} aria-label="List view"><UnorderedListOutlined /></button>
              </div>
              {canCreateRun && projectFilter && (
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreateModal}>
                  New Run
                </Button>
              )}
            </div>
          </div>

          <div className="dh-main-scroll">
            {!projectFilter ? (
              /* Until the project is known there are no runs, stats or filters
                 worth showing — the picker takes the whole area. */
              !projectReady ? (
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
              )
            ) : (
            <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {[
                { key: undefined, label: "Total Runs", value: totalItems, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: SnippetsOutlined, sub: `across ${suites.length} suites` },
                { key: 'active', label: "In Progress", value: stats?.activeRuns || 0, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: Activity, sub: 'partially executed' },
                { key: 'completed', label: "Completed", value: stats?.completedRuns || 0, color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: CheckCircleOutlined, sub: `${totalItems ? Math.round(((stats?.completedRuns || 0) / totalItems) * 100) : 0}% of all runs` },
                { key: undefined, label: "Executed Cases", value: stats?.totalExecutedCases || 0, color: "#64748b", bg: "rgba(100,116,139,0.1)", icon: Target, sub: 'results recorded' }
              ].map((stat, i) => {
                return (
                  <div key={`${stat.label}-${i}`}>
                    <StatTile label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} bgColor={stat.bg} sub={stat.sub} />
                  </div>
                );
              })}
            </div>

            {/* Filter row */}
            <div className="sc-filters">
              <Input
                className="sc-filters__search"
                placeholder="Search runs, suites…"
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
              <SearchableDropdown
                options={suiteFilterOptions}
                value={suiteFilter}
                onChange={(v) => setSuiteFilter(v)}
                onSearch={(v) => setSuiteSearchTerm(v)}
                placeholder="All suites"
                itemNoun="suites"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={PROGRESS_OPTIONS}
                value={progressFilter}
                onChange={(v) => setProgressFilter(v)}
                placeholder="Any progress"
                hideAvatar
                itemNoun="states"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={modules.map(m => ({ value: m.id, label: m.module_name || m.name || "Unnamed Module" }))}
                value={moduleFilter}
                onChange={(v) => setModuleFilter(v)}
                placeholder="Any module"
                hideAvatar
                itemNoun="modules"
                className="sc-filters__field"
              />
  
              {activeFilterCount > 0 && (
                <button type="button" className="sc-clear" onClick={clearFilters}>
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Table or Grid — only the results blur, so the filters above
                stay usable while a search refetches. */}
            <ZukvoLoadingOverlay loading={loading} message="Loading test runs…" minHeight={loading ? 320 : undefined}>
            {viewMode === 'list' ? (
              <div className="sc-tablewrap">
                <Table
                  className="ts-table sc-table"
                  dataSource={pagedRuns}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  onRow={(record) => ({
                    onClick: () => openExecuteDrawer(record),
                  })}
                  locale={{
                    /* Holding the height beats claiming "no runs" mid-fetch. */
                    emptyText: loading ? (
                      <div style={{ minHeight: 240 }} />
                    ) : (
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
                    )
                  }}
                />
              </div>
            ) : (
              <div className="pp-grid">
                {loading ? null : filteredRuns.length === 0 ? (
                  <div className="sc-empty" style={{ gridColumn: '1 / -1' }}>
                    <SnippetsOutlined className="sc-empty__icon" />
                    <p className="sc-empty__title">{activeFilterCount > 0 ? 'No runs match these filters' : 'No test runs yet'}</p>
                    <p className="sc-empty__desc">
                      {activeFilterCount > 0 ? 'Try widening your search or clearing the filters.' : 'Create a run to execute a suite and record results.'}
                    </p>
                    {activeFilterCount > 0
                      ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
                      : canCreateRun && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreateModal}>Create Test Run</Button>}
                  </div>
                ) : (
                  pagedRuns.map(r => renderRunCard(r))
                )}
              </div>
            )}
            </ZukvoLoadingOverlay>
            </>
            )}
          </div>

          {/* Pager sits outside the scroll area so it stays pinned to the bottom */}
          {projectFilter && filteredRuns.length > 0 && (
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
        </main>
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
