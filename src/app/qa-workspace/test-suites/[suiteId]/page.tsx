"use client";

import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Input, Select, Checkbox, Typography, message, Drawer, Form, Tooltip } from "antd";
import { PlusOutlined, ArrowLeftOutlined, SearchOutlined, SnippetsOutlined, FileTextOutlined, CheckCircleOutlined, BugOutlined, CloseOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useParams } from "next/navigation";
import { Layers, Zap, Pencil, Trash2, Folder, Target, Link, User } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps, SectionCard, drawerFormStyles as formStyles } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { useQaOptions } from "@/hooks/useQaOptions";

const { Text } = Typography;

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

/** Maps a lifecycle status onto the restricted pill palette. */
const statusTone = (s?: string) =>
  (s === 'Active' || s === 'Ready') ? 'green'
    : s === 'Deprecated' ? 'red'
      : s === 'Draft' ? 'ash' : 'blue';

const PRIORITY_LEVEL: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

/** Priority as filled steps — rank without extra accent colours. */
const PriorityMeter = ({ priority }: { priority?: string }) => {
  const level = PRIORITY_LEVEL[priority || ''] || 0;
  if (!level) return <span className="sc-muted">—</span>;
  return (
    <Tooltip title={`${priority} priority`}>
      <span className="sc-prio">
        <span className="sc-prio__bars">
          {[1, 2, 3, 4].map(i => (
            <span key={i} className={`sc-prio__bar${i <= level ? ' is-on' : ''}${level === 4 ? ' is-max' : ''}`} />
          ))}
        </span>
        <span className="sc-prio__label">{priority}</span>
      </span>
    </Tooltip>
  );
};

