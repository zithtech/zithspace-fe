"use client";

import React, { useState, useEffect } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Dropdown, message, Modal, List, Typography, Input, Select, Form, Drawer, Tooltip } from "antd";
import { BugOutlined, PlusOutlined, CheckCircleOutlined, SnippetsOutlined, AppstoreOutlined, UnorderedListOutlined, EllipsisOutlined, SearchOutlined, LinkOutlined, InfoCircleOutlined, UserOutlined, ClockCircleOutlined, CloseOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { Target, Trash2, Pencil, Layers, Folder } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps, SectionCard, drawerFormStyles as formStyles } from "@/components/common/DrawerSection";
import { MembersService } from "@/services/membersService";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { ProjectService } from "@/services/projectService";

type TabKey = "cases";

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

/* Product-standard stat tile — same markup as the Scopes page */
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

function initialsOf(name: string) {
  if (!name) return 'TC';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TestCasesPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestCases" });

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("cases");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [parentCases, setParentCases] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Any filter change resets to the first page
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [automationFilter, setAutomationFilter] = useState<string | undefined>();
  const [ownerFilter, setOwnerFilter] = useState<string | undefined>();
  /** Set by clicking the Ready / Automated stat tiles. */
  const [quickFilter, setQuickFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [suitesModalVisible, setSuitesModalVisible] = useState(false);
  const [selectedCaseForSuites, setSelectedCaseForSuites] = useState<any>(null);

  // Drawer State for Create/Edit Parent Case
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    module_id: undefined as string | undefined,
    project_id: undefined as string | undefined,
    feature: "",
    automation: "Manual",
    status: "Draft",
    owner: undefined as string | undefined
  });

  // Projects the user belongs to — a test case is filed against one
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const { canReadCase, canCreateCase, canUpdateCase, canDeleteCase } = usePermission();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [parentsRes, modRes, memRes] = await Promise.all([
        axios.get("/api/v2/qa/parents"),
        axios.get("/api/v2/qa/modules"),
        MembersService.getMembers({ limit: 500 }).catch(() => ({ data: [] }))
      ]);
      setParentCases(Array.isArray(parentsRes) ? parentsRes : (parentsRes?.data?.data || parentsRes?.data || []));
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
      setUsersList((memRes as any)?.data || []);
    } catch (error) {
      message.error("Failed to fetch test cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadCase) {
      fetchData();
      fetchProjects();
    }
  }, [canReadCase]);

  /** Active projects the signed-in user belongs to. */
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const res: any = await ProjectService.getUserProjects();
      const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      setProjectOptions(
        list
          .map((p: any) => ({
            value: String(p.value ?? p.id ?? ''),
            label: String(p.label ?? p.name ?? ''),
            description: p.code || undefined,
          }))
          .filter(o => o.value && o.label)
      );
    } catch (err) {
      // No project access — the field falls back to an empty list
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Any filter change resets to the first page
  useEffect(() => {
    setPage(1);
  }, [searchTerm, moduleFilter, statusFilter, automationFilter, ownerFilter, quickFilter]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setEditingRecord(null);
    setFormData({
      title: "",
      module_id: undefined,
      project_id: projectOptions.length === 1 ? projectOptions[0].value : undefined,
      feature: "",
      automation: "Manual",
      status: "Draft",
      owner: undefined
    });
    setDrawerVisible(true);
  };

  const handleOpenEditModal = (r: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(r.id);
    setEditingRecord(r);
    setFormData({
      title: r.title || "",
      module_id: r.module_id || undefined,
      project_id: r.project_id || undefined,
      feature: r.feature || "",
      automation: r.automation || "Manual",
      status: r.status || "Draft",
      owner: r.owner || r.created_by || undefined
    });
    setDrawerVisible(true);
  };

  const handleSaveParent = async () => {
    if (!formData.title.trim()) {
      message.error("Please enter a Test Case Title");
      return;
    }
    if (!formData.project_id) {
      message.error("Please select a Project — bugs raised from this case are filed against it");
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await axios.put(`/api/v2/qa/parents/${editingId}`, formData);
        message.success("Test Case updated successfully!");
      } else {
        await axios.post(`/api/v2/qa/parents`, formData);
        message.success("Test Case created successfully!");
      }
      setDrawerVisible(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to save Test Case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/api/v2/qa/parents/${id}`);
      message.success("Test Case deleted successfully");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to delete test case");
    }
  };


  const ownerNameOf = (p: any) => {
    const name = p.owner_name || p.qa_owner || p.creator_name || p.owner;
    return (name && typeof name === 'string' && !/^[0-9a-fA-F]{8}-/.test(name)) ? name : '';
  };

  const filteredData = parentCases.filter(p => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const match =
        p.title?.toLowerCase().includes(s) ||
        p.module_name?.toLowerCase().includes(s) ||
        p.feature?.toLowerCase().includes(s) ||
        ownerNameOf(p).toLowerCase().includes(s);
      if (!match) return false;
    }
    if (moduleFilter && (p.module_name || 'Unassigned') !== moduleFilter) return false;
    if (statusFilter && (p.status || 'Draft') !== statusFilter) return false;
    if (automationFilter && (p.automation || 'Manual') !== automationFilter) return false;
    if (ownerFilter && ownerNameOf(p) !== ownerFilter) return false;
    if (quickFilter === 'ready' && !(p.status === 'Ready' || p.status === 'Active')) return false;
    if (quickFilter === 'automated' && p.automation !== 'Automated') return false;
    return true;
  });

  // Stat figures
  const readyCount = parentCases.filter(t => t.status === 'Ready' || t.status === 'Active').length;
  const automatedCount = parentCases.filter(t => t.automation === 'Automated').length;
  const totalChildCases = parentCases.reduce((acc, curr) => acc + (parseInt(curr.child_count || '0', 10)), 0);

  // Filter option lists, derived from the data that's actually present
  const uniqueSorted = (values: any[]) =>
    Array.from(new Set(values.filter(Boolean)))
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map(v => ({ value: String(v), label: String(v) }));

  const moduleFilterOptions = uniqueSorted(parentCases.map(p => p.module_name || 'Unassigned'));
  const statusFilterOptions = uniqueSorted(parentCases.map(p => p.status || 'Draft'));
  const ownerFilterOptions = uniqueSorted(parentCases.map(ownerNameOf));

  const activeFilterCount =
    (searchTerm.trim() ? 1 : 0) + (moduleFilter ? 1 : 0) + (statusFilter ? 1 : 0) +
    (automationFilter ? 1 : 0) + (ownerFilter ? 1 : 0) + (quickFilter ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setModuleFilter(undefined);
    setStatusFilter(undefined);
    setAutomationFilter(undefined);
    setOwnerFilter(undefined);
    setQuickFilter(undefined);
  };

  // Client-side pagination, matching the app-wide sticky pager
  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = filteredData.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filteredData.length);
  const pagedCases = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const columns = [
    {
      title: "Test Case",
      dataIndex: "title",
      key: "title",
      width: 320,
      render: (t: string, record: any) => {
        const meta = [record.module_name || 'Unassigned', record.feature].filter(Boolean).join(' · ');
        const children = parseInt(record.child_count || '0', 10);
        return (
          <div className="sc-name">
            <span className="sc-name__badge">{initialsOf(t || '')}</span>
            <span className="sc-name__text">
              <span className="sc-name__title">{t || "Unnamed Test Case"}</span>
              <span className="sc-name__meta">
                {meta}{children ? ` · ${children} case${children === 1 ? '' : 's'}` : ''}
              </span>
            </span>
          </div>
        );
      }
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (t: string) => {
        const v = t || 'Draft';
        const tone = (v === 'Ready' || v === 'Active') ? 'green' : v === 'Deprecated' ? 'red' : v === 'Draft' ? 'ash' : 'blue';
        return <span className={`sc-pill sc-pill--${tone}`}><span className="sc-pill__dot" />{v}</span>;
      }
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
      title: "Owner",
      dataIndex: "qa_owner",
      key: "qa_owner",
      width: 170,
      render: (_: any, record: any) => {
        const name = ownerNameOf(record);
        if (!name) return <span className="sc-muted">—</span>;
        return (
          <span className="sc-person">
            <span className="sc-person__av">{initialsOf(name)}</span>
            <span className="sc-person__name">{name}</span>
          </span>
        );
      }
    },
    {
      title: "Suites",
      key: "linked_suites",
      width: 110,
      render: (_: any, record: any) => {
        const suites = record.test_suites || [];
        const count = suites.length || parseInt(record.suite_count || '0', 10);
        if (count === 0) return <span className="sc-muted">—</span>;
        return (
          <button
            type="button"
            className="tc-suites"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCaseForSuites(record);
              setSuitesModalVisible(true);
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
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 140,
      render: (t: string) => (
        <span className="sc-timeline__range">
          {t ? new Date(t).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
      )
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div className="sc-rowactions" onClick={e => e.stopPropagation()}>
          {canUpdateCase && (
            <Tooltip title="Edit">
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenEditModal(record, e); }}
                aria-label="Edit"
              >
                <Pencil size={15} />
              </button>
            </Tooltip>
          )}
          {canDeleteCase && (
            <ConfirmDialog
              tone="danger"
              title="Delete Test Case?"
              description="Are you sure you want to delete this Test Case and all associated test cases?"
              confirmText="Delete"
              onConfirm={() => handleDelete(record.id)}
            >
              <Tooltip title="Delete">
                <button className="is-danger" onClick={(e) => e.stopPropagation()} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </Tooltip>
            </ConfirmDialog>
          )}
          {!canUpdateCase && !canDeleteCase && <span className="sc-muted">—</span>}
        </div>
      )
    }
  ];

  const renderCaseCard = (r: any) => {
    const accent = accentFor(r.title || r.id);
    const color = r.status === 'Ready' || r.status === 'Active' ? '#10b981' : r.status === 'Deprecated' ? '#ef4444' : '#3b82f6';

    return (
      <div key={r.id} className="pc-card" onClick={() => router.push(`/qa-workspace/test-cases/${r.id}`)}>
        <div className="pc-top">
          <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
            {initialsOf(r.title)}
          </div>
          <div className="pc-identity-body">
            <div className="pc-title">{r.title}</div>
            <div className="pc-client-line">
              <span className="pc-client-key">Module:</span>
              <span className="pc-client-val">{r.module_name || 'Unassigned'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
            {canUpdateCase && (
              <Button
                type="text"
                size="small"
                icon={<Pencil size={15} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditModal(r, e);
                }}
                style={{ color: "var(--text-slate-500)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                title="Edit Test Case"
              />
            )}
            {canDeleteCase && (
              <ConfirmDialog
                tone="danger"
                title="Delete Test Case?"
                description="Are you sure you want to delete this Test Case and all associated test cases?"
                confirmText="Delete"
                onConfirm={() => handleDelete(r.id)}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<Trash2 size={15} />}
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  title="Delete Test Case"
                />
              </ConfirmDialog>
            )}
          </div>
        </div>

        <div className="pc-foot">
          <div className="pc-foot-row">
            <span className="pc-foot-item">
              <span className="pc-foot-key">Feature:</span>
              <span className="pc-foot-val">{r.feature || '—'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Automation:</span>
              <span className="pc-foot-val">{r.automation || 'Manual'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Test Cases:</span>
              <span className="pc-foot-val">{r.child_count || 0}</span>
            </span>
          </div>
          <div className="pc-foot-row" style={{ justifyContent: 'space-between' }}>
            <span className="pc-foot-item">
              <span className="pc-foot-key">Owner:</span>
              <span className="pc-foot-val">{r.owner_name || r.qa_owner || '—'}</span>
            </span>
            <span className="pc-status-tag" style={{ color, background: `${color}1A` }}>
              {r.status || 'Draft'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Same gate the sibling QA pages use — the fetches above already sit behind
  // canReadCase, so without this an unpermitted user would get empty chrome.
  if (!canReadCase) return null;

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
        .pp-side-head-text { min-width: 0; }
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
        .sc-topbar__sub {
          font-size: 12px; color: var(--text-slate-500);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
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
        .sc-filters .sd-trigger {
          height: 32px !important; min-height: 32px !important;
          border-radius: 8px !important; padding-block: 0 !important;
        }
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
        .sc-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          letter-spacing: .06em !important; padding: 8px 14px !important;
        }
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
        .sc-name__title {
          font-size: 13px; font-weight: 600; color: var(--text-slate-900);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px;
        }
        .sc-name__meta {
          font-size: 11px; color: var(--text-slate-400); margin-top: 1px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px;
        }
        .sc-muted { color: var(--text-slate-400); }
        .sc-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 10px; border-radius: 999px; white-space: nowrap;
          font-size: 11.5px; font-weight: 600;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-600);
        }
        .sc-pill__dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
        .sc-pill--blue { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.22); }
        .sc-pill--green { color: #047857; background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.24); }
        .sc-pill--red { color: #dc2626; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.22); }
        .sc-pill--ash { color: #64748b; background: rgba(100,116,139,.1); border-color: rgba(100,116,139,.2); }
        .sc-person { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
        .sc-person__av {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 24px; height: 24px; border-radius: 999px;
          background: rgba(59,130,246,.12); color: #2563eb; font-size: 9.5px; font-weight: 700;
        }
        .sc-person__name {
          font-size: 12.5px; color: var(--text-slate-700);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;
        }
        .sc-timeline__range { font-size: 12.5px; color: var(--text-slate-700); font-variant-numeric: tabular-nums; white-space: nowrap; }
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
          border: 1px solid var(--border-slate-200); border-radius: 6px; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 12px; flex: 1; }
        .pc-avatar {
          width: 34px; height: 34px; border-radius: 6px; flex-shrink: 0;
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

        .pc-actions { border: none; background: transparent; cursor: pointer; color: var(--text-slate-400); font-size: 16px; padding: 4px; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
        
        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }
        
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

        .ts-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase !important; color: var(--text-slate-500) !important;
          white-space: nowrap !important;
          padding: 12px 16px !important;
        }
        .ts-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 12px 16px !important;
        }
        .ts-table, .ts-table .ant-table {
          background: transparent !important;
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
                <BugOutlined />
              </div>
              <div className="pp-side-head-text">
                <h1 className="pp-side-title">Cases</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateCase && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreateModal}
                block
                className="pp-side-cta"
              >
                Create Test Case
              </Button>
            )}
          </div>
          <div className="dh-sidebar-scroll">
            <span className="pp-nav-caption">Workspace</span>
            <button className="pp-nav-item is-active" onClick={() => setActiveTab("cases")}>
              <Target size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">Cases</span>
              {parentCases.length > 0 && <span className="pp-nav-count">{parentCases.length}</span>}
            </button>
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar sc-topbar">
            {/* Title and subtitle share one line, split by a divider */}
            <div className="sc-topbar__title">
              <span className="sc-topbar__h1">Cases</span>
              <span className="sc-topbar__div" />
              <span className="sc-topbar__sub">High-level testing scenarios and test cases for your QA Space</span>
            </div>

            <div className="dh-main-controls">
              <div className="pp-segmented">
                <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')} title="List View"><UnorderedListOutlined /></button>
                <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => setViewMode('grid')} title="Grid View"><AppstoreOutlined /></button>
              </div>
              {canCreateCase && (
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
                  New Case
                </Button>
              )}
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Stats — product-standard StatTile, clickable to filter */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {[
                { key: undefined, label: "Total Test Cases", value: parentCases.length, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: Folder, sub: `${modules.length} modules covered` },
                { key: 'ready', label: "Ready", value: readyCount, color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: CheckCircleOutlined, sub: `${parentCases.length ? Math.round((readyCount / parentCases.length) * 100) : 0}% of all cases` },
                { key: 'automated', label: "Automated", value: automatedCount, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: BugOutlined, sub: `${parentCases.length - automatedCount} still manual` },
                { key: undefined, label: "Module Cases", value: totalChildCases, color: "#64748b", bg: "rgba(100,116,139,0.1)", icon: Target, sub: 'nested under these cases' }
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
                placeholder="Search cases, modules, features…"
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
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
                options={statusFilterOptions}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                placeholder="All statuses"
                itemNoun="statuses"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={[{ value: 'Automated', label: 'Automated' }, { value: 'Manual', label: 'Manual' }]}
                value={automationFilter}
                onChange={(v) => setAutomationFilter(v)}
                placeholder="Any automation"
                hideAvatar
                itemNoun="types"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={ownerFilterOptions}
                value={ownerFilter}
                onChange={(v) => setOwnerFilter(v)}
                placeholder="All owners"
                itemNoun="owners"
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
            <ZukvoLoadingOverlay loading={loading} message="Loading test cases…" minHeight={loading ? 320 : undefined}>
              {viewMode === 'list' ? (
                <div className="sc-tablewrap">
                  <Table
                    className="ts-table sc-table"
                    dataSource={pagedCases}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    onRow={(record) => ({
                      onClick: () => router.push(`/qa-workspace/test-cases/${record.id}`),
                    })}
                    locale={{
                      /* "No test cases yet" would be a lie while the first page is
                         still in flight — hold the height instead. */
                      emptyText: loading ? (
                        <div style={{ minHeight: 240 }} />
                      ) : (
                        <div className="sc-empty">
                          <Folder size={26} className="sc-empty__icon" />
                          <p className="sc-empty__title">{activeFilterCount > 0 ? 'No cases match these filters' : 'No test cases yet'}</p>
                          <p className="sc-empty__desc">
                            {activeFilterCount > 0
                              ? 'Try widening your search or clearing the filters.'
                              : 'Create your first test case to start grouping testing scenarios.'}
                          </p>
                          {activeFilterCount > 0
                            ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
                            : canCreateCase && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>Create Test Case</Button>}
                        </div>
                      )
                    }}
                  />
                </div>
              ) : (
                <div className="pp-grid">
                  {loading ? null : filteredData.length === 0 ? (
                    <div className="sc-empty" style={{ gridColumn: '1 / -1' }}>
                      <Folder size={26} className="sc-empty__icon" />
                      <p className="sc-empty__title">{activeFilterCount > 0 ? 'No cases match these filters' : 'No test cases yet'}</p>
                      <p className="sc-empty__desc">
                        {activeFilterCount > 0 ? 'Try widening your search or clearing the filters.' : 'Create your first test case to get started.'}
                      </p>
                      {activeFilterCount > 0
                        ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
                        : canCreateCase && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>Create Test Case</Button>}
                    </div>
                  ) : (
                    pagedCases.map(r => renderCaseCard(r))
                  )}
                </div>
              )}
            </ZukvoLoadingOverlay>
          </div>

          {/* Pager sits outside the scroll area so it stays pinned to the bottom */}
          {filteredData.length > 0 && (
            <div className="pp-footer">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{filteredData.length}</strong>
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

      {/* Create / Edit Parent Test Case Drawer */}
      <Drawer
        {...commonDrawerProps}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        maskClosable={!submitting}
      >
        <style>{formStyles}</style>
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Drawer Header */}
          <div
            className="customer-drawer-header"
            style={{
              padding: "16px 24px 12px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 0,
                  background: editingId ? "rgba(245, 158, 11, 0.10)" : "rgba(59, 130, 246, 0.10)",
                  color: editingId ? "#f59e0b" : "var(--premium-blue, #2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {editingId ? <Pencil size={20} /> : <PlusOutlined style={{ fontSize: 20 }} />}
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
                  {editingId ? "Edit Test Case" : "Create Test Case"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary, var(--text-slate-500))", fontWeight: 500, marginTop: 2 }}>
                  {editingId
                    ? `Update test case details & ownership`
                    : "Configure a new Test Case and assign ownership"}
                </div>
              </div>
            </div>
            <Button
              type="text"
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => setDrawerVisible(false)}
              style={{ color: "var(--text-slate-500)" }}
            />
          </div>

          {/* Drawer Body */}
          <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
            <Form
              layout="vertical"
              className="customer-drawer-form"
            >
              {/* STEP 1: Scenario Information */}
              <SectionCard
                step="STEP 1"
                icon={<InfoCircleOutlined />}
                title="Test Case Information"
                subtitle="Define the test case title, target module, and feature area"
              >
                <Form.Item
                  label="Title (Test Case)"
                  required
                  style={{ marginBottom: 16 }}
                >
                  <Input
                    placeholder="e.g., Todo Management, Authentication Flow, Billing Setup"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    size="large"
                    style={{ borderRadius: 0 }}
                  />
                </Form.Item>

                {/* Bugs raised from this case are filed against this project */}
                <Form.Item
                  label="Project"
                  required
                  style={{ marginBottom: 16 }}
                  extra={
                    <span style={{ fontSize: 11.5, color: "var(--text-slate-400)" }}>
                      Bugs raised from runs of this test case are filed under this project&apos;s bug list.
                    </span>
                  }
                >
                  <SearchableDropdown
                    options={projectOptions}
                    value={formData.project_id}
                    onChange={(val: any) => setFormData({ ...formData, project_id: val })}
                    placeholder={loadingProjects ? "Loading projects…" : projectOptions.length ? "Select a project" : "No projects available"}
                    searchPlaceholder="Search your projects…"
                    itemNoun="projects"
                    loading={loadingProjects}
                    style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                  />
                </Form.Item>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Form.Item label="Module (Business Module)" style={{ marginBottom: 0 }}>
                    <SearchableDropdown
                      options={modules.map((mod: any) => ({
                        value: mod.id,
                        label: mod.module_name || mod.name || "Module",
                      }))}
                      value={formData.module_id}
                      onChange={(val: any) => setFormData({ ...formData, module_id: val })}
                      placeholder="Select business module"
                      style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                    />
                  </Form.Item>

                  <Form.Item label="Feature (Feature Name)" style={{ marginBottom: 0 }}>
                    <Input
                      placeholder="e.g., Login, Dashboard, Task Creation"
                      value={formData.feature}
                      onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
                      size="large"
                      style={{ borderRadius: 0 }}
                    />
                  </Form.Item>
                </div>
              </SectionCard>

              {/* STEP 2: Ownership & Status */}
              <SectionCard
                step="STEP 2"
                icon={<UserOutlined />}
                title="Ownership & Status"
                subtitle="Specify the assigned QA owner, execution method, and active state"
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <Form.Item label="Automation (Manual / Automated)" style={{ marginBottom: 0 }}>
                    <SearchableDropdown
                      options={[
                        { value: "Manual", label: "Manual" },
                        { value: "Automated", label: "Automated" },
                      ]}
                      value={formData.automation}
                      onChange={(val: any) => setFormData({ ...formData, automation: val })}
                      placeholder="Select automation method"
                      style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                    />
                  </Form.Item>

                  <Form.Item label="Status" style={{ marginBottom: 0 }}>
                    <SearchableDropdown
                      options={[
                        { value: "Draft", label: "Draft" },
                        { value: "Ready", label: "Ready" },
                        { value: "Active", label: "Active" },
                        { value: "Deprecated", label: "Deprecated" },
                      ]}
                      value={formData.status}
                      onChange={(val: any) => setFormData({ ...formData, status: val })}
                      placeholder="Select status"
                      style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                    />
                  </Form.Item>
                </div>

                <Form.Item label="Owner (Assigned QA)" style={{ marginBottom: 0 }}>
                  <SearchableDropdown
                    options={usersList.map((u: any) => ({
                      value: u.id,
                      label: u.name || u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'User',
                      avatarUrl: u.avatarUrl || u.avatar || u.profile_picture || u.profilePicture || null,
                    }))}
                    value={formData.owner}
                    onChange={(val: any) => setFormData({ ...formData, owner: val })}
                    placeholder="Select Assigned QA Owner"
                    showSelectedAvatar
                    style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                  />
                </Form.Item>
              </SectionCard>
            </Form>
          </div>

          {/* Drawer Footer */}
          <div
            className="customer-drawer-footer"
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
              {editingId ? "Changes reflect immediately across test cases" : "Fill required fields to create test case"}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <Button
                onClick={() => setDrawerVisible(false)}
                style={{ borderRadius: 8, fontWeight: 600, padding: "0 18px", height: 36 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={submitting}
                onClick={handleSaveParent}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  padding: "0 22px",
                  height: 36,
                  background: "#2563eb",
                  borderColor: "#2563eb",
                }}
              >
                {editingId ? "Save Changes" : "Create Test Case"}
              </Button>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Linked Suites Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={20} color="#3b82f6" />
            <span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Associated Test Suites</span>
          </div>
        }
        open={suitesModalVisible}
        onClose={() => {
          setSuitesModalVisible(false);
          setSelectedCaseForSuites(null);
        }}
        {...commonDrawerProps}
        width={500}
      >
        {selectedCaseForSuites && (
          <div style={{ padding: '20px 24px' }}>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16, fontSize: 14 }}>
              Test Case <strong style={{ color: 'var(--text-slate-900)' }}>{selectedCaseForSuites.title}</strong> is currently included in the following test suites:
            </Typography.Paragraph>

            {(!selectedCaseForSuites.test_suites || selectedCaseForSuites.test_suites.length === 0) ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-slate-400)', border: '1px dashed var(--border-slate-200)', borderRadius: 8 }}>
                No detailed suite records found for this test case.
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
