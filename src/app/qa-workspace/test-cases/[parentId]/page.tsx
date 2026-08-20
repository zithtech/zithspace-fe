"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Dropdown, message, Drawer, Input, Select, Breadcrumb, Row, Col, Typography, Form, Tooltip } from "antd";
import { PlusOutlined, EllipsisOutlined, ArrowLeftOutlined, SaveOutlined, InfoCircleOutlined, FileTextOutlined, BugOutlined, CheckCircleOutlined, LinkOutlined, SnippetsOutlined, CloseOutlined, SearchOutlined, SortAscendingOutlined, SortDescendingOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useParams } from "next/navigation";
import { Target, Trash2, Pencil, Folder, ShieldCheck, User, Zap, Activity, Layers, Sparkles, Menu, RotateCw } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios, apiClient } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps, SectionCard, drawerFormStyles as formStyles } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { useDebounce } from "@/hooks/useDebounce";
import { useQaOptions } from "@/hooks/useQaOptions";

const { TextArea } = Input;

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

function initialsOf(name: string) {
  if (!name) return 'TC';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ParentTestCaseDetailsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestCaseDetails" });

  const router = useRouter();
  const params = useParams();
  const parentId = params?.parentId as string;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [parentData, setParentData] = useState<any>(null);
  const [childCases, setChildCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suitesDrawerOpen, setSuitesDrawerOpen] = useState(false);
  const [selectedCaseForSuites, setSelectedCaseForSuites] = useState<any>(null);

  // Read-only case view, opened by clicking a row
  const [viewOpen, setViewOpen] = useState(false);
  const [viewCase, setViewCase] = useState<any>(null);

  // Filters + pagination for the module case list
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, priorityFilter, statusFilter, sortOrder]);

  // Drawer state for Create / Edit Child Test Case
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newStepInput, setNewStepInput] = useState("");

  // "Create with Zai" — drafts the case from a plain-language description
  const [zaiOpen, setZaiOpen] = useState(true);
  const [zaiPrompt, setZaiPrompt] = useState("");
  const [zaiGenerating, setZaiGenerating] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    preconditions: string;
    steps_to_reproduce: string[];
    expected_result: string;
    priority: string;
    severity: string;
    test_type?: string;
    automation: string;
    status: string;
  }>({
    name: "",
    description: "",
    preconditions: "",
    steps_to_reproduce: [],
    expected_result: "",
    priority: "Medium",
    severity: "Major",
    test_type: undefined,
    automation: "Manual",
    status: "Active"
  });

  const { canReadCase, canCreateCase } = usePermission();
  // Priority / severity / type come from QA Settings
  const { priorityOptions, severityOptions, testTypeOptions } = useQaOptions();

  const parseSteps = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (e) {}
    if (typeof val === "string") {
      return val
        .split("\n")
        .map((s) => s.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);
    }
    return [];
  };

  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async () => {
    if (!parentId) return;
    try {
      setLoading(true);
      const [parentRes, childRes] = await Promise.all([
        axios.get(`/api/v2/qa/parents/${parentId}`),
        apiClient.get(`/api/v2/qa`, {
          params: { 
            parent_id: parentId, 
            page, 
            pageSize,
            search: debouncedSearch || undefined,
            test_type: typeFilter || undefined,
            priority: priorityFilter || undefined,
            status: statusFilter || undefined,
            sort: sortOrder || 'position_asc'
          }
        })
      ]);
      setParentData(parentRes?.data?.data || parentRes?.data || parentRes || null);
      
      const body = (childRes as any).data;
      setChildCases(body?.data || []);
      setTotalItems(body?.pagination?.total || 0);
    } catch (error) {
      message.error("Failed to load test scenario details");
      router.push("/qa-workspace/test-cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadCase && parentId) {
      fetchData();
    }
  }, [canReadCase, parentId, page, pageSize, debouncedSearch, typeFilter, priorityFilter, statusFilter, sortOrder]);

  /**
   * Draft the case from the tester's description. Only fills fields the user
   * hasn't already written in, so a partly-filled form is never clobbered.
   */
  const handleZaiGenerate = async () => {
    const prompt = zaiPrompt.trim();
    if (!prompt || zaiGenerating) return;
    setZaiGenerating(true);
    try {
      const res: any = await axios.post('/api/v2/qa/generate-ai', {
        prompt,
        scenarioTitle: parentData?.title,
        moduleName: parentData?.module_name,
        feature: parentData?.feature,
      });
      const d = res?.data?.data ?? res?.data ?? res;
      if (!d?.name && !(d?.steps_to_reproduce?.length)) {
        message.error('Zai returned nothing usable. Try describing the case in more detail.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        name: prev.name.trim() || d.name || prev.name,
        description: prev.description.trim() || d.description || prev.description,
        preconditions: prev.preconditions.trim() || d.preconditions || prev.preconditions,
        steps_to_reproduce: prev.steps_to_reproduce.length ? prev.steps_to_reproduce : (d.steps_to_reproduce || []),
        expected_result: prev.expected_result.trim() || d.expected_result || prev.expected_result,
        test_type: prev.test_type || d.test_type || prev.test_type,
        priority: d.priority || prev.priority,
        severity: d.severity || prev.severity,
      }));

      setZaiOpen(false);
      message.success('Zai drafted the case — review it before saving.');
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.error || 'Failed to draft the test case');
    } finally {
      setZaiGenerating(false);
    }
  };

  const handleOpenCreateDrawer = () => {
    setEditingCaseId(null);
    setNewStepInput("");
    setZaiPrompt("");
    setZaiGenerating(false);
    setZaiOpen(true);
    setFormData({
      name: "",
      description: "",
      preconditions: "",
      steps_to_reproduce: [],
      expected_result: "",
      priority: "Medium",
      severity: "Major",
      test_type: undefined,
      automation: parentData?.automation || "Manual",
      status: "Active"
    });
    setDrawerOpen(true);
  };

  const handleOpenEditDrawer = (record: any) => {
    setEditingCaseId(record.id);
    setNewStepInput("");
    setZaiPrompt("");
    setZaiGenerating(false);
    setZaiOpen(false); // editing starts from existing content, not a blank draft
    setFormData({
      name: record.name || "",
      description: record.description || "",
      preconditions: record.preconditions || "",
      steps_to_reproduce: parseSteps(record.steps_to_reproduce),
      expected_result: record.expected_result || "",
      priority: record.priority || "Medium",
      severity: record.severity || "Major",
      test_type: record.test_type || undefined,
      automation: record.automation || "Manual",
      status: record.status || "Active"
    });
    setDrawerOpen(true);
  };

  const handleSaveChildCase = async (addAnother: boolean = false) => {
    if (!formData.name.trim()) {
      message.error("Please enter a Test Case Name");
      return;
    }
    try {
      setSubmitting(true);
      const finalSteps = [...(formData.steps_to_reproduce || [])];
      if (newStepInput.trim()) {
        finalSteps.push(newStepInput.trim());
        setNewStepInput("");
      }
      const payload = {
        ...formData,
        steps_to_reproduce: JSON.stringify(finalSteps),
        parent_test_case_id: parentId,
        module_id: parentData?.module_id || null,
        feature: parentData?.feature || null
      };

      if (editingCaseId) {
        await axios.put(`/api/v2/qa/${editingCaseId}`, payload);
        message.success("Test case updated successfully!");
        setDrawerOpen(false);
      } else {
        await axios.post(`/api/v2/qa`, payload);
        message.success("Module Test Case created successfully!");
        if (addAnother) {
          setNewStepInput("");
          // Reset form for next entry without closing drawer or losing context
          setFormData({
            name: "",
            description: "",
            preconditions: "",
            steps_to_reproduce: [],
            expected_result: "",
            priority: "Medium",
            severity: "Major",
            test_type: undefined,
            automation: parentData?.automation || "Manual",
            status: "Active"
          });
        } else {
          setDrawerOpen(false);
        }
      }
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to save test case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChild = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/api/v2/qa/${id}`);
      message.success("Test case deleted successfully");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to delete test case");
    }
  };


  const childColumns = [
    {
      title: "Test Case",
      dataIndex: "name",
      key: "name",
      width: 380,
      // Single line by design — the expected result lives in the view drawer
      render: (t: string, record: any) => (
        <div className="sc-name">
          <span className="sc-name__badge">{(record.test_case_id || '').slice(-3) || initialsOf(t || '')}</span>
          <span className="sc-name__title" title={t}>{t || 'Untitled case'}</span>
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
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 130,
      render: (t: string) => <PriorityMeter priority={t || 'Medium'} />
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      width: 110,
      render: (t: string) => <span className="cd-plain">{t || 'Major'}</span>
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
      title: "Suites",
      dataIndex: "suite_count",
      key: "suite_count",
      width: 110,
      render: (_: any, record: any) => {
        const count = record.test_suites?.length || record.suite_count || 0;
        if (!count) return <span className="sc-muted">—</span>;
        return (
          <button
            type="button"
            className="tc-suites"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCaseForSuites(record);
              setSuitesDrawerOpen(true);
            }}
            title="View linked Test Suites"
          >
            <LinkOutlined />
            <span>{count}</span>
          </button>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "right" as const,
      render: (_: any, record: any) => (
        <div className="sc-rowactions" onClick={e => e.stopPropagation()}>
          <Tooltip title="Edit">
            <button onClick={(e) => { e.stopPropagation(); handleOpenEditDrawer(record); }} aria-label="Edit">
              <Pencil size={15} />
            </button>
          </Tooltip>
          <ConfirmDialog
            tone="danger"
            title="Delete Module Test Case?"
            description={`Are you sure you want to delete "${record.name}" (${record.test_case_id})?`}
            confirmText="Delete"
            onConfirm={() => handleDeleteChild(record.id)}
          >
            <Tooltip title="Delete">
              <button className="is-danger" onClick={(e) => e.stopPropagation()} aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </Tooltip>
          </ConfirmDialog>
        </div>
      )
    }
  ];

  // ── Derived: stats, filters, pagination ──────────────────────────────────
  const activeCount = childCases.filter(t => t.status === 'Active' || t.status === 'Ready').length;
  const automatedCount = childCases.filter(t => t.automation === 'Automated').length;
  const highPriorityCount = childCases.filter(t => t.priority === 'High' || t.priority === 'Critical').length;

  const filteredCases = childCases;

  const uniqueSorted = (values: any[]) =>
    Array.from(new Set(values.filter(Boolean)))
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map(v => ({ value: String(v), label: String(v) }));

  const typeFilterOptions = uniqueSorted(childCases.map(c => c.test_type || 'Functional'));
  const statusFilterOptions = uniqueSorted(childCases.map(c => c.status || 'Active'));

  const activeFilterCount = (searchTerm.trim() ? 1 : 0) + (typeFilter ? 1 : 0) + (priorityFilter ? 1 : 0) +
    (statusFilter ? 1 : 0);
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter(undefined);
    setPriorityFilter(undefined);
    setStatusFilter(undefined);
    setSortOrder("asc");
  };



  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, totalItems);
  const pagedCases = childCases;

  // Same gate the sibling QA pages use — the fetch above already sits behind
  // canReadCase, so without this an unpermitted user would get empty chrome.
  if (!canReadCase) return null;

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

        /* Scenario summary card in the rail */
        .cd-side {
          margin: 2px 0 0; padding: 12px;
          border: 1px solid var(--border-slate-200); border-radius: 12px;
          background: transparent;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .cd-meta { margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .cd-meta__row { 
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 10px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          transition: all 0.2s ease;
          width: 100%;
        }
        .cd-meta__row:hover {
          background: var(--bg-pure-white);
          border-color: var(--border-slate-200);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transform: translateY(-1px);
        }
        .cd-meta__icon-box {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .cd-meta__content {
          display: flex; flex-direction: column; min-width: 0; flex: 1;
        }
        .cd-meta__row dt { 
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; 
          color: var(--text-slate-400); font-weight: 700; margin-bottom: 2px;
        }
        .cd-meta__row dd {
          margin: 0; font-size: 13px; font-weight: 600; color: var(--text-slate-800);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;
        }

        .dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
        .dh-main-topbar { height: auto; min-height: 64px; border-bottom: 1px solid var(--border-slate-200); background: transparent; display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; background: transparent; }

        /* ── Topbar: one line ───────────────────────────────────────── */
        .sc-topbar { min-height: 52px !important; padding: 8px 20px !important; }
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
        .sc-topbar .dh-main-controls { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
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
        .sc-filters .sd-trigger, .sc-filters .ant-select-selector { height: 32px !important; min-height: 32px !important; border-radius: 8px !important; padding-block: 0 !important; align-items: center; }
        .sc-clear {
          height: 32px; display: inline-flex; align-items: center;
          font-size: 12px; font-weight: 600; color: #3b82f6;
          padding: 0 11px; border-radius: 8px;
          border: 1px solid var(--border-slate-200); background: transparent;
          cursor: pointer; transition: all .15s ease;
        }
        .sc-clear:hover { background: var(--bg-blue-50); border-color: #bfdbfe; }
        .sc-sort-btn {
          height: 32px; width: 32px; display: inline-flex; align-items: center; justify-content: center;
          border-radius: 8px; border: 1px solid var(--border-slate-200); background: transparent;
          color: var(--text-slate-600); cursor: pointer; transition: all .15s ease; font-size: 16px;
        }
        .sc-sort-btn:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }

        /* ── Table cells ────────────────────────────────────────────── */
        .sc-tablewrap { background: transparent; border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
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

        .sc-person { display: inline-flex; align-items: center; gap: 7px; min-width: 0; }
        .sc-person__av {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 20px; height: 20px; border-radius: 999px;
          background: rgba(59,130,246,.12); color: #2563eb; font-size: 8.5px; font-weight: 700;
        }
        .sc-person__name { font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; text-overflow: ellipsis; }

        .tc-suites {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 999px; cursor: pointer;
          font-size: 11.5px; font-weight: 600;
          color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.22);
          transition: all .15s ease;
        }
        .tc-suites:hover { background: rgba(59,130,246,.18); }

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

        /* ── Case view drawer (compact, read-only) ──────────────────── */
        .cv { display: flex; flex-direction: column; height: 100%; background: var(--bg-pure-white); }
        .cv__head {
          display: flex; align-items: center; gap: 9px;
          padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50); flex-shrink: 0;
        }
        .cv__id {
          font-size: 11px; font-weight: 700; letter-spacing: .06em;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          padding: 3px 8px; border-radius: 6px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-600);
        }
        .cv__close {
          margin-left: auto; display: inline-flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 7px; font-size: 12px;
          color: var(--text-slate-400); background: none; border: none; cursor: pointer;
          transition: all .15s ease;
        }
        .cv__close:hover { color: var(--text-slate-900); background: var(--border-slate-100); }

        .cv__body { flex: 1; overflow-y: auto; padding: 18px 20px; }
        .cv__titlerow { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
        .cv__titleicon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 28px; height: 28px; border-radius: 8px; font-size: 13px; margin-top: 1px;
          background: rgba(59,130,246,.1); color: #2563eb; border: 1px solid rgba(59,130,246,.18);
        }
        .cv__title {
          margin: 0; font-size: 15.5px; font-weight: 700; line-height: 1.4;
          color: var(--text-slate-900); letter-spacing: -.01em;
        }
        .cv__facts {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
          background: var(--border-slate-100); border: 1px solid var(--border-slate-100);
          border-radius: 10px; overflow: hidden; margin-bottom: 20px;
        }
        @media (max-width: 620px) { .cv__facts { grid-template-columns: repeat(2, 1fr); } }
        .cv__fact {
          display: flex; flex-direction: column; gap: 4px;
          padding: 9px 11px; background: var(--bg-pure-white);
        }
        .cv__fact-key { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-slate-400); }
        .cv__fact-val { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }

        .cv__sec { margin-bottom: 20px; }
        .cv__sec-title {
          display: flex; align-items: center; gap: 8px; margin: 0 0 9px;
          font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--text-slate-500);
        }
        .cv__sec-icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 20px; height: 20px; border-radius: 6px; font-size: 11px;
          background: var(--bg-slate-50); color: var(--text-slate-400);
          border: 1px solid var(--border-slate-100);
        }
        .cv__sec-icon--ok { background: rgba(16,185,129,.1); color: #059669; border-color: rgba(16,185,129,.2); }
        /* Dotted rule fills the rest of the heading line */
        .cv__rule { flex: 1; min-width: 16px; border-top: 1px dashed var(--border-slate-200); }
        .cv__count {
          min-width: 18px; padding: 0 6px; border-radius: 999px; letter-spacing: 0;
          font-size: 10px; font-weight: 700; text-align: center;
          background: var(--bg-slate-50); color: var(--text-slate-500);
          border: 1px solid var(--border-slate-100);
        }
        .cv__text { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--text-slate-700); white-space: pre-wrap; }
        .cv__empty { margin: 0; font-size: 12.5px; color: var(--text-slate-400); font-style: italic; }
        .cv__steps { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
        .cv__steps li {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 8px 10px; border-radius: 8px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
          font-size: 12.5px; line-height: 1.5; color: var(--text-slate-700);
        }
        .cv__step-n {
          flex-shrink: 0; width: 18px; height: 18px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; margin-top: 1px;
          background: rgba(59,130,246,.12); color: #2563eb;
        }
        .cv__expected {
          margin: 0; padding: 10px 12px; border-radius: 8px;
          font-size: 12.5px; line-height: 1.55; white-space: pre-wrap;
          background: rgba(16,185,129,.07); border: 1px solid rgba(16,185,129,.22);
          color: #065f46;
        }
        .cv__foot {
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
          padding: 12px 16px; border-top: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50);
        }
        .cv__foot .ant-btn { height: 32px; border-radius: 8px; font-size: 12.5px; }

        /* ── Create with Zai panel (drawer) ─────────────────────────── */
        .zai-draft {
          margin-bottom: 18px; padding: 12px 14px; border-radius: 12px;
          border: 1px solid rgba(59,130,246,.28); background: rgba(59,130,246,.05);
        }
        .zai-draft__head { display: flex; align-items: flex-start; gap: 10px; }
        .zai-draft__icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 26px; height: 26px; border-radius: 8px;
          background: rgba(59,130,246,.14); color: #2563eb;
        }
        .zai-draft__title { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); }
        .zai-draft__sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; line-height: 1.4; }
        .zai-draft__toggle {
          margin-left: auto; flex-shrink: 0; font-size: 11.5px; font-weight: 600; color: #2563eb;
          background: none; border: none; cursor: pointer; padding: 2px 4px;
        }
        .zai-draft__input {
          margin-top: 10px !important; border-radius: 8px !important;
          background: var(--bg-pure-white) !important; font-size: 12.5px;
        }
        .zai-draft__row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-top: 10px; flex-wrap: wrap;
        }
        .zai-draft__chips { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; min-width: 0; }
        .zai-draft__chip {
          font-size: 11px; padding: 3px 9px; border-radius: 999px; cursor: pointer;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500); transition: all .15s ease;
          max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .zai-draft__chip:hover { color: #2563eb; border-color: rgba(59,130,246,.4); }
        .zai-draft__reopen {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
          font-size: 11.5px; font-weight: 600; color: #2563eb;
          background: none; border: none; cursor: pointer; padding: 0;
        }

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

        .ts-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase !important; color: var(--text-slate-500) !important;
          white-space: nowrap !important;
          padding: 12px 16px !important;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 12px 16px !important;
        }
        .ts-table, .ts-table .ant-table, .ts-table .ant-table-container {
          background: transparent !important;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-tbody > tr:hover > td {
          background: rgba(59, 130, 246, 0.04) !important;
        }

        .form-label { display: block; font-weight: 600; font-size: 13px; color: var(--text-slate-800); margin-bottom: 6px; }

        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0 !important; min-width: 236px;
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
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu {
          background: #0B0F1A !important;
          border-radius: 0 !important;
          overflow: hidden !important;
          border: 1px solid #1E293B !important;
        }
        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item:hover {
          background: #161B22 !important;
        }
        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item-divider {
          background: #1E293B !important;
        }
        [data-theme='dark'] .pp-menu-title {
          color: #cbd5e1 !important;
        }
        [data-theme='dark'] .pp-menu-desc {
          color: #64748b !important;
        }
        ${formStyles}

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
                <BugOutlined />
              </div>
              <div>
                <h1 className="pp-side-title">Cases</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateCase && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreateDrawer}
                block
                className="pp-side-cta"
              >
                Create Module Case
              </Button>
            )}
          </div>

          <div className="dh-sidebar-scroll">
            <span className="pp-nav-caption">Workspace</span>
            <button className="pp-nav-item" onClick={() => router.push('/qa-workspace/test-cases')}>
              <Folder size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">All Cases</span>
            </button>
            <button className="pp-nav-item is-active">
              <FileTextOutlined className="pp-nav-icon" />
              <span className="pp-nav-label">Module Cases</span>
              {childCases.length > 0 && <span className="pp-nav-count">{childCases.length}</span>}
            </button>

            {/* Scenario summary */}
            <span className="pp-nav-caption" style={{ marginTop: 18 }}>Scenario</span>
            <div className="cd-side">
              <dl className="cd-meta">
                <div className="cd-meta__row">
                  <div className="cd-meta__icon-box" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' }}>
                    <Folder size={14} />
                  </div>
                  <div className="cd-meta__content">
                    <dt>Module</dt>
                    <dd>{parentData?.module_name || "Unassigned"}</dd>
                  </div>
                </div>
                <div className="cd-meta__row">
                  <div className="cd-meta__icon-box" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.2)' }}>
                    <Target size={14} />
                  </div>
                  <div className="cd-meta__content">
                    <dt>Feature</dt>
                    <dd>{parentData?.feature || "—"}</dd>
                  </div>
                </div>
                <div className="cd-meta__row">
                  <div className="cd-meta__icon-box" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }}>
                    <Zap size={14} />
                  </div>
                  <div className="cd-meta__content">
                    <dt>Automation</dt>
                    <dd>{parentData?.automation || "Manual"}</dd>
                  </div>
                </div>
                <div className="cd-meta__row">
                  <div className="cd-meta__icon-box" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }}>
                    <User size={14} />
                  </div>
                  <div className="cd-meta__content">
                    <dt>Owner</dt>
                    <dd>
                      {parentData?.owner_name || parentData?.qa_owner ? (
                        <span className="sc-person">
                          <span className="sc-person__name">{parentData.owner_name || parentData.qa_owner}</span>
                        </span>
                      ) : "—"}
                    </dd>
                  </div>
                </div>
                <div className="cd-meta__row">
                  <div className="cd-meta__icon-box" style={{ color: '#64748b', background: 'rgba(100,116,139,0.1)', borderColor: 'rgba(100,116,139,0.2)' }}>
                    <User size={14} />
                  </div>
                  <div className="cd-meta__content">
                    <dt>Created By</dt>
                    <dd>{parentData?.creator_name || "—"}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </aside>

        <main className="dh-main">
          {/* Back · breadcrumb · scenario name · status — one line */}
          <div className="dh-main-topbar sc-topbar">
            <div className="sc-topbar__title" style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                className="dh-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
              <Button
                type="text"
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/qa-workspace/test-cases")}
                className="cd-back"
              />
              <span className="sc-topbar__div" />
              <span className="cd-crumb">Cases</span>
              {parentData?.module_name && (
                <>
                  <span className="cd-sep">›</span>
                  <span className="cd-crumb cd-crumb--strong">{parentData.module_name}</span>
                </>
              )}
              <span className="cd-sep">›</span>
              <h1 className="sc-topbar__h1 cd-title">{parentData?.title || "Loading scenario…"}</h1>
              {parentData?.status && (
                <span className={`sc-pill sc-pill--${statusTone(parentData.status)}`}>
                  <span className="sc-pill__dot" />{parentData.status}
                </span>
              )}
            </div>

            <div className="dh-main-controls">
              <Button
                type="default"
                icon={<RotateCw size={14} className={loading ? "animate-spin" : ""} />}
                onClick={fetchData}
                disabled={loading}
                title="Refresh"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0 }}
              />
              {canCreateCase && (
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenCreateDrawer}>
                  New Module Case
                </Button>
              )}
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Stats — product-standard tiles, Active / Automated filter on click */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {[
                { key: undefined, label: "Module Cases", value: childCases.length, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: FileTextOutlined, sub: 'under this scenario' },
                { key: 'active', label: "Active", value: activeCount, color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: CheckCircleOutlined, sub: `${childCases.length ? Math.round((activeCount / childCases.length) * 100) : 0}% of all cases` },
                { key: 'automated', label: "Automated", value: automatedCount, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: BugOutlined, sub: `${childCases.length - automatedCount} still manual` },
                { key: 'highPriority', label: "High / Critical", value: highPriorityCount, color: "#64748b", bg: "rgba(100,116,139,0.1)", icon: Zap, sub: 'need the most attention' }
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
                placeholder="Search cases, steps, results…"
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
              <Tooltip title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}>
                <button
                  type="button"
                  className="sc-sort-btn"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                </button>
              </Tooltip>
              {activeFilterCount > 0 && (
                <button type="button" className="sc-clear" onClick={clearFilters}>
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Module Test Cases */}
            <ZukvoLoadingOverlay loading={loading} message="Loading module cases…" minHeight={loading ? 300 : undefined}>
            <div className="sc-tablewrap">
              <Table
                className="ts-table sc-table"
                dataSource={pagedCases}
                columns={childColumns}
                rowKey="id"
                pagination={false}
                onRow={(record) => ({
                  onClick: () => { setViewCase(record); setViewOpen(true); },
                })}
                locale={{
                  /* Holding the height beats claiming "no cases" mid-fetch. */
                  emptyText: loading ? (
                    <div style={{ minHeight: 220 }} />
                  ) : (
                    <div className="sc-empty">
                      <FileTextOutlined className="sc-empty__icon" />
                      <p className="sc-empty__title">
                        {activeFilterCount > 0 ? 'No cases match these filters' : 'No module test cases yet'}
                      </p>
                      <p className="sc-empty__desc">
                        {activeFilterCount > 0
                          ? 'Try widening your search or clearing the filters.'
                          : 'Add the testing instructions, steps and expected behaviour for this scenario.'}
                      </p>
                      {activeFilterCount > 0
                        ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
                        : canCreateCase && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenCreateDrawer}>Create module case</Button>}
                    </div>
                  )
                }}
              />
            </div>
            </ZukvoLoadingOverlay>
          </div>

          {/* Pager sits outside the scroll area so it stays pinned to the bottom */}
          {filteredCases.length > 0 && (
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

      {/* Module Test Case Drawer */}
      <Drawer
        {...commonDrawerProps}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-primary, #ffffff)" }}>
          {/* Drawer Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  background: "rgba(37, 99, 235, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  flexShrink: 0,
                  fontSize: 20,
                }}
              >
                <BugOutlined />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary, var(--text-slate-900))",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {editingCaseId ? "Edit Module Test Case" : "New Module Test Case"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary, var(--text-slate-500))", fontWeight: 500, marginTop: 2 }}>
                  {editingCaseId ? "Modify module test case details & steps" : "Add specific testing instructions, steps, and expected behaviors"}
                </div>
              </div>
            </div>
            <Button
              type="text"
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => setDrawerOpen(false)}
              style={{ color: "var(--text-slate-500)" }}
            />
          </div>

          {/* Drawer Body */}
          <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
            {/* Describe the case in plain language and let Zai draft it */}
            <div className="zai-draft">
              <div className="zai-draft__head">
                <span className="zai-draft__icon"><Sparkles size={14} /></span>
                <div className="min-w-0">
                  <div className="zai-draft__title">Create with Zai</div>
                  <div className="zai-draft__sub">Describe the case — Zai fills in the name, steps and expected result.</div>
                </div>
                {zaiOpen && (
                  <button type="button" className="zai-draft__toggle" onClick={() => setZaiOpen(false)}>Hide</button>
                )}
              </div>

              {zaiOpen ? (
                <>
                  <TextArea
                    rows={2}
                    placeholder="e.g. user able to type mail and password with validation"
                    value={zaiPrompt}
                    onChange={(e) => setZaiPrompt(e.target.value)}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) { e.preventDefault(); handleZaiGenerate(); }
                    }}
                    className="zai-draft__input"
                  />
                  <div className="zai-draft__row">
                    <div className="zai-draft__chips">
                      {[
                        'user able to type mail and password with validation',
                        'invalid credentials show an inline error',
                        'session expires after inactivity',
                      ].map(s => (
                        <button key={s} type="button" className="zai-draft__chip" onClick={() => setZaiPrompt(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="primary"
                      size="small"
                      loading={zaiGenerating}
                      disabled={!zaiPrompt.trim()}
                      icon={!zaiGenerating ? <Sparkles size={13} /> : undefined}
                      onClick={handleZaiGenerate}
                    >
                      {zaiGenerating ? 'Zai is drafting…' : 'Generate'}
                    </Button>
                  </div>
                </>
              ) : (
                <button type="button" className="zai-draft__reopen" onClick={() => setZaiOpen(true)}>
                  <Sparkles size={12} /> Draft another with Zai
                </button>
              )}
            </div>

            <Form layout="vertical" className="customer-drawer-form">
              {/* STEP 1: Basic Information */}
              <SectionCard
                step="STEP 1"
                icon={<InfoCircleOutlined />}
                title="Basic Information"
                subtitle="Test case name, module, priority, and severity"
              >

                <Form.Item label="Module" style={{ marginTop: -10, marginBottom: 16 }}>
                  <Input
                    value={parentData?.module_name || "Unassigned"}
                    disabled
                    readOnly
                    size="large"
                    style={{ borderRadius: 6, cursor: "not-allowed", backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 600 }}
                  />
                </Form.Item>

                <Form.Item label="Test Case Name" required style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="e.g., Verify successful login with valid credentials"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    size="large"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Priority" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={priorityOptions}
                        value={formData.priority}
                        onChange={(val: any) => setFormData({ ...formData, priority: val })}
                        placeholder="Select Priority"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item label="Severity" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={severityOptions}
                        value={formData.severity}
                        onChange={(val: any) => setFormData({ ...formData, severity: val })}
                        placeholder="Select Severity"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item label="Status" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={[
                          { value: "Draft", label: "Draft" },
                          { value: "Active", label: "Active" },
                          { value: "Deprecated", label: "Deprecated" },
                        ]}
                        value={formData.status}
                        onChange={(val: any) => setFormData({ ...formData, status: val })}
                        placeholder="Select Status"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Test Type" style={{ marginBottom: 0 }}>
                      <SearchableDropdown
                        options={testTypeOptions}
                        value={formData.test_type || undefined}
                        onChange={(val: any) => setFormData({ ...formData, test_type: val })}
                        placeholder="Select Test Type"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Automation" style={{ marginBottom: 0 }}>
                      <SearchableDropdown
                        options={[
                          { value: "Manual", label: "Manual" },
                          { value: "Automated", label: "Automated" },
                        ]}
                        value={formData.automation}
                        onChange={(val: any) => setFormData({ ...formData, automation: val })}
                        placeholder="Select Automation"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>

              {/* STEP 2: Execution & Steps */}
              <SectionCard
                step="STEP 2"
                icon={<SnippetsOutlined />}
                title="Execution & Steps"
                subtitle="Preconditions, steps to reproduce, and expected results"
              >
                <Form.Item label="Preconditions" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={2}
                    placeholder="State any setup required before testing (e.g., User must be logged out, Test user created with Admin role)..."
                    value={formData.preconditions}
                    onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Form.Item label="Steps to Reproduce" style={{ marginBottom: 16 }}>
                  <div style={{ border: '1px solid var(--border-slate-300, #cbd5e1)', borderRadius: 8, padding: '12px 14px', background: 'var(--bg-pure-white, #ffffff)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(formData.steps_to_reproduce || []).map((step: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {idx + 1}
                          </div>
                          <span style={{ fontSize: 13, color: 'var(--text-slate-800)', flex: 1, wordBreak: 'break-word' }}>{step}</span>
                          <Button
                            type="text"
                            size="small"
                            danger
                            style={{ padding: '0 6px', fontSize: 15, lineHeight: 1, opacity: 0.8 }}
                            onClick={() => {
                              const updated = [...(formData.steps_to_reproduce || [])];
                              updated.splice(idx, 1);
                              setFormData({ ...formData, steps_to_reproduce: updated });
                            }}
                          >×</Button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: (formData.steps_to_reproduce || []).length > 0 ? 4 : 0, paddingTop: (formData.steps_to_reproduce || []).length > 0 ? 8 : 0, borderTop: (formData.steps_to_reproduce || []).length > 0 ? '1px dashed var(--border-slate-300, #cbd5e1)' : 'none' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                          +
                        </div>
                        <Input
                          placeholder="Type a step to reproduce and press Enter..."
                          value={newStepInput}
                          onChange={(e) => setNewStepInput(e.target.value)}
                          onPressEnter={(e) => {
                            e.preventDefault();
                            if (newStepInput.trim()) {
                              setFormData({ ...formData, steps_to_reproduce: [...(formData.steps_to_reproduce || []), newStepInput.trim()] });
                              setNewStepInput('');
                            }
                          }}
                          style={{ flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', padding: '4px 0', fontSize: 13 }}
                          variant="borderless"
                        />
                        <Button
                          type="primary"
                          size="small"
                          style={{ borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#3b82f6' }}
                          onClick={() => {
                            if (newStepInput.trim()) {
                              setFormData({ ...formData, steps_to_reproduce: [...(formData.steps_to_reproduce || []), newStepInput.trim()] });
                              setNewStepInput('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </Form.Item>

                <Form.Item label="Expected Result" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={3}
                    placeholder="Describe clearly what should happen when steps are executed (e.g., User is redirected to dashboard with success message)..."
                    value={formData.expected_result}
                    onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Form.Item label="Additional Description / Notes" style={{ marginBottom: 0 }}>
                  <TextArea
                    rows={2}
                    placeholder="Optional background info, tickets, or references..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </SectionCard>
            </Form>
          </div>

          {/* Drawer Footer */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              bottom: 0,
              background: "var(--bg-primary, #fff)",
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-slate-400)", fontWeight: 500 }}>
              {editingCaseId ? "Changes take effect immediately" : "Fill required fields to save test case"}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 8, fontWeight: 600, padding: "0 18px", height: 36 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSaveChildCase(false)}
                loading={submitting && !editingCaseId}
                style={{ borderRadius: 8, fontWeight: 600, padding: "0 20px", height: 36, background: "#2563eb", borderColor: "#2563eb" }}
              >
                Save & Close
              </Button>
              {!editingCaseId && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleSaveChildCase(true)}
                  loading={submitting}
                  style={{ borderRadius: 8, fontWeight: 600, padding: "0 20px", height: 36, background: "#10b981", borderColor: "#10b981" }}
                >
                  Save & Add Another
                </Button>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Read-only case view — compact, opens on row click */}
      <Drawer
        {...commonDrawerProps}
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        width={640}
      >
        {viewCase && (
          <div className="cv">
            <div className="cv__head">
              <span className="cv__id">{viewCase.test_case_id || 'CASE'}</span>
              <span className={`sc-pill sc-pill--${statusTone(viewCase.status || 'Active')}`}>
                <span className="sc-pill__dot" />{viewCase.status || 'Active'}
              </span>
              <button className="cv__close" onClick={() => setViewOpen(false)} aria-label="Close">
                <CloseOutlined />
              </button>
            </div>

            <div className="cv__body">
              <div className="cv__titlerow">
                <span className="cv__titleicon"><FileTextOutlined /></span>
                <h2 className="cv__title">{viewCase.name || 'Untitled case'}</h2>
              </div>

              <div className="cv__facts">
                <div className="cv__fact">
                  <span className="cv__fact-key">Priority</span>
                  <PriorityMeter priority={viewCase.priority || 'Medium'} />
                </div>
                <div className="cv__fact">
                  <span className="cv__fact-key">Severity</span>
                  <span className="cv__fact-val">{viewCase.severity || 'Major'}</span>
                </div>
                <div className="cv__fact">
                  <span className="cv__fact-key">Type</span>
                  <span className="cv__fact-val">{viewCase.test_type || 'Functional'}</span>
                </div>
                <div className="cv__fact">
                  <span className="cv__fact-key">Automation</span>
                  <span className="cv__fact-val">{viewCase.automation || 'Manual'}</span>
                </div>
              </div>

              {viewCase.description && (
                <section className="cv__sec">
                  <h3 className="cv__sec-title">
                    <span className="cv__sec-icon"><InfoCircleOutlined /></span>
                    <span>Description</span>
                    <span className="cv__rule" />
                  </h3>
                  <p className="cv__text">{viewCase.description}</p>
                </section>
              )}

              {viewCase.preconditions && (
                <section className="cv__sec">
                  <h3 className="cv__sec-title">
                    <span className="cv__sec-icon"><ShieldCheck size={12} /></span>
                    <span>Preconditions</span>
                    <span className="cv__rule" />
                  </h3>
                  <p className="cv__text">{viewCase.preconditions}</p>
                </section>
              )}

              <section className="cv__sec">
                <h3 className="cv__sec-title">
                  <span className="cv__sec-icon"><Activity size={12} /></span>
                  <span>Steps to Reproduce</span>
                  {parseSteps(viewCase.steps_to_reproduce).length > 0 && (
                    <span className="cv__count">{parseSteps(viewCase.steps_to_reproduce).length}</span>
                  )}
                  <span className="cv__rule" />
                </h3>
                {parseSteps(viewCase.steps_to_reproduce).length === 0 ? (
                  <p className="cv__empty">No steps recorded.</p>
                ) : (
                  <ol className="cv__steps">
                    {parseSteps(viewCase.steps_to_reproduce).map((s, i) => (
                      <li key={i}><span className="cv__step-n">{i + 1}</span><span>{s}</span></li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="cv__sec">
                <h3 className="cv__sec-title">
                  <span className="cv__sec-icon cv__sec-icon--ok"><CheckCircleOutlined /></span>
                  <span>Expected Result</span>
                  <span className="cv__rule" />
                </h3>
                {viewCase.expected_result
                  ? <p className="cv__expected">{viewCase.expected_result}</p>
                  : <p className="cv__empty">Not recorded.</p>}
              </section>

              <section className="cv__sec">
                <h3 className="cv__sec-title">
                  <span className="cv__sec-icon"><Layers size={12} /></span>
                  <span>Linked Suites</span>
                  <span className="cv__rule" />
                </h3>
                {(viewCase.test_suites?.length || viewCase.suite_count || 0) === 0 ? (
                  <p className="cv__empty">Not linked to any suite.</p>
                ) : (
                  <button
                    type="button"
                    className="tc-suites"
                    onClick={() => { setSelectedCaseForSuites(viewCase); setSuitesDrawerOpen(true); }}
                  >
                    <LinkOutlined />
                    <span>{viewCase.test_suites?.length || viewCase.suite_count} linked</span>
                  </button>
                )}
              </section>
            </div>

            <div className="cv__foot">
              <ConfirmDialog
                tone="danger"
                title="Delete Module Test Case?"
                description={`Are you sure you want to delete "${viewCase.name}" (${viewCase.test_case_id})?`}
                confirmText="Delete"
                onConfirm={async () => { await handleDeleteChild(viewCase.id); setViewOpen(false); }}
              >
                <Button danger icon={<Trash2 size={14} />}>Delete</Button>
              </ConfirmDialog>
              <div style={{ flex: 1 }} />
              <Button onClick={() => setViewOpen(false)}>Close</Button>
              <Button
                type="primary"
                icon={<Pencil size={14} />}
                onClick={() => { setViewOpen(false); handleOpenEditDrawer(viewCase); }}
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Linked Suites Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={20} color="#3b82f6" />
            <span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Associated Test Suites</span>
          </div>
        }
        open={suitesDrawerOpen}
        onClose={() => {
          setSuitesDrawerOpen(false);
          setSelectedCaseForSuites(null);
        }}
        width={500}
        styles={{
          header: { borderBottom: '1px solid var(--border-slate-200)', padding: '16px 24px' },
          body: { padding: '20px 24px', background: 'var(--bg-pure-white)' }
        }}
      >
        {selectedCaseForSuites && (
          <div>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16, fontSize: 14 }}>
              Test Case <strong style={{ color: 'var(--text-slate-900)' }}>{selectedCaseForSuites.name}</strong> is linked to the following test suites:
            </Typography.Paragraph>

            {(!selectedCaseForSuites.test_suites || selectedCaseForSuites.test_suites.length === 0) ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-slate-400)', border: '1px dashed var(--border-slate-200)', borderRadius: 8 }}>
                No test suites are currently linked to this test case.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedCaseForSuites.test_suites.map((suite: any) => (
                  <div
                    key={suite.id}
                    style={{
                      border: '1px solid var(--border-slate-200)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => router.push(`/qa-workspace/test-suites/${suite.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SnippetsOutlined style={{ fontSize: 18 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-slate-900)', fontSize: 15 }}>{suite.suite_name || 'Unnamed Suite'}</span>
                        <span style={{ color: 'var(--text-slate-500)', fontSize: 13 }}>{suite.description || 'No description provided'}</span>
                      </div>
                    </div>
                    <Tag color="blue" style={{ margin: 0 }}>View Suite</Tag>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </MainLayout>
  );
}