export default function TestSuiteDetailsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestSuiteDetails" });

  const router = useRouter();
  const params = useParams();
  const suiteId = params?.suiteId as string;

  const [suite, setSuite] = useState<any>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States for Add / Manage Test Cases in Suite
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ test_case_ids: [], parent_test_case_id: undefined });
  const [childTestCases, setChildTestCases] = useState<any[]>([]);
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters + pagination for the linked case list
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  /** Set by clicking the Active / Automated / High-priority stat tiles. */
  const [quickFilter, setQuickFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, priorityFilter, statusFilter, quickFilter]);

  const { canReadSuite, canUpdateSuite } = usePermission();
  // Priority options come from QA Settings
  const { priorityOptions } = useQaOptions();

  const fetchSuiteData = async () => {
    if (!suiteId) return;
    try {
      setLoading(true);
      const [suiteRes, parentsRes, modRes] = await Promise.all([
        axios.get(`/api/v2/qa/suites/${suiteId}`),
        axios.get("/api/v2/qa/parents"),
        axios.get("/api/v2/qa/modules")
      ]);

      const suiteData = suiteRes?.data || suiteRes || null;
      setSuite(suiteData);

      setParents(Array.isArray(parentsRes) ? parentsRes : (parentsRes?.data?.data || parentsRes?.data || []));
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
    } catch (error) {
      message.error("Failed to fetch test suite details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadSuite && suiteId) {
      fetchSuiteData();
    }
  }, [canReadSuite, suiteId]);

  // Fetch child test cases when parent_test_case_id or module_id is selected inside modal
  useEffect(() => {
    const fetchCases = async () => {
      if (formData.parent_test_case_id) {
        try {
          const res: any = await axios.get(`/api/v2/qa?parent_id=${formData.parent_test_case_id}`);
          const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
          setChildTestCases(list);
        } catch (e) {
          message.error("Failed to fetch child test cases for scenario");
        }
      } else if (formData.module_id) {
        try {
          const res: any = await axios.get(`/api/v2/qa?module_id=${formData.module_id}`);
          const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
          setChildTestCases(list);
        } catch (e) {
          message.error("Failed to fetch test cases for module");
        }
      } else {
        setChildTestCases([]);
      }
    };
    if (modalOpen) {
      fetchCases();
    }
  }, [formData.parent_test_case_id, formData.module_id, modalOpen]);

  const openEditModal = () => {
    setCaseSearchTerm("");
    if (suite) {
      setFormData({
        ...suite,
        parent_test_case_id: suite.parent_test_case_id || undefined,
        module_id: suite.module_id,
        test_case_ids: suite.test_cases?.map((tc: any) => tc.id) || []
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCaseSearchTerm("");
  };

  const handleSaveSuite = async () => {
    try {
      if (!formData.suite_name) return message.error("Suite Name is required");
      if (!formData.parent_test_case_id && !formData.module_id) return message.error("Parent Business Scenario is required");

      let chosenModuleId = formData.module_id;
      if (formData.parent_test_case_id) {
        const p = parents.find(x => x.id === formData.parent_test_case_id);
        if (p && p.module_id) chosenModuleId = p.module_id;
      }

      const payload = {
        ...formData,
        module_id: chosenModuleId
      };

      setSaving(true);
      await axios.put(`/api/v2/qa/suites/${suiteId}`, payload);
      message.success("Test Suite updated successfully");
      closeModal();
      fetchSuiteData();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Failed to update suite");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCaseFromSuite = async (caseId: string) => {
    try {
      const remainingIds = (suite.test_cases || []).map((tc: any) => tc.id).filter((id: string) => id !== caseId);
      await axios.put(`/api/v2/qa/suites/${suiteId}`, {
        ...suite,
        test_case_ids: remainingIds
      });
      message.success("Test case removed from suite");
      fetchSuiteData();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Failed to remove test case");
    }
  };

  const linkedCases: any[] = suite?.test_cases || [];

  const unlinkedChildCases = useMemo(() => {
    const existingIds = new Set(linkedCases.map((tc: any) => tc.id));
    return childTestCases.filter((tc: any) => !existingIds.has(tc.id));
  }, [childTestCases, linkedCases]);

  const filteredModalCases = useMemo(() => {
    if (!caseSearchTerm) return unlinkedChildCases;
    const s = caseSearchTerm.toLowerCase();
    return unlinkedChildCases.filter(tc =>
      tc.name?.toLowerCase().includes(s) ||
      tc.test_case_id?.toLowerCase().includes(s)
    );
  }, [unlinkedChildCases, caseSearchTerm]);

  const newlySelectedCount = useMemo(() => {
    const existingIds = new Set(linkedCases.map((tc: any) => tc.id));
    return (formData.test_case_ids || []).filter((id: string) => !existingIds.has(id)).length;
  }, [formData.test_case_ids, linkedCases]);

  const allFilteredSelected =
    filteredModalCases.length > 0 &&
    filteredModalCases.every((tc: any) => formData.test_case_ids?.includes(tc.id));

  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      const existing = new Set(formData.test_case_ids || []);
      filteredModalCases.forEach(tc => existing.add(tc.id));
      setFormData({ ...formData, test_case_ids: Array.from(existing) });
    } else {
      const removed = new Set(filteredModalCases.map(tc => tc.id));
      const remaining = (formData.test_case_ids || []).filter((id: string) => !removed.has(id));
      setFormData({ ...formData, test_case_ids: remaining });
    }
  };

  const handleToggleCase = (id: string, checked: boolean) => {
    const existing = new Set(formData.test_case_ids || []);
    if (checked) {
      existing.add(id);
    } else {
      existing.delete(id);
    }
    setFormData({ ...formData, test_case_ids: Array.from(existing) });
  };

  // ── Derived: stats, filters, pagination ──────────────────────────────────
  const activeCount = linkedCases.filter(t => t.status === 'Active' || t.status === 'Ready').length;
  const automatedCount = linkedCases.filter(t => t.automation === 'Automated').length;
  const highPriorityCount = linkedCases.filter(t => t.priority === 'High' || t.priority === 'Critical').length;

  const filteredCases = linkedCases.filter(c => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const hay = [c.name, c.test_case_id, c.expected_result, c.test_type].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (typeFilter && (c.test_type || 'Functional') !== typeFilter) return false;
    if (priorityFilter && (c.priority || 'Medium') !== priorityFilter) return false;
    if (statusFilter && (c.status || 'Active') !== statusFilter) return false;
    if (quickFilter === 'active' && !(c.status === 'Active' || c.status === 'Ready')) return false;
    if (quickFilter === 'automated' && c.automation !== 'Automated') return false;
    if (quickFilter === 'highPriority' && !(c.priority === 'High' || c.priority === 'Critical')) return false;
    return true;
  });

  const uniqueSorted = (values: any[]) =>
    Array.from(new Set(values.filter(Boolean)))
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map(v => ({ value: String(v), label: String(v) }));

  const typeFilterOptions = uniqueSorted(linkedCases.map(c => c.test_type || 'Functional'));
  const statusFilterOptions = uniqueSorted(linkedCases.map(c => c.status || 'Active'));

  const activeFilterCount =
    (searchTerm.trim() ? 1 : 0) + (typeFilter ? 1 : 0) + (priorityFilter ? 1 : 0) +
    (statusFilter ? 1 : 0) + (quickFilter ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter(undefined);
    setPriorityFilter(undefined);
    setStatusFilter(undefined);
    setQuickFilter(undefined);
  };

  const pageCount = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = filteredCases.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filteredCases.length);
  const pagedCases = filteredCases.slice((safePage - 1) * pageSize, safePage * pageSize);

  const columns = [
    {
      title: "Test Case",
      dataIndex: "name",
      key: "name",
      width: 340,
      render: (t: string, record: any) => (
        <div className="sc-name">
          <span className="sc-name__badge">{(record.test_case_id || '').slice(-3) || 'TC'}</span>
          <span className="sc-name__title" title={t}>{t || "Unnamed Case"}</span>
        </div>
      )
    },
    {
      title: "Type",
      dataIndex: "test_type",
      key: "test_type",
      width: 130,
      render: (t: string) => <span className="cd-plain">{t || 'Functional'}</span>
    },
    {
      title: "Automation",
      dataIndex: "automation",
      key: "automation",
      width: 130,
      render: (t: string) => (
        <span className={`sc-pill sc-pill--${t === 'Automated' ? 'blue' : 'ash'}`}>
          <span className="sc-pill__dot" />{t || 'Manual'}
        </span>
      )
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 130,
      render: (t: string) => <PriorityMeter priority={t || 'Medium'} />
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (t: string) => {
        const v = t || 'Active';
        return <span className={`sc-pill sc-pill--${statusTone(v)}`}><span className="sc-pill__dot" />{v}</span>;
      }
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "right" as const,
      render: (_: any, record: any) => (
        <div className="sc-rowactions" onClick={e => e.stopPropagation()}>
          <Tooltip title="Open in scenario">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const targetId = record.parent_test_case_id || record.parent_id || suite?.parent_test_case_id || record.id;
                router.push(`/qa-workspace/test-cases/${targetId}`);
              }}
              aria-label="Open in scenario"
            >
              <Pencil size={15} />
            </button>
          </Tooltip>
          <ConfirmDialog
            tone="danger"
            title="Remove from Suite?"
            description={`Are you sure you want to remove "${record.name || 'this case'}" from this test suite?`}
            confirmText="Remove"
            onConfirm={() => handleRemoveCaseFromSuite(record.id)}
          >
            <Tooltip title="Remove from suite">
              <button className="is-danger" onClick={(e) => e.stopPropagation()} aria-label="Remove from suite">
                <Trash2 size={15} />
              </button>
            </Tooltip>
          </ConfirmDialog>
        </div>
      )
    }
  ];

  const parentScenario = parents.find(p => p.id === suite?.parent_test_case_id);
  const moduleItem = modules.find(m => m.id === suite?.module_id);

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{
        __html: `
        .dh-shell { display: flex; height: calc(100vh - 64px); background: transparent; overflow: hidden; position: relative; }
        .dh-sidebar {
          width: 220px; background: transparent; border-right: 1px solid var(--border-slate-200);
          display: flex; flex-direction: column; z-index: 10; flex-shrink: 0;
        }
        .dh-sidebar-top { padding: 12px 10px 10px; flex-shrink: 0; border-bottom: 1px solid var(--border-slate-100); }
        .pp-side-head { display: flex; align-items: center; gap: 9px; margin-bottom: 0; padding: 0 2px; }
        .pp-side-logo {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          background: var(--bg-blue-50, rgba(59,130,246,0.1)); color: #3B82F6;
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
        .pp-nav-icon { flex-shrink: 0; color: var(--text-slate-400); font-size: 14px; transition: color .15s ease; }
        .pp-nav-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pp-nav-count {
          flex-shrink: 0; min-width: 20px; padding: 1px 6px; border-radius: 999px;
          font-size: 10.5px; font-weight: 700; text-align: center;
          background: var(--bg-slate-50); color: var(--text-slate-500);
          border: 1px solid var(--border-slate-100); transition: all .15s ease;
        }
        .pp-nav-item:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .pp-nav-item:hover .pp-nav-icon { color: var(--text-slate-600); }
        .pp-nav-item.is-active { background: var(--bg-blue-50, rgba(59,130,246,0.1)); color: #3B82F6; font-weight: 650; }
        .pp-nav-item.is-active .pp-nav-icon { color: #3B82F6; }
        .pp-nav-item.is-active .pp-nav-count { background: rgba(59,130,246,.14); color: #2563eb; border-color: transparent; }
        .pp-nav-item.is-active::before {
          content: ''; position: absolute; left: -8px; top: 7px; bottom: 7px;
          width: 3px; border-radius: 0 3px 3px 0; background: #3B82F6;
        }

        /* Suite summary card in the rail */
        .cd-side {
          margin: 2px 0 0; padding: 16px;
          border: 1px solid var(--border-slate-200); border-radius: 12px;
          background: transparent;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .cd-meta { margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .cd-meta__row { 
          display: flex; flex-direction: column; align-items: flex-start; gap: 4px; 
          margin: 0; width: 100%; 
        }
        .cd-meta__row dt { 
          display: flex; align-items: center;
          font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; 
          color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; 
        }
        .cd-meta__row dd {
          margin: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-800);
          text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;
        }

        .dh-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: transparent; }
        .dh-main-topbar { height: 68px; padding: 0 24px; border-bottom: 1px solid var(--border-slate-200); display: flex; align-items: center; justify-content: space-between; background: transparent; flex-shrink: 0; }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; }

        /* ── Topbar: one line ───────────────────────────────────────── */
        .sc-topbar { height: auto !important; min-height: 52px; padding: 8px 20px !important; }
        .sc-topbar__title { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
        .sc-topbar__h1 { font-size: 15px; font-weight: 700; color: var(--text-slate-900); }
        .sc-topbar__div { width: 1px; height: 14px; background: var(--border-slate-200); flex-shrink: 0; }
        .cd-back { flex-shrink: 0; }
        .cd-crumb {
          font-size: 11px; text-transform: uppercase; letter-spacing: .12em; font-weight: 600;
          color: var(--text-slate-400); white-space: nowrap; flex-shrink: 0;
        }
        .cd-crumb--strong { color: var(--text-slate-600); max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
        .cd-sep { color: var(--border-slate-200); flex-shrink: 0; }
        .cd-title { min-width: 0; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dh-main-controls { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .sc-topbar .dh-main-controls .ant-btn { height: 32px !important; border-radius: 8px; }
        @media (max-width: 900px) { .cd-crumb, .cd-sep, .sc-topbar__div { display: none; } }

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

        /* ── Table cells ────────────────────────────────────────────── */
        .sc-tablewrap { background: transparent; border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .sc-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; padding: 8px 14px !important; letter-spacing: .06em !important; }
        .sc-table .ant-table-tbody > tr > td { padding: 8px 14px !important; }
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
        .sc-name__title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
        .cd-plain { font-size: 12.5px; color: var(--text-slate-700); }
        .sc-muted { color: var(--text-slate-400); }

        .sc-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 10px; border-radius: 999px; white-space: nowrap;
          font-size: 11.5px; font-weight: 600;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); color: var(--text-slate-600);
        }
        .sc-pill__dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
        .sc-pill--blue { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.22); }
        .sc-pill--green { color: #047857; background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.24); }
        .sc-pill--red { color: #dc2626; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.22); }
        .sc-pill--ash { color: #64748b; background: rgba(100,116,139,.1); border-color: rgba(100,116,139,.2); }

        .sc-prio { display: inline-flex; align-items: center; gap: 8px; }
        .sc-prio__bars { display: inline-flex; align-items: flex-end; gap: 2px; }
        .sc-prio__bar { width: 4px; height: 12px; border-radius: 2px; background: var(--border-slate-200); }
        .sc-prio__bar.is-on { background: #60a5fa; }
        .sc-prio__bar.is-on.is-max { background: #2563eb; }
        .sc-prio__label { font-size: 12px; font-weight: 500; color: var(--text-slate-600); }

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

        /* ── Select Cases to Add ───────────────────────────────────── */
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

        /* Compact search that reads as a filter, not a form field */
        .lk-search.ant-input-affix-wrapper {
          height: 32px !important; min-height: 32px !important;
          margin-bottom: 8px; border-radius: 8px; padding: 0 10px;
          background: var(--bg-pure-white); border-color: var(--border-slate-200);
          transition: all .15s ease;
        }
        .lk-search.ant-input-affix-wrapper:hover { border-color: #bfdbfe; }
        .lk-search.ant-input-affix-wrapper-focused {
          border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59,130,246,.12);
        }
        .lk-search .ant-input { background: transparent !important; font-size: 12.5px; }
        .lk-search .ant-input-prefix { margin-inline-end: 7px; }

        .lk-list {
          display: flex; flex-direction: column; gap: 5px;
          max-height: 268px; overflow-y: auto; padding-right: 3px;
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

        .lk-empty {
          padding: 28px 20px; text-align: center; border-radius: 10px;
          border: 1px dashed var(--border-slate-200); background: var(--bg-slate-50);
        }
        .lk-empty__icon { font-size: 20px; color: var(--border-slate-200); }
        .lk-empty__icon--ok { color: #10b981; }
        .lk-empty__title { margin: 10px 0 3px; font-size: 13px; font-weight: 600; color: var(--text-slate-700); }
        .lk-empty__desc { margin: 0; font-size: 12px; color: var(--text-slate-400); }

        /* ── Pager pinned to the bottom ─────────────────────────────── */
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

        .ts-table .ant-table {
          background: transparent !important;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-thead > tr > th {
          background: rgba(248, 250, 252, 0.6) !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-slate-400);
          letter-spacing: 0.04em;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-200) !important;
          padding: 12px 16px;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-tbody > tr:hover > td {
          background: rgba(59, 130, 246, 0.04) !important;
        }
      `}} />

      <div className="dh-shell">
        <aside className="dh-sidebar">
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo">
                <Layers />
              </div>
              <div>
                <h1 className="pp-side-title">Suites</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canUpdateSuite && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openEditModal}
                block
                className="pp-side-cta"
              >
                Add Test Case
              </Button>
            )}
          </div>

          <div className="dh-sidebar-scroll">
            <span className="pp-nav-caption">Workspace</span>
            <button className="pp-nav-item" onClick={() => router.push('/qa-workspace/test-suites')}>
              <Layers size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">All Suites</span>
            </button>
            <button className="pp-nav-item is-active">
              <FileTextOutlined className="pp-nav-icon" />
              <span className="pp-nav-label">Linked Cases</span>
              {linkedCases.length > 0 && <span className="pp-nav-count">{linkedCases.length}</span>}
            </button>

            {/* Suite summary */}
            <span className="pp-nav-caption" style={{ marginTop: 18 }}>Suite</span>
            <div className="cd-side">
              <dl className="cd-meta">
                <div className="cd-meta__row">
                  <dt><Target size={12} style={{ marginRight: 6 }} /> Scenario</dt>
                  <dd title={suite?.parent_title || parentScenario?.title}>{suite?.parent_title || parentScenario?.title || "—"}</dd>
                </div>
                <div className="cd-meta__row">
                  <dt><Folder size={12} style={{ marginRight: 6 }} /> Module</dt>
                  <dd>{suite?.module_name || moduleItem?.module_name || "Unassigned"}</dd>
                </div>
                <div className="cd-meta__row">
                  <dt><Link size={12} style={{ marginRight: 6 }} /> Linked Cases</dt>
                  <dd>{linkedCases.length}</dd>
                </div>
                <div className="cd-meta__row">
                  <dt><User size={12} style={{ marginRight: 6 }} /> Created By</dt>
                  <dd>{suite?.created_by_name || "—"}</dd>
                </div>
                {suite?.updated_by_name && suite?.updated_by_name !== suite?.created_by_name && (
                  <div className="cd-meta__row">
                    <dt><User size={12} style={{ marginRight: 6 }} /> Updated By</dt>
                    <dd>{suite.updated_by_name}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </aside>

        <main className="dh-main">
          {/* Back · breadcrumb · suite name — one line */}
          <div className="dh-main-topbar sc-topbar">
            <div className="sc-topbar__title">
              <Button
                type="text"
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/qa-workspace/test-suites")}
                className="cd-back"
              />
              <span className="sc-topbar__div" />
              <span className="cd-crumb">Suites</span>
              {(suite?.module_name || moduleItem?.module_name) && (
                <>
                  <span className="cd-sep">›</span>
                  <span className="cd-crumb cd-crumb--strong">{suite?.module_name || moduleItem?.module_name}</span>
                </>
              )}
              <span className="cd-sep">›</span>
              <h1 className="sc-topbar__h1 cd-title">{suite?.suite_name || "Loading suite…"}</h1>
              <span className="sc-pill sc-pill--blue">
                <span className="sc-pill__dot" />{linkedCases.length} linked
              </span>
            </div>

            <div className="dh-main-controls">
              {canUpdateSuite && (
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openEditModal}>
                  Add Test Case
                </Button>
              )}
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Stats — product-standard tiles, Active / Automated filter on click */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {[
                { key: undefined, label: "Linked Cases", value: linkedCases.length, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: FileTextOutlined, sub: 'in this suite' },
                { key: 'active', label: "Active", value: activeCount, color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: CheckCircleOutlined, sub: `${linkedCases.length ? Math.round((activeCount / linkedCases.length) * 100) : 0}% of the suite` },
                { key: 'automated', label: "Automated", value: automatedCount, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: BugOutlined, sub: `${linkedCases.length - automatedCount} still manual` },
                { key: 'highPriority', label: "High / Critical", value: highPriorityCount, color: "#64748b", bg: "rgba(100,116,139,0.1)", icon: Zap, sub: 'need the most attention' }
              ].map((stat, i) => {
                const clickable = !!stat.key;
                const isActive = stat.key ? quickFilter === stat.key : false;
                return (
                  <div
                    key={`${stat.label}-${i}`}
                    role={clickable ? 'button' : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={() => clickable && setQuickFilter(quickFilter === stat.key ? undefined : stat.key)}
                    onKeyDown={(e) => {
                      if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setQuickFilter(quickFilter === stat.key ? undefined : stat.key);
                      }
                    }}
                    className={clickable ? `sc-stat-hit${isActive ? ' is-active' : ''}` : undefined}
                  >
                    <StatTile label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} bgColor={stat.bg} sub={stat.sub} />
                  </div>
                );
              })}
            </div>

            {/* Filter row */}
            <div className="sc-filters">
              <Input
                className="sc-filters__search"
                placeholder="Search linked cases…"
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
              <SearchableDropdown
                options={typeFilterOptions}
                value={typeFilter}
                onChange={(v) => setTypeFilter(v)}
                placeholder="All test types"
                itemNoun="types"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={priorityOptions}
                value={priorityFilter}
                onChange={(v) => setPriorityFilter(v)}
                placeholder="Any priority"
                hideAvatar
                itemNoun="levels"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={statusFilterOptions}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                placeholder="All statuses"
                itemNoun="statuses"
                className="sc-filters__field"
              />
              {activeFilterCount > 0 && (
                <button type="button" className="sc-clear" onClick={clearFilters}>
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Linked cases */}
            <div className="sc-tablewrap">
              <Table
                className="ts-table sc-table"
                dataSource={pagedCases}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={false}
                locale={{
                  emptyText: (
                    <div className="sc-empty">
                      <FileTextOutlined className="sc-empty__icon" />
                      <p className="sc-empty__title">
                        {activeFilterCount > 0 ? 'No cases match these filters' : 'No test cases linked yet'}
                      </p>
                      <p className="sc-empty__desc">
                        {activeFilterCount > 0
                          ? 'Try widening your search or clearing the filters.'
                          : 'Map cases from the business scenario into this suite so they run together.'}
                      </p>
                      {activeFilterCount > 0
                        ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
                        : canUpdateSuite && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openEditModal}>Add Test Case</Button>}
                    </div>
                  )
                }}
              />
            </div>
          </div>

          {/* Pager sits outside the scroll area so it stays pinned to the bottom */}
          {filteredCases.length > 0 && (
            <div className="pp-footer">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{filteredCases.length}</strong>
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

      {/* Add Test Case Drawer */}
      <Drawer
        {...commonDrawerProps}
        open={modalOpen}
        onClose={closeModal}
      >
        <style>{formStyles}</style>

        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* Drawer Header */}
          <div
            className="customer-drawer-header"
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-slate-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-pure-white)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b82f6",
                }}
              >
                <SnippetsOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-slate-900)" }}>
                  Add Test Cases to Suite
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                  Select available test cases to link to this suite
                </span>
              </div>
            </div>

            <Button
              type="text"
              icon={<CloseOutlined style={{ fontSize: 16, color: "var(--text-slate-400)" }} />}
              onClick={closeModal}
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
          </div>

          {/* Drawer Body */}
          <div className="dh-sidebar-scroll" style={{ flex: 1, padding: "24px", overflowY: "auto", background: "var(--bg-slate-50)" }}>
            <Form layout="vertical" className="customer-drawer-form">
              <SectionCard
                step="STEP 1"
                icon={<FileTextOutlined />}
                title="Suite Information"
                subtitle="Review or update core details for this suite"
              >
                <Form.Item label="Suite Name" required style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="E.g. Smoke Test Suite"
                    value={formData.suite_name}
                    onChange={(e) => setFormData({ ...formData, suite_name: e.target.value })}
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item label="Associated Test Case (Business Scenario)" required style={{ marginBottom: 16 }}>
                  <SearchableDropdown
                    options={parents.map((p: any) => ({
                      value: p.id,
                      label: `${p.title} (${p.module_name || "No Module"})`,
                      description: p.module_name ? `Module: ${p.module_name}` : "No Module assigned",
                    }))}
                    value={formData.parent_test_case_id || (formData.module_id && !formData.parent_test_case_id ? `module-${formData.module_id}` : undefined)}
                    onChange={(val: any) => {
                      if (!val) {
                        setFormData({ ...formData, parent_test_case_id: undefined, module_id: undefined, test_case_ids: [] });
                      } else if (typeof val === 'string' && val.startsWith('module-')) {
                        setFormData({ ...formData, module_id: val.replace('module-', ''), parent_test_case_id: undefined, test_case_ids: [] });
                      } else {
                        const selectedParent = parents.find(p => p.id === val);
                        setFormData({
                          ...formData,
                          parent_test_case_id: val,
                          module_id: selectedParent ? selectedParent.module_id : formData.module_id,
                          test_case_ids: []
                        });
                      }
                    }}
                    placeholder="Select a Business Scenario to load its test cases"
                    style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item label="Description" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    placeholder="Describe the goals and coverage of this test suite..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </SectionCard>

              {(formData.parent_test_case_id || formData.module_id) && (
                <SectionCard
                  step="STEP 2"
                  icon={<CheckCircleOutlined />}
                  title="Select Cases to Add"
                  subtitle="Choose from remaining available test cases in this scenario"
                >
                  {/* Selection summary + coverage bar */}
                  <div className="lk-summary">
                    <div className="lk-summary__row">
                      <span className="lk-summary__count">
                        <strong>{newlySelectedCount}</strong> of {unlinkedChildCases.length} available selected
                      </span>
                      <div className="lk-summary__actions">
                        <button
                          type="button"
                          className="lk-link"
                          onClick={() => filteredModalCases.forEach((tc: any) => handleToggleCase(tc.id, true))}
                          disabled={filteredModalCases.length === 0 || allFilteredSelected}
                        >
                          Select {caseSearchTerm ? 'filtered' : 'all'}
                        </button>
                        <span className="lk-dot" />
                        <button
                          type="button"
                          className="lk-link"
                          onClick={() => filteredModalCases.forEach((tc: any) => handleToggleCase(tc.id, false))}
                          disabled={newlySelectedCount === 0}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="lk-bar">
                      <span style={{ width: `${unlinkedChildCases.length ? (newlySelectedCount / unlinkedChildCases.length) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <Input
                    placeholder="Search available cases by name or ID…"
                    prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                    value={caseSearchTerm}
                    onChange={(e) => setCaseSearchTerm(e.target.value)}
                    className="lk-search"
                    allowClear
                  />

                  {childTestCases.length === 0 ? (
                    <div className="lk-empty">
                      <FileTextOutlined className="lk-empty__icon" />
                      <p className="lk-empty__title">No cases in this scenario</p>
                      <p className="lk-empty__desc">Add cases inside the business scenario first, then link them here.</p>
                    </div>
                  ) : unlinkedChildCases.length === 0 ? (
                    <div className="lk-empty">
                      <CheckCircleOutlined className="lk-empty__icon lk-empty__icon--ok" />
                      <p className="lk-empty__title">Everything is already linked</p>
                      <p className="lk-empty__desc">All {childTestCases.length} cases from this scenario are in the suite.</p>
                    </div>
                  ) : filteredModalCases.length === 0 ? (
                    <div className="lk-empty">
                      <SearchOutlined className="lk-empty__icon" />
                      <p className="lk-empty__title">No cases match “{caseSearchTerm}”</p>
                      <p className="lk-empty__desc">Try a different name or case ID.</p>
                    </div>
                  ) : (
                    <div className="lk-list">
                      {filteredModalCases.map((tc: any) => {
                        const checked = formData.test_case_ids?.includes(tc.id);
                        return (
                          <label key={tc.id} className={`lk-item${checked ? ' is-on' : ''}`}>
                            <Checkbox
                              checked={checked}
                              onChange={(e) => handleToggleCase(tc.id, e.target.checked)}
                            />
                            <span className="lk-item__body">
                              <span className="lk-item__top">
                                <code className="lk-item__id">{tc.test_case_id || 'TC'}</code>
                                <span className="lk-item__name" title={tc.name}>{tc.name}</span>
                              </span>
                              <span className="lk-item__meta">
                                {tc.priority && <span className="lk-chip">{tc.priority}</span>}
                                {tc.test_type && <span className="lk-chip">{tc.test_type}</span>}
                                {tc.status && <span className="lk-chip">{tc.status}</span>}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>
              )}
            </Form>
          </div>

          {/* Drawer Footer */}
          <div
            className="customer-drawer-footer"
            style={{
              padding: "14px 24px",
              borderTop: "1px solid var(--border-slate-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-pure-white)",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
              {newlySelectedCount > 0 ? `Adding ${newlySelectedCount} new cases (${formData.test_case_ids?.length || 0} total)` : `${formData.test_case_ids?.length || 0} total cases in suite`}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={closeModal} style={{ borderRadius: 8, fontWeight: 600, padding: "0 18px", height: 36 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={saving}
                onClick={handleSaveSuite}
                style={{ borderRadius: 8, fontWeight: 600, padding: "0 22px", height: 36, background: "#3B82F6" }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </MainLayout>
  );
}
