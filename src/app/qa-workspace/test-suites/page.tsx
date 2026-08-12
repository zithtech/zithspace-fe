"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, message, Input, Select, Tooltip } from "antd";
import { PlusOutlined, SnippetsOutlined, CheckCircleOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, FolderOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { Layers, Trash2, Pencil, Folder } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import dayjs from "dayjs";

type TabKey = "suites";

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
  ['#8b5cf6', '#6d28d9'],
  ['#10b981', '#047857'],
  ['#f59e0b', '#b45309']
];

function accentFor(str: string) {
  const h = Math.abs(hashCode(str || 'default'));
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
}

function initialsOf(name: string) {
  if (!name) return 'TS';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TestSuitesPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestSuites" });

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("suites");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [suites, setSuites] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState<string | undefined>();
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const [coverageFilter, setCoverageFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, scenarioFilter, moduleFilter, coverageFilter]);

  const { canReadSuite, canCreateSuite, canUpdateSuite, canDeleteSuite } = usePermission();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suitesRes, parentsRes, modRes] = await Promise.all([
        axios.get("/api/v2/qa/suites/all"),
        axios.get("/api/v2/qa/parents"),
        axios.get("/api/v2/qa/modules")
      ]);
      setSuites(Array.isArray(suitesRes) ? suitesRes : (suitesRes?.data?.data || suitesRes?.data || []));
      setParents(Array.isArray(parentsRes) ? parentsRes : (parentsRes?.data?.data || parentsRes?.data || []));
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
    } catch (error) {
      message.error("Failed to fetch test suites data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadSuite) {
      fetchData();
    }
  }, [canReadSuite]);

  /**
   * Creating and editing a suite is a full page, the same shape as Create Test
   * Scope — the suite form is too big to work in comfortably from a drawer.
   */
  const openCreateModal = (record?: any) => {
    router.push(record?.id ? `/qa-workspace/test-suites/create?id=${record.id}` : "/qa-workspace/test-suites/create");
  };

  const handleDeleteSuite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/api/v2/qa/suites/${id}`);
      message.success("Test Suite deleted");
      fetchData();
    } catch (error) {
      message.error("Failed to delete suite");
    }
  };

  if (!canReadSuite) return null;

  const filteredSuites = suites.filter(s => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const hay = [s.suite_name, s.description, s.module_name, s.parent_title]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (scenarioFilter && (s.parent_title || '') !== scenarioFilter) return false;
    if (moduleFilter && (s.module_name || 'Unassigned') !== moduleFilter) return false;
    const cases = parseInt(s.case_count || '0', 10);
    if (coverageFilter === 'linked' && cases === 0) return false;
    if (coverageFilter === 'empty' && cases > 0) return false;
    return true;
  });

  const totalLinkedCases = suites.reduce((acc, curr) => acc + (parseInt(curr.case_count || '0', 10)), 0);
  const uniqueScenarios = new Set(suites.map(s => s.parent_test_case_id).filter(Boolean)).size;
  const emptySuites = suites.filter(s => parseInt(s.case_count || '0', 10) === 0).length;
  const avgCasesPerSuite = suites.length ? (totalLinkedCases / suites.length).toFixed(1) : '0';

  // Filter options, derived from the suites that are actually present
  const uniqueSorted = (values: any[]) =>
    Array.from(new Set(values.filter(Boolean)))
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map(v => ({ value: String(v), label: String(v) }));

  const scenarioFilterOptions = uniqueSorted(suites.map(s => s.parent_title));
  const moduleFilterOptions = uniqueSorted(suites.map(s => s.module_name || 'Unassigned'));

  const activeFilterCount =
    (searchTerm.trim() ? 1 : 0) + (scenarioFilter ? 1 : 0) + (moduleFilter ? 1 : 0) + (coverageFilter ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setScenarioFilter(undefined);
    setModuleFilter(undefined);
    setCoverageFilter(undefined);
  };

  // Client-side pagination, matching the app-wide sticky pager
  const pageCount = Math.max(1, Math.ceil(filteredSuites.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = filteredSuites.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filteredSuites.length);
  const pagedSuites = filteredSuites.slice((safePage - 1) * pageSize, safePage * pageSize);


  const scenarioTitleOf = (record: any) => {
    const parent = parents.find(p => p.id === record.parent_test_case_id);
    return record.parent_title || parent?.title || '';
  };

  const moduleNameOf = (record: any) => {
    const mod = modules.find(m => m.id === record.module_id);
    return record.module_name || mod?.module_name || mod?.name || 'Unassigned';
  };

  const columns = [
    {
      title: "Suite",
      dataIndex: "suite_name",
      key: "suite_name",
      width: 320,
      render: (t: string, record: any) => (
        <div className="sc-name">
          <span className="sc-name__badge">{initialsOf(t || '')}</span>
          <span className="sc-name__text">
            <span className="sc-name__title" title={t}>{t || 'Untitled suite'}</span>
            {record.description && <span className="sc-name__meta">{record.description}</span>}
          </span>
        </div>
      )
    },
    {
      title: "Business Scenario",
      dataIndex: "parent_test_case_id",
      key: "parent_test_case_id",
      width: 220,
      render: (_: string, record: any) => {
        const title = scenarioTitleOf(record);
        if (!title) return <span className="sc-muted">—</span>;
        return (
          <span className="ts-scenario" title={title}>
            <FolderOutlined />
            <span className="truncate">{title}</span>
          </span>
        );
      }
    },
    {
      title: "Module",
      dataIndex: "module_id",
      key: "module_id",
      width: 150,
      render: (_: string, record: any) => <span className="cd-plain">{moduleNameOf(record)}</span>
    },
    {
      title: "Testing Type",
      dataIndex: "testing_type",
      key: "testing_type",
      width: 170,
      render: (t: string) =>
        t ? (
          <span className="ts-type" title={t}>{t}</span>
        ) : (
          <span className="sc-muted">—</span>
        ),
    },
    {
      title: "Cases",
      dataIndex: "case_count",
      key: "case_count",
      width: 110,
      render: (t: number) => {
        const n = t || 0;
        if (!n) return <span className="sc-muted">—</span>;
        return <span className="sc-pill sc-pill--blue"><span className="sc-pill__dot" />{n} case{n === 1 ? '' : 's'}</span>;
      }
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 140,
      render: (t: string) => (
        <span className="sc-timeline__range">{t ? dayjs(t).format("D MMM YYYY") : '—'}</span>
      )
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "right" as const,
      render: (_: any, record: any) => (
        <div className="sc-rowactions" onClick={e => e.stopPropagation()}>
          {canUpdateSuite && (
            <Tooltip title="Edit">
              <button onClick={(e) => { e.stopPropagation(); openCreateModal(record); }} aria-label="Edit">
                <Pencil size={15} />
              </button>
            </Tooltip>
          )}
          {canDeleteSuite && (
            <ConfirmDialog
              tone="danger"
              title="Delete Test Suite?"
              description="Are you sure you want to delete this test suite? Associated test cases will remain untouched."
              confirmText="Delete"
              onConfirm={() => handleDeleteSuite(record.id)}
            >
              <Tooltip title="Delete">
                <button className="is-danger" onClick={(e) => e.stopPropagation()} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </Tooltip>
            </ConfirmDialog>
          )}
          {!canUpdateSuite && !canDeleteSuite && <span className="sc-muted">—</span>}
        </div>
      )
    }
  ];

  const renderSuiteCard = (r: any) => {
    const accent = accentFor(r.suite_name || r.id);
    const parent = parents.find(p => p.id === r.parent_test_case_id);
    const parentTitle = r.parent_title || parent?.title || "Unassigned Scenario";

    return (
      <div key={r.id} className="pc-card" onClick={() => router.push("/qa-workspace/test-suites/" + r.id)}>
        <div className="pc-top">
          <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
            {initialsOf(r.suite_name)}
          </div>
          <div className="pc-identity-body">
            <div className="pc-title">{r.suite_name}</div>
            <div className="pc-client-line">
              <span className="pc-client-key">Scenario:</span>
              <span className="pc-client-val">{parentTitle}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
            {canUpdateSuite && (
              <Button
                type="text"
                size="small"
                icon={<Pencil size={15} />}
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateModal(r);
                }}
                style={{ color: "var(--text-slate-500)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                title="Edit Suite"
              />
            )}
            {canDeleteSuite && (
              <ConfirmDialog
                tone="danger"
                title="Delete Test Suite?"
                description="Are you sure you want to delete this test suite? Associated test cases will remain untouched."
                confirmText="Delete"
                onConfirm={() => handleDeleteSuite(r.id)}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<Trash2 size={15} />}
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  title="Delete Suite"
                />
              </ConfirmDialog>
            )}
          </div>
        </div>

        <div className="pc-foot">
          <div className="pc-foot-row">
            <span className="pc-foot-item">
              <span className="pc-foot-key">Module:</span>
              <span className="pc-foot-val">{r.module_name || 'Unassigned'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Cases:</span>
              <span className="pc-foot-val">{r.case_count || 0} Linked</span>
            </span>
          </div>
          <div className="pc-foot-row" style={{ justifyContent: 'space-between' }}>
            <span className="pc-foot-item">
              <span className="pc-foot-key">Updated:</span>
              <span className="pc-foot-val">{r.updated_at ? dayjs(r.updated_at).format("MMM DD") : '—'}</span>
            </span>
            <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>Suite</Tag>
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
          display: flex; align-items: center; justify-content: center; font-size: 15px;
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
        .pp-nav-item.is-active::before {
          content: ''; position: absolute; left: -8px; top: 7px; bottom: 7px;
          width: 3px; border-radius: 0 3px 3px 0; background: #3B82F6;
        }

        .dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
        .dh-main-topbar { height: 56px; border-bottom: 1px solid var(--border-slate-200); background: transparent; display: flex; align-items: center; padding: 0 18px; justify-content: space-between; }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; background: transparent; }

        /* ── Topbar: title + subtitle on one line ───────────────────── */
        .sc-topbar { height: auto !important; min-height: 52px; padding: 8px 20px !important; }
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
        .sc-name__meta { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
        .sc-muted { color: var(--text-slate-400); }
        .cd-plain { font-size: 12.5px; color: var(--text-slate-700); }
        .sc-timeline__range { font-size: 12.5px; color: var(--text-slate-700); font-variant-numeric: tabular-nums; white-space: nowrap; }

        .sc-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 10px; border-radius: 999px; white-space: nowrap;
          font-size: 11.5px; font-weight: 600;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); color: var(--text-slate-600);
        }
        .sc-pill__dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
        .sc-pill--blue { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.22); }

        /* Reads as a quiet label, not a status — the testing type is a
           property of the suite, so it must not compete with the Cases pill. */
        .ts-type {
          display: inline-block; max-width: 100%;
          padding: 2px 9px; border-radius: 999px;
          font-size: 11.5px; font-weight: 500; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
          color: var(--text-slate-600); background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
        }

        .ts-scenario {
          display: inline-flex; align-items: center; gap: 7px; max-width: 100%;
          font-size: 12.5px; color: var(--text-slate-700);
        }
        .ts-scenario .anticon { color: var(--text-slate-400); flex-shrink: 0; }
        .ts-scenario .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .sc-rowactions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
        .sc-rowactions button {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 7px; cursor: pointer;
          border: 1px solid transparent; background: transparent; color: var(--text-slate-400);
          transition: all .15s ease;
        }
        .sc-rowactions button:hover { color: #2563eb; background: var(--bg-blue-50); border-color: #bfdbfe; }
        .sc-rowactions button.is-danger:hover { color: #dc2626; background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.25); }

        .sc-empty { padding: 44px 24px; text-align: center; }
        .sc-empty__icon { font-size: 26px; color: var(--border-slate-200); display: inline-block; }
        .sc-empty__title { margin: 12px 0 4px; font-size: 14px; font-weight: 600; color: var(--text-slate-700); }
        .sc-empty__desc { margin: 0 auto 14px; max-width: 340px; font-size: 12.5px; color: var(--text-slate-400); }

        /* ── Suite drawer chrome ───────────────────────────────────── */
        .sd-body { flex: 1; overflow-y: auto; padding: 14px 16px; background: transparent; }
        .sd-head {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
          padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100);
          background: var(--bg-pure-white);
        }
        .sd-head__icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 32px; height: 32px; border-radius: 9px; font-size: 15px;
          background: rgba(59,130,246,.1); color: #3B82F6; border: 1px solid rgba(59,130,246,.18);
        }
        .sd-head__text { flex: 1; min-width: 0; }
        .sd-head__title { margin: 0; font-size: 14px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -.01em; }
        .sd-head__sub { display: block; margin-top: 1px; font-size: 11.5px; line-height: 1.4; color: var(--text-slate-500); }
        .sd-head__close {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 28px; height: 28px; border-radius: 8px; font-size: 12px;
          color: var(--text-slate-400); background: none; border: none; cursor: pointer;
          transition: all .15s ease;
        }
        .sd-head__close:hover { color: var(--text-slate-900); background: var(--bg-slate-50); }

        .sd-foot {
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0;
          padding: 10px 16px; border-top: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50);
        }
        .sd-foot__info { font-size: 11.5px; color: var(--text-slate-500); }
        .sd-foot__info strong { color: var(--text-slate-900); font-weight: 700; }
        .sd-foot__actions { display: flex; gap: 8px; }
        .sd-foot .ant-btn { height: 32px; border-radius: 8px; font-size: 12.5px; font-weight: 600; padding: 0 14px; }

        /* ── Suite drawer: compact form density ────────────────────── */
        .sd-body .customer-drawer-card { margin-bottom: 10px !important; }
        .sd-body .customer-drawer-card > div:last-child { padding: 12px 14px !important; }
        .sd-body .customer-drawer-card > div:last-child > * + * { margin-top: 10px !important; }
        .sd-body .ant-form-item { margin-bottom: 10px !important; }
        .sd-body .ant-form-item-label { padding-bottom: 3px !important; }
        .sd-body .ant-form-item-label > label { font-size: 12px !important; font-weight: 600; height: auto !important; }
        .sd-body .ant-input, .sd-body .ant-input-affix-wrapper { border-radius: 8px !important; font-size: 12.5px; }
        .sd-body .ant-input-lg { height: 34px !important; font-size: 12.5px !important; }
        .sd-body .sd-trigger { height: 34px !important; min-height: 34px !important; padding: 0 12px !important; }

        /* Description label row with inline AI actions */
        .sd-labelrow { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 5px; }
        .sd-label { font-size: 12px; font-weight: 600; color: var(--text-slate-700); }
        .sd-labelrow__actions { display: flex; align-items: center; gap: 6px; }
        .sd-mini {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 7px;
          color: var(--text-slate-500); background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); cursor: pointer;
          transition: all .15s ease; white-space: nowrap;
        }
        .sd-mini:hover:not(:disabled) { color: #2563eb; border-color: #bfdbfe; background: var(--bg-blue-50); }
        .sd-mini--ai { color: #2563eb; border-color: #bfdbfe; background: var(--bg-blue-50); }
        .sd-mini:disabled { opacity: .55; cursor: not-allowed; }

        /* ── Link Module Test Cases ────────────────────────────────── */
        .lk-summary {
          padding: 8px 10px; margin-bottom: 8px; border-radius: 8px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
        }
        .lk-summary__row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .lk-summary__count { font-size: 12px; color: var(--text-slate-500); }
        .lk-summary__count strong { font-size: 13px; font-weight: 800; color: var(--text-slate-900); }
        .lk-summary__actions { display: flex; align-items: center; gap: 7px; }
        .lk-link {
          font-size: 11px; font-weight: 600; color: #2563eb;
          background: none; border: none; cursor: pointer; padding: 1px 0;
        }
        .lk-link:hover:not(:disabled) { text-decoration: underline; }
        .lk-link:disabled { color: var(--text-slate-300); cursor: not-allowed; }
        .lk-dot { width: 3px; height: 3px; border-radius: 999px; background: var(--border-slate-200); }
        .lk-bar { height: 3px; margin-top: 7px; border-radius: 999px; background: var(--border-slate-200); overflow: hidden; }
        .lk-bar > span { display: block; height: 100%; background: #3B82F6; transition: width .25s ease; }

        /* Search bar — reads as a filter, carries its own result counter */
        .lk-search {
          display: flex; align-items: center; gap: 8px;
          height: 38px; margin-bottom: 8px; padding: 0 8px 0 7px;
          border-radius: 9px; box-sizing: border-box;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          transition: border-color .15s ease, background .15s ease, box-shadow .15s ease;
        }
        .lk-search:hover { border-color: #bfdbfe; }
        .lk-search:focus-within {
          background: var(--bg-pure-white); border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,.12);
        }
        .lk-search__icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 24px; height: 24px; border-radius: 7px; font-size: 12px;
          background: rgba(59,130,246,.1); color: #2563eb;
          transition: background .15s ease, color .15s ease;
        }
        .lk-search.is-filled .lk-search__icon { background: #3B82F6; color: #fff; }
        .lk-search__input {
          flex: 1; min-width: 0; height: 100%;
          border: none; outline: none; background: transparent;
          font-size: 12.5px; color: var(--text-slate-900);
        }
        .lk-search__input::placeholder { color: var(--text-slate-400); }
        .lk-search__spin { flex-shrink: 0; font-size: 12px; color: #3B82F6; }
        .lk-search__hint, .lk-search__count {
          flex-shrink: 0; font-size: 10.5px; font-weight: 700; letter-spacing: .02em;
          padding: 2px 8px; border-radius: 999px; white-space: nowrap;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500);
        }
        .lk-search__count { background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.24); color: #2563eb; }
        .lk-search__clear {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 22px; height: 22px; border-radius: 6px; font-size: 10px;
          border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); transition: all .15s ease;
        }
        .lk-search__clear:hover { background: var(--bg-slate-100, #f1f5f9); color: var(--text-slate-700); }

        .lk-list {
          display: flex; flex-direction: column; gap: 5px;
          max-height: 268px; overflow-y: auto; padding-right: 3px;
          overscroll-behavior: contain;
        }
        .lk-list::-webkit-scrollbar { width: 6px; }
        .lk-list::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 999px; }

        .lk-item {
          display: flex; align-items: flex-start; gap: 9px; cursor: pointer;
          padding: 7px 10px; border-radius: 8px;
          border: 1px solid var(--border-slate-100); background: var(--bg-pure-white);
          transition: border-color .15s ease, background .15s ease;
        }
        .lk-item:hover { border-color: #bfdbfe; background: var(--bg-slate-50); }
        .lk-item.is-on { border-color: rgba(59,130,246,.4); background: rgba(59,130,246,.06); }
        .lk-item .ant-checkbox-wrapper { margin-top: 1px; }
        .lk-item__body { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
        .lk-item__top { display: flex; align-items: center; gap: 7px; min-width: 0; }
        .lk-item__id {
          flex-shrink: 0; font-size: 10.5px; font-weight: 700; letter-spacing: .02em;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          padding: 2px 6px; border-radius: 5px;
          background: rgba(59,130,246,.1); color: #2563eb;
        }
        .lk-item__name {
          font-size: 12.5px; font-weight: 600; color: var(--text-slate-900);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
        }
        .lk-item__meta { display: flex; flex-wrap: wrap; gap: 5px; }
        .lk-chip {
          font-size: 10.5px; font-weight: 600; padding: 1px 7px; border-radius: 999px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500);
        }
        .lk-item.is-on .lk-chip { background: var(--bg-pure-white); }

        /* Tail of the paged list — loader, manual trigger, end marker */
        .lk-more {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 9px 10px; margin-top: 1px; border-radius: 8px;
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-500);
        }
        .lk-more--btn {
          width: 100%; cursor: pointer; color: #2563eb;
          background: var(--bg-blue-50); border: 1px dashed #bfdbfe;
          transition: all .15s ease;
        }
        .lk-more--btn:hover { background: rgba(59,130,246,.12); border-style: solid; }
        .lk-more--end { color: var(--text-slate-400); font-weight: 500; }

        /* Holds roughly the height four rows would have taken, so the pane
           doesn't collapse and jump when the cases arrive. */
        .lk-list--loading {
          align-items: center; justify-content: center;
          min-height: 200px; overflow: hidden;
        }

        .lk-empty {
          padding: 28px 20px; text-align: center; border-radius: 10px;
          border: 1px dashed var(--border-slate-200); background: var(--bg-slate-50);
        }
        .lk-empty__icon { font-size: 20px; color: var(--border-slate-200); }
        .lk-empty__title { margin: 10px 0 3px; font-size: 13px; font-weight: 600; color: var(--text-slate-700); }
        .lk-empty__desc { margin: 0; font-size: 12px; color: var(--text-slate-400); }

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
        @media (max-width: 1024px) { .pp-grid { grid-template-columns: 1fr; } }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 8px; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 4px 14px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 14px; flex: 1; }
        .pc-avatar { width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 13px; }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 4px; flex: 1; }
        .pc-title { font-size: 15px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3; }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 12px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pc-actions { border: none; background: transparent; cursor: pointer; color: var(--text-slate-400); font-size: 16px; padding: 4px; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 11px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 12px; background: #cbd5e1; }
        
        .ts-table .ant-table-thead > tr > th {
          background: transparent !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase !important; color: var(--text-slate-500) !important;
          padding: 12px 16px !important;
        }
        .ts-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 14px 16px !important; }
        .ts-table, .ts-table .ant-table { background: transparent !important; }
        .ts-table .ant-table-tbody > tr:hover > td { background: rgba(59, 130, 246, 0.04) !important; }
        `}} />

      <div className="dh-shell">
        <aside className="dh-sidebar">
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo"><SnippetsOutlined /></div>
              <div className="pp-side-head-text">
                <h1 className="pp-side-title">Suites</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateSuite && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openCreateModal()}
                block
                className="pp-side-cta"
              >
                Create Suite
              </Button>
            )}
          </div>
          <div className="dh-sidebar-scroll">
            <span className="pp-nav-caption">Workspace</span>
            <button className="pp-nav-item is-active" onClick={() => setActiveTab("suites")}>
              <Layers size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">Suites</span>
              {suites.length > 0 && <span className="pp-nav-count">{suites.length}</span>}
            </button>
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar sc-topbar">
            {/* Title and subtitle share one line, split by a divider */}
            <div className="sc-topbar__title">
              <span className="sc-topbar__h1">All Test Suites</span>
              <span className="sc-topbar__div" />
              <span className="sc-topbar__sub">Organize child test cases from your business scenarios into executable suites</span>
            </div>

            <div className="dh-main-controls">
              <div className="pp-segmented">
                <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')} title="List View"><UnorderedListOutlined /></button>
                <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => setViewMode('grid')} title="Grid View"><AppstoreOutlined /></button>
              </div>
              {canCreateSuite && (
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openCreateModal()}>
                  New Suite
                </Button>
              )}
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Stats — product-standard tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <StatTile label="Total Suites" value={suites.length} icon={SnippetsOutlined} color="#3B82F6" bgColor="rgba(59,130,246,0.1)" sub={`${emptySuites} with no cases`} />
              <StatTile label="Scenarios Covered" value={uniqueScenarios} icon={Folder} color="#10b981" bgColor="rgba(16,185,129,0.1)" sub={`of ${parents.length} scenarios`} />
              <StatTile label="Linked Cases" value={totalLinkedCases} icon={Layers} color="#3B82F6" bgColor="rgba(59,130,246,0.1)" sub={`${avgCasesPerSuite} per suite on average`} />
              <StatTile label="Active Modules" value={modules.length} icon={CheckCircleOutlined} color="#64748b" bgColor="rgba(100,116,139,0.1)" sub="across the workspace" />
            </div>

            {/* Filter row */}
            <div className="sc-filters">
              <Input
                className="sc-filters__search"
                placeholder="Search suites, scenarios, modules…"
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
              <SearchableDropdown
                options={scenarioFilterOptions}
                value={scenarioFilter}
                onChange={(v) => setScenarioFilter(v)}
                placeholder="All scenarios"
                itemNoun="scenarios"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={moduleFilterOptions}
                value={moduleFilter}
                onChange={(v) => setModuleFilter(v)}
                placeholder="All modules"
                itemNoun="modules"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={[
                  { value: 'linked', label: 'Has linked cases' },
                  { value: 'empty', label: 'No cases yet' },
                ]}
                value={coverageFilter}
                onChange={(v) => setCoverageFilter(v)}
                placeholder="Any coverage"
                hideAvatar
                itemNoun="options"
                className="sc-filters__field"
              />
              {activeFilterCount > 0 && (
                <button type="button" className="sc-clear" onClick={clearFilters}>
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Table or Grid — only the results blur, so the filters above stay
                usable while a search refetches. */}
            <ZukvoLoadingOverlay loading={loading} message="Loading test suites…" minHeight={loading ? 320 : undefined}>
            {viewMode === 'list' ? (
              <div className="sc-tablewrap">
                <Table
                  className="ts-table sc-table"
                  dataSource={pagedSuites}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  /* The columns now total ~1210px. Without this they would be
                     squeezed on a 1280–1440px screen; scrolling keeps each one
                     at a readable width instead. */
                  scroll={{ x: 1210 }}
                  onRow={(record) => ({
                    onClick: () => router.push("/qa-workspace/test-suites/" + record.id),
                  })}
                  locale={{
                    /* Holding the height beats claiming "no suites" mid-fetch. */
                    emptyText: loading ? (
                      <div style={{ minHeight: 240 }} />
                    ) : (
                      <div className="sc-empty">
                        <SnippetsOutlined className="sc-empty__icon" />
                        <p className="sc-empty__title">{activeFilterCount > 0 ? 'No suites match these filters' : 'No test suites yet'}</p>
                        <p className="sc-empty__desc">
                          {activeFilterCount > 0
                            ? 'Try widening your search or clearing the filters.'
                            : 'Group related test cases into a suite you can run together.'}
                        </p>
                        {activeFilterCount > 0
                          ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
                          : canCreateSuite && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openCreateModal()}>Create Suite</Button>}
                      </div>
                    )
                  }}
                />
              </div>
            ) : (
              <div className="pp-grid">
                {loading ? null : filteredSuites.length === 0 ? (
                  <div className="sc-empty" style={{ gridColumn: '1 / -1' }}>
                    <SnippetsOutlined className="sc-empty__icon" />
                    <p className="sc-empty__title">{activeFilterCount > 0 ? 'No suites match these filters' : 'No test suites yet'}</p>
                    <p className="sc-empty__desc">
                      {activeFilterCount > 0 ? 'Try widening your search or clearing the filters.' : 'Group related test cases into a suite you can run together.'}
                    </p>
                    {activeFilterCount > 0
                      ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
                      : canCreateSuite && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openCreateModal()}>Create Suite</Button>}
                  </div>
                ) : (
                  pagedSuites.map(r => renderSuiteCard(r))
                )}
              </div>
            )}
            </ZukvoLoadingOverlay>
          </div>

          {/* Pager sits outside the scroll area so it stays pinned to the bottom */}
          {filteredSuites.length > 0 && (
            <div className="pp-footer">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{filteredSuites.length}</strong>
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
                  options={[10, 20, 50].map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
      </div>

    </MainLayout>
  );
}
