"use client";
import { message } from "@/providers/AntdGlobalProvider";

import NoData from "@/components/common/NoData";

import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Typography, Input, Select, Form, Drawer, Tooltip, Popover, Space, Segmented, Divider } from "antd";
import { PlusOutlined, CheckCircleOutlined, SnippetsOutlined, AppstoreOutlined, UnorderedListOutlined, SearchOutlined, LinkOutlined, InfoCircleOutlined, UserOutlined, CloseOutlined, FilterOutlined, ExpandAltOutlined, ReloadOutlined, ApartmentOutlined, ThunderboltOutlined, CopyOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Layers, Folder, User, Users } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios, apiClient } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps, SectionCard, drawerFormStyles as formStyles } from "@/components/common/DrawerSection";
import { MembersService } from "@/services/membersService";
import PostCreationSuccessScreen from "@/components/common/PostCreationSuccessScreen";
import { ProjectService } from "@/services/projectService";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { NO_MODULES_STYLES, NoModulesEmpty, MODULES_SETTINGS_HREF } from "@/components/qa/ModuleSettingsSection";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { useQaProject, QaProjectPicker, QaProjectSwitcher } from "@/components/qa/QaProjectGate";
import { useDebounce } from "@/hooks/useDebounce";
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import TestCaseFilters from "./TestCaseFilters";

const norm = (v: any) => String(v ?? "").trim().toLowerCase();

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
  if (!name) return 'TC';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TestCasesPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestCases" });

  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);

  const [parentCases, setParentCases] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [totalItems, setTotalItems] = useState(0);
  const [modules, setModules] = useState<any[]>([]);
  const [scopes, setScopes] = useState<any[]>([]);
  /** False once the scope list comes back empty or forbidden — the drawer then asks for a module directly. */
  const [scopesAvailable, setScopesAvailable] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  // Any filter change resets to the first page
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [automationFilter, setAutomationFilter] = useState<string | undefined>();
  const [ownerFilter, setOwnerFilter] = useState<string | undefined>();
  /* Cases are read inside one project, the way the Bug List works — the choice
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
  const [suitesModalVisible, setSuitesModalVisible] = useState(false);
  const [selectedCaseForSuites, setSelectedCaseForSuites] = useState<any>(null);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [successData, setSuccessData] = useState<{ name: string } | null>(null);
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
  /**
   * The scope the drawer is filing against. It picks the module rather than
   * being stored on the case — a parent case has no scope column.
   */
  const [scopeId, setScopeId] = useState<string | undefined>(undefined);

  const { canReadCase, canCreateCase, canUpdateCase, canDeleteCase, canReadScope } = usePermission();
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [parentsRes, modRes, memRes] = await Promise.all([
        apiClient.get("/api/v2/qa/parents", {
          params: {
            page,
            pageSize,
            search: debouncedSearch || undefined,
            module_id: moduleFilter || undefined,
            // Additional filters will need to be supported by the backend, 
            // but we'll pass them in case the backend uses them.
            status: statusFilter || undefined,
            automation: automationFilter || undefined,
            owner: ownerFilter || undefined,
            project_id: projectFilter || undefined,
            allowed_projects: projectOptions.length > 0 ? projectOptions.map(p => p.value).join(',') : undefined
          }
        }),
        axios.get("/api/v2/qa/modules", { params: { limit: 1000, project_id: projectFilter } }),
        MembersService.getMembers({ limit: 500 }).catch(() => ({ data: [] }))
      ]);
      const body = (parentsRes as any).data;
      setParentCases(body?.data || []);
      setTotalItems(body?.pagination?.total || 0);
      setStats(body?.stats || {});
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
      setUsersList((memRes as any)?.data || []);
    } catch (error) {
      message.error("Failed to fetch test cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadCase && projectFilter) {
      fetchScopes();
    }
  }, [canReadCase, canReadScope, projectFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * The test scopes the drawer offers. A case belongs to the module its scope
   * plans against, so the scope is picked first; someone who cannot read scopes
   * just picks the module.
   */
  const fetchScopes = async () => {
    if (!canReadScope) return setScopesAvailable(false);
    try {
      // Scopes are keyed by project *name*, not id.
      const res: any = await axios.get("/api/v2/qa/test-scopes", {
        params: {
          pageSize: 1000,
          product: projectOptions.find(p => p.value === projectFilter)?.label || undefined,
        },
      });
      const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
      setScopes(Array.isArray(list) ? list : []);
      setScopesAvailable(Array.isArray(list) && list.length > 0);
    } catch (err) {
      console.error("Failed to fetch test scopes:", err);
      setScopesAvailable(false);
    }
  };

  useEffect(() => {
    /* Nothing is worth fetching until a project is chosen — an unscoped list
       is exactly what this page moved away from. */
    if (canReadCase && projectFilter) {
      fetchData();
    }
  }, [canReadCase, projectFilter, page, pageSize, debouncedSearch, moduleFilter, statusFilter, automationFilter, ownerFilter]);

  /** Switching project drops filters that name things from the old one. */
  const chooseProject = (id: string | null) => {
    setProjectId(id);
    setModuleFilter(undefined);
    setStatusFilter(undefined);
    setAutomationFilter(undefined);
    setOwnerFilter(undefined);
    setSearchTerm('');
    setPage(1);
  };

  // Any filter change resets to the first page
  useEffect(() => {
    setPage(1);
  }, [searchTerm, moduleFilter, statusFilter, automationFilter, ownerFilter, projectFilter]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setEditingRecord(null);
    setScopeId(undefined);
    setFormData({
      title: "",
      module_id: undefined,
      project_id: projectFilter,
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

    // Try to infer the saved scope from the case's module — find a scope whose
    // details.modules list contains this module's name. This lets the Test Scope
    // field show the right value when the drawer is re-opened.
    let inferredScopeId: string | undefined = undefined;
    if (r.module_id && scopes.length > 0) {
      // Find the module object so we can compare by name.
      const mod = modules.find((m: any) => String(m.id) === String(r.module_id));
      const modName = norm(mod?.module_name || mod?.name || r.module_name);
      if (modName) {
        const matchedScope = scopes.find((sc: any) => {
          const names: string[] = Array.isArray(sc.details?.modules) ? sc.details.modules : [];
          return names.some((n: string) => norm(n) === modName);
        });
        if (matchedScope) inferredScopeId = String(matchedScope.id);
      }
    }
    setScopeId(inferredScopeId);

    setFormData({
      title: r.title || "",
      module_id: r.module_id || undefined,
      project_id: r.project_id || projectFilter,
      feature: r.feature || "",
      automation: r.automation || "Manual",
      status: r.status || "Draft",
      owner: r.owner || r.created_by || undefined
    });
    setDrawerVisible(true);
  };

  const selectedScope = useMemo(
    () => scopes.find(sc => String(sc.id) === scopeId),
    [scopes, scopeId],
  );

  /** The name the drawer's project goes by on a scope — scopes store the project's *name*. */
  const selectedProjectName = useMemo(
    () => projectOptions.find(p => p.value === formData.project_id)?.label,
    [projectOptions, formData.project_id],
  );

  /** A scope's product, matched back to a project the user can actually file against. */
  const projectIdForProduct = (product: any) => {
    const key = norm(product);
    if (!key) return undefined;
    return projectOptions.find(p => norm(p.label) === key)?.value;
  };

  /**
   * The scopes on offer. Choosing a project narrows the list to that project's
   * scopes; scopes that name no product stay in, since nothing says they belong
   * elsewhere.
   */
  const visibleScopes = useMemo(() => {
    const key = norm(selectedProjectName);
    if (!key) return scopes;
    return scopes.filter((sc: any) => {
      const product = norm(sc.details?.product);
      return !product || product === key;
    });
  }, [scopes, selectedProjectName]);

  /** Picking a scope fills in the project it plans against. */
  const handleScopeChange = (val?: string) => {
    setScopeId(val || undefined);
    const sc = scopes.find((s: any) => String(s.id) === String(val));
    const projectId = projectIdForProduct(sc?.details?.product);
    if (!projectId) return;
    setFormData(prev => (prev.project_id === projectId ? prev : { ...prev, project_id: projectId }));
  };

  /** Changing the project drops a scope that plans against a different one. */
  const handleProjectChange = (val?: string) => {
    setFormData(prev => ({ ...prev, project_id: val }));
    if (!scopeId) return;
    const name = norm(projectOptions.find(p => p.value === val)?.label);
    const product = norm(scopes.find((s: any) => String(s.id) === scopeId)?.details?.product);
    if (name && product && product !== name) setScopeId(undefined);
  };

  /**
   * The modules a scope plans against, resolved from the names it stores in
   * `details.modules` to the rows a case is filed under. Modules are per-project,
   * so a name is matched inside the scope's own product first.
   */
  const scopeModules = useMemo(() => {
    const named: any[] = Array.isArray(selectedScope?.details?.modules)
      ? selectedScope.details.modules
      : [];
    const product = norm(selectedScope?.details?.product);
    const seen = new Set<string>();

    return named
      .map((raw: any) => String(raw ?? "").trim())
      .filter(name => {
        const key = norm(name);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(name => {
        const matches = modules.filter((m: any) => norm(m.module_name || m.name) === norm(name));
        const match =
          matches.find((m: any) => product && norm(m.project_name) === product) ||
          matches.find((m: any) => !m.project_name) ||
          matches[0];
        return { name, id: match?.id as string | undefined };
      });
  }, [selectedScope, modules]);

  /** Only modules that exist as rows can be saved — a name alone has no id to file under. */
  const resolvedScopeModules = useMemo(() => {
    if (!selectedScope) return [];
    // The scope stores an array of module names in details.modules.
    // Map those back to the full module objects we loaded.
    const names = selectedScope.details?.modules || [];
    return modules.filter(m => names.includes(m.module_name));
  }, [selectedScope, modules]);

  /**
   * One module on the scope → the field is settled, so it is shown read-only.
   * Several → the scope's own shortlist. None → the whole list, since the scope
   * never said which module its cases belong to.
   */
  const moduleMode: "locked" | "scoped" | "open" =
    !selectedScope
      ? "open"
      : resolvedScopeModules.length === 1
        ? "locked"
        : resolvedScopeModules.length > 1
          ? "scoped"
          : "open";

  /**
   * With no module of its own, a scope still narrows the list to its product —
   * and with no scope at all, the chosen project does the same job.
   */
  const openModules = useMemo(() => {
    const product = norm(selectedScope?.details?.product) || norm(selectedProjectName);
    if (!product) return modules;
    const ofProduct = modules.filter((m: any) => norm(m.project_name) === product);
    return ofProduct.length ? ofProduct : modules;
  }, [modules, selectedScope, selectedProjectName]);

  // Picking a scope decides the module for you when it names exactly one; any
  // other change clears a module the new scope may not even have.
  useEffect(() => {
    if (!scopeId) return;
    setFormData(prev => {
      if (resolvedScopeModules.length === 1) {
        return prev.module_id === resolvedScopeModules[0].id
          ? prev
          : { ...prev, module_id: resolvedScopeModules[0].id };
      }
      const keep =
        resolvedScopeModules.length > 1 &&
        prev.module_id &&
        resolvedScopeModules.some(m => m.id === prev.module_id);
      return keep || prev.module_id === undefined ? prev : { ...prev, module_id: undefined };
    });
  }, [scopeId, resolvedScopeModules]);

  const scopeOptions = visibleScopes.map((sc: any) => ({
    value: String(sc.id),
    label: sc.name || "Untitled scope",
    description: [sc.details?.product, sc.status].filter(Boolean).join(" · ") || undefined,
  }));

  /**
   * A project with no scopes of its own must not trap the drawer behind a
   * required, empty dropdown — the module is then picked directly.
   */
  const scopeRequired = scopesAvailable && visibleScopes.length > 0;

  /**
   * What the Module dropdown offers: the scope's own modules once it names any,
   * otherwise the list narrowed to the scope's product.
   */
  const moduleOptions =
    moduleMode === "open"
      ? openModules.map((mod: any) => ({
        value: mod.id,
        label: mod.module_name || mod.name || "Module",
        description: mod.project_name || undefined,
      }))
      : scopeModules.map(mod => ({
        value: mod.id ?? `missing:${mod.name}`,
        label: mod.name,
        description: mod.id ? "From the selected scope" : "No longer in the module list",
        disabled: !mod.id,
      }));

  const moduleHint =
    moduleMode === "locked"
      ? "Set by the selected scope."
      : moduleMode === "scoped"
        ? "This scope plans against several modules — pick the one this case belongs to."
        : selectedScope
          ? "This scope doesn’t name a module — choose the one this case belongs to."
          : "";

  /**
   * On create the module only appears once the scope has been chosen; an
   * existing case already has one, so editing never hides it.
   */
  const showModuleField = !!editingId || !scopeRequired || !!scopeId;

  const handleSaveParent = async () => {
    if (!formData.title.trim()) {
      message.error("Please enter a Test Case Title");
      return;
    }
    if (!formData.project_id) {
      message.error("Please select a Project — bugs raised from this case are filed against it");
      return;
    }
    if (!editingId && scopeRequired && !scopeId) {
      message.error("Please select a Test Scope — it decides the module this case is filed under");
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await axios.put(`/api/v2/qa/parents/${editingId}`, formData);
        message.success("Test Case updated successfully!");
        setDrawerVisible(false);
      } else {
        await axios.post(`/api/v2/qa/parents`, formData);
        setSuccessData({ name: formData.title.trim() });
      }
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

  const filteredData = parentCases; // Data is already filtered by backend

  // Stat figures
  const readyCount = stats?.readyCount || 0;
  const automatedCount = stats?.automatedCount || 0;
  const totalChildCases = stats?.childCount || 0;

  // Filter option lists, using backend data
  const uniqueSorted = (values: any[]) =>
    Array.from(new Set(values.filter(Boolean)))
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map(v => ({ value: String(v), label: String(v) }));

  const statusFilterOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Ready', label: 'Ready' },
    { value: 'Active', label: 'Active' },
    { value: 'Deprecated', label: 'Deprecated' }
  ];

  const automationFilterOptions = [
    { value: 'Manual', label: 'Manual' },
    { value: 'Automated', label: 'Automated' }
  ];

  const ownerFilterOptions = usersList.map(u => ({ value: u.name, label: u.name }));

  const moduleNavOptions = modules.map(m => ({ value: String(m.module_name), label: String(m.module_name) }));
  const moduleFilterOptions = [{ value: 'Unassigned', label: 'Unassigned' }, ...moduleNavOptions];

  /* The header switch offers mine-vs-all; the filter panel still narrows to
     any other owner. */
  const isMyCases = !!user?.name && ownerFilter === user.name;

  /* ── Overview banner figures ───────────────────────────────────────────
     The Ticket List's sprint head reads a sprint's completion; here the same
     three rows read how much of the case library is ready to run. */
  const projectName = projectOptions.find(p => p.value === selectedProjectId)?.label;
  const readyPct = totalItems > 0 ? Math.round((readyCount / totalItems) * 100) : 0;
  const bannerAccent = readyPct >= 60 ? '#10b981' : readyPct > 0 ? '#3b82f6' : '#64748b';
  const bannerScopeLabel = isMyCases ? 'My Cases' : !ownerFilter ? 'All Cases' : `${ownerFilter}'s Cases`;

  const activeFilterCount = (searchTerm.trim() ? 1 : 0) + (moduleFilter ? 1 : 0) + (statusFilter ? 1 : 0) +
    (automationFilter ? 1 : 0) + (ownerFilter ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setModuleFilter(undefined);
    setStatusFilter(undefined);
    setAutomationFilter(undefined);
    setOwnerFilter(undefined);
  };

  // Client-side pagination variables are now derived from totalItems for the footer
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, totalItems);
  const pagedCases = parentCases;

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
          className="pp-case-id"
          onClick={(e) => { e.stopPropagation(); router.push(`/qa-workspace/test-cases/${id}`); }}
          title={id}
        >
          {String(id || '').slice(0, 8).toUpperCase()}
          <CopyOutlined
            style={{ fontSize: 10, opacity: 0.6 }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(id);
              message.success("Case ID copied!");
            }}
          />
        </span>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 300,
      ellipsis: true,
      render: (t: string) => (
        <div className="pp-name-cell" title={t || "Unnamed Test Case"}>
          <span className="pp-name-icon"><Folder size={13} /></span>
          <span className="pp-name-title">{t || "Unnamed Test Case"}</span>
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (t: string) => {
        const v = t || 'Draft';
        const color = (v === 'Ready' || v === 'Active') ? '#10b981'
          : v === 'Deprecated' ? '#ef4444'
          : v === 'Draft' ? '#64748b' : '#3b82f6';
        return (
          <span className="pp-vis-pill" style={{ color, background: `${color}1A`, borderColor: `${color}40` }}>
            <span className="pp-vis-dot" style={{ background: color }} />
            {v}
          </span>
        );
      }
    },
    {
      title: "Owner",
      dataIndex: "qa_owner",
      key: "qa_owner",
      width: 150,
      render: (_: any, record: any) => {
        const name = ownerNameOf(record);
        if (!name) return <span className="sc-muted">—</span>;
        return (
          <span className="pp-creator" title={name}>
            <span className="sc-person__av">{initialsOf(name)}</span>
            <span className="pp-creator-name">{name.split(' ')[0]}</span>
          </span>
        );
      }
    },
    {
      title: "Automation",
      dataIndex: "automation",
      key: "automation",
      width: 130,
      render: (t: string) => {
        const automated = t === 'Automated';
        const color = automated ? '#3b82f6' : '#64748b';
        return (
          <span className="pp-vis-pill" style={{ color, background: `${color}1A`, borderColor: `${color}40` }}>
            <span className="pp-vis-dot" style={{ background: color }} />
            {t || 'Manual'}
          </span>
        );
      }
    },
    {
      title: "Module",
      dataIndex: "module_name",
      key: "module_name",
      width: 160,
      ellipsis: true,
      render: (t: string) => (
        <span className="pp-vis-pill pp-vis-pill--ash">{t || 'Unassigned'}</span>
      )
    },
    {
      title: "Feature",
      dataIndex: "feature",
      key: "feature",
      width: 150,
      ellipsis: true,
      render: (t: string) => t
        ? <span className="pp-plain">{t}</span>
        : <span className="sc-muted">—</span>
    },
    {
      title: "Cases",
      dataIndex: "child_count",
      key: "child_count",
      width: 84,
      align: 'center' as const,
      render: (t: any) => {
        const n = parseInt(t || '0', 10);
        return <span className={`pp-count${n === 0 ? ' is-zero' : ''}`}>{n}</span>;
      }
    },
    {
      title: "Suites",
      key: "linked_suites",
      width: 100,
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
      fixed: 'right' as const,
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

  /** One empty state for the table and the card grid, on the shared NoData
      illustration so every list reads the same when it has nothing to show. */
  const renderEmpty = () => (
    <NoData
      description={
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
      }
    />
  );

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
      <style dangerouslySetInnerHTML={{ __html: CASES_PAGE_STYLES }} />

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
                  placeholder="Quick search cases, modules, features..."
                  prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />}
                  className="saas-input"
                  style={{ maxWidth: 260, borderRadius: 8, height: 30, background: 'transparent', fontSize: 12 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!projectFilter}
                  allowClear
                />

                <Space.Compact className="ticket-filter-group">
                  <Popover
                    content={
                      <TestCaseFilters
                        filters={{ moduleFilter, statusFilter, automationFilter, ownerFilter }}
                        onFilterChange={(key, val) => {
                          if (key === 'moduleFilter') setModuleFilter(val || undefined);
                          if (key === 'statusFilter') setStatusFilter(val || undefined);
                          if (key === 'automationFilter') setAutomationFilter(val || undefined);
                          if (key === 'ownerFilter') setOwnerFilter(val || undefined);
                        }}
                        onReset={clearFilters}
                        moduleOptions={moduleFilterOptions}
                        statusOptions={statusFilterOptions}
                        automationOptions={automationFilterOptions}
                        ownerOptions={ownerFilterOptions}
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

              {/* Right side — the owner switch that used to live in the rail,
                  then the view controls. */}
              <Space size={10} className="sc-header-right">
                <Segmented
                  className="saas-segmented-premium sc-owner-seg"
                  value={isMyCases ? 'mine' : !ownerFilter ? 'all' : 'other'}
                  onChange={(v) => {
                    if (v === 'mine') setOwnerFilter(user?.name);
                    else if (v === 'all') setOwnerFilter(undefined);
                  }}
                  options={[
                    {
                      value: 'mine',
                      disabled: !user?.name,
                      label: (
                        <span className="sc-owner-opt">
                          <User size={13} />
                          <span className="sc-owner-opt__label">My Cases</span>
                        </span>
                      ),
                    },
                    {
                      value: 'all',
                      label: (
                        <span className="sc-owner-opt">
                          <Users size={13} />
                          <span className="sc-owner-opt__label">All Cases</span>
                        </span>
                      ),
                    },
                    /* An owner picked from the filter panel is neither "mine"
                       nor "all" — surfaced here so the switch never lies. */
                    ...(!isMyCases && ownerFilter
                      ? [{
                          value: 'other',
                          label: (
                            <span className="sc-owner-opt">
                              <UserOutlined style={{ fontSize: 12 }} />
                              <span className="sc-owner-opt__label">{ownerFilter}</span>
                            </span>
                          ),
                        }]
                      : []),
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

                {canCreateCase && projectFilter && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateModal}
                    style={{ height: 36, borderRadius: 8, fontWeight: 700 }}
                    data-tour="test-cases"
                  >
                    Create Test Case
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
                    icon={<ApartmentOutlined style={{ fontSize: 11 }} />}
                    label="Module"
                    value={moduleFilter || ""}
                    options={moduleFilterOptions}
                    onChange={(val) => setModuleFilter(val || undefined)}
                    itemNoun="modules"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<CheckCircleOutlined style={{ fontSize: 11 }} />}
                    label="Status"
                    value={statusFilter || ""}
                    options={statusFilterOptions}
                    onChange={(val) => setStatusFilter(val || undefined)}
                    itemNoun="statuses"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<ThunderboltOutlined style={{ fontSize: 11 }} />}
                    label="Automation"
                    value={automationFilter || ""}
                    options={automationFilterOptions}
                    onChange={(val) => setAutomationFilter(val || undefined)}
                    itemNoun="types"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<UserOutlined style={{ fontSize: 11 }} />}
                    label="Owner"
                    value={ownerFilter || ""}
                    options={ownerFilterOptions}
                    onChange={(val) => setOwnerFilter(val || undefined)}
                    itemNoun="owners"
                    multiple={false}
                    showAvatar
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
              /* Until the project is known there are no cases, stats or filters
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
                    subtitle="Test cases are written against one project. Pick one to open its cases."
                  />
                )}
              </div>
            ) : (
              <div className="tl-section">
                {/* ── Overview banner — the Ticket List's sprint head, reading
                     the case library instead: how much of it is ready. ───── */}
                <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
                  <div className="tl-sprint-row1">
                    <div className="tl-sprint-title-block">
                      <span
                        className="tl-sprint-dot"
                        style={{ background: bannerAccent, boxShadow: `0 0 0 3px ${bannerAccent}33` }}
                      />
                      <Typography.Text
                        className="tl-sprint-title"
                        ellipsis={{ tooltip: `${projectName || 'Project'} — ${bannerScopeLabel}` }}
                      >
                        {projectName || 'Project'} — {bannerScopeLabel}
                      </Typography.Text>
                      <span className="tl-sprint-tags">
                        <span className="tl-sprint-tag tl-sprint-tag-active">{totalItems} CASES</span>
                        {moduleFilter && (
                          <span className="tl-sprint-tag tl-sprint-tag-module">{moduleFilter}</span>
                        )}
                      </span>
                    </div>
                    <div className="tl-sprint-actions">
                      <Button
                        type="default"
                        size="small"
                        icon={<ApartmentOutlined />}
                        onClick={() => router.push(MODULES_SETTINGS_HREF)}
                        className="saas-button-item tl-sprint-burndown-btn"
                      >
                        Modules{modules.length ? ` (${modules.length})` : ''}
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        icon={<Layers size={13} />}
                        onClick={() => router.push('/qa-workspace/test-suites')}
                        className="saas-button-item tl-sprint-complete-btn"
                      >
                        Test Suites
                      </Button>
                    </div>
                  </div>

                  <div className="tl-sprint-row2">
                    <span className="tl-sprint-meta">
                      <ApartmentOutlined style={{ fontSize: 11 }} />
                      <span>{modules.length} modules covered</span>
                    </span>
                    <span className="tl-sprint-meta">
                      <b>{readyCount}</b>/{totalItems} cases ready
                    </span>
                    <span className="tl-sprint-meta">
                      <b>{automatedCount}</b> automated
                    </span>
                    <span className="tl-sprint-meta">
                      <b>{totalChildCases}</b> module cases nested
                    </span>
                  </div>

                  <div className="tl-sprint-row3">
                    <div className="tl-sprint-progress-bar">
                      <div className="tl-sprint-progress-fill" style={{ width: `${Math.min(100, readyPct)}%` }} />
                    </div>
                    <span className="tl-sprint-progress-pct">{readyPct}%</span>
                  </div>
                </div>

                <div className="tl-section-body">
                  {/* Only the results blur, so the filters above stay usable
                      while a search refetches. */}
                  <ZukvoLoadingOverlay loading={loading} message="Loading test cases…">
                    {viewMode === 'list' ? (
                      <div className="pp-table-wrap">
                        <Table
                          className="saas-table tl-table pp-table"
                          dataSource={pagedCases}
                          columns={columns}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          scroll={{ x: 'max-content' }}
                          onRow={(record) => ({
                            className: 'pp-row',
                            onClick: (e) => {
                              const t = e.target as HTMLElement;
                              if (t.closest('button, a, .ant-dropdown-trigger, .sc-rowactions, .pp-case-id, .tc-suites')) return;
                              router.push(`/qa-workspace/test-cases/${record.id}`);
                            },
                          })}
                          locale={{
                            /* "No test cases yet" would be a lie while the first page is
                               still in flight — hold the height instead. */
                            emptyText: loading ? <div style={{ minHeight: 240 }} /> : renderEmpty()
                          }}
                        />
                      </div>
                    ) : (
                      <div className="sc-gridwrap">
                        <div className="pp-grid">
                          {loading ? null : filteredData.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1' }}>{renderEmpty()}</div>
                          ) : (
                            pagedCases.map(r => renderCaseCard(r))
                          )}
                        </div>
                      </div>
                    )}
                  </ZukvoLoadingOverlay>

                  {/* Pager sits outside the scroll area so it stays pinned to
                      the bottom of the pane whether or not the list overflows. */}
                  {filteredData.length > 0 && (
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

      {/* Create / Edit Parent Test Case Drawer */}
      <Drawer
        {...commonDrawerProps}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSuccessData(null);
        }}
        maskClosable={!submitting}
      >
        <style>{formStyles}</style>
        <style>{NO_MODULES_STYLES}</style>
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

          {/* Drawer Body & Footer */}
          {successData ? (
            <div style={{ padding: "20px 24px", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PostCreationSuccessScreen
                itemType="Test Case"
                itemName={successData.name}
                onCreateAnother={() => {
                  setSuccessData(null);
                  setFormData({
                    title: "",
                    module_id: undefined,
                    project_id: selectedProjectId || undefined,
                    feature: "",
                    automation: "Manual",
                    status: "Draft",
                    owner: undefined
                  });
                }}
                onContinue={() => {
                  setDrawerVisible(false);
                  setSuccessData(null);
                }}
              />
            </div>
          ) : (
            <>
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
                subtitle="Define the test case title, the scope it plans against, and its module"
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
                      The project you are viewing — switch it in the sidebar to file against another.
                      Bugs raised from runs of this test case are filed under its bug list.
                    </span>
                  }
                >
                  {/* Fixed to the project the list is showing — a case filed
                      against another one would vanish the moment it saved. */}
                  <SearchableDropdown
                    options={projectOptions}
                    value={formData.project_id}
                    onChange={(val: any) => handleProjectChange(val || undefined)}
                    placeholder={loadingProjects ? "Loading projects…" : projectOptions.length ? "Select a project" : "No projects available"}
                    searchPlaceholder="Search your projects…"
                    itemNoun="projects"
                    loading={loadingProjects}
                    disabled
                    allowClear={false}
                    style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                  />
                </Form.Item>

                {/* The scope decides the module, so it is picked first. */}
                {scopesAvailable && (
                  <Form.Item
                    label="Test Scope"
                    required={!editingId && scopeRequired}
                    style={{ marginBottom: 16 }}
                    extra={
                      <span style={{ fontSize: 11.5, color: "var(--text-slate-400)" }}>
                        {!scopeRequired && selectedProjectName
                          ? `${selectedProjectName} has no test scopes yet — pick the module directly.`
                          : editingId
                            ? "Pick a scope to re-file this case under the module that scope plans against."
                            : selectedProjectName
                              ? `Scopes planning against ${selectedProjectName}. Picking one decides the module below.`
                              : "The plan this case is written against — picking one fills in its project and module."}
                      </span>
                    }
                  >
                    <SearchableDropdown
                      options={scopeOptions}
                      value={scopeId}
                      onChange={(val: any) => handleScopeChange(val || undefined)}
                      placeholder={scopeRequired ? "Select a test scope" : "No scopes for this project"}
                      searchPlaceholder="Search scopes…"
                      itemNoun="scopes"
                      disabled={!scopeRequired}
                      style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                    />
                  </Form.Item>
                )}

                <div style={{ display: "grid", gridTemplateColumns: showModuleField ? "1fr 1fr" : "1fr", gap: 16 }}>
                  {/* Before a scope is chosen there is nothing to file the case under. */}
                  {showModuleField && (
                    <Form.Item
                      label={
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          Module (Business Module)
                          {moduleMode === "locked" && (
                            <span
                              style={{
                                padding: "1px 7px",
                                borderRadius: 999,
                                fontSize: 10.5,
                                fontWeight: 600,
                                letterSpacing: ".02em",
                                color: "#3B82F6",
                                background: "rgba(59,130,246,.09)",
                                border: "1px solid rgba(59,130,246,.2)",
                              }}
                            >
                              From scope
                            </span>
                          )}
                        </span>
                      }
                      style={{ marginBottom: 0 }}
                      extra={
                        moduleHint ? (
                          <span style={{ fontSize: 11.5, color: "var(--text-slate-400)" }}>{moduleHint}</span>
                        ) : undefined
                      }
                    >
                      <SearchableDropdown
                        options={moduleOptions}
                        value={formData.module_id}
                        onChange={(val: any) => setFormData({ ...formData, module_id: val })}
                        placeholder={moduleMode === "scoped" ? "Pick one of this scope’s modules" : "Select business module"}
                        searchPlaceholder="Search modules…"
                        itemNoun="modules"
                        disabled={moduleMode === "locked"}
                        allowClear={moduleMode !== "locked"}
                        emptyComponent={
                          <NoModulesEmpty
                            projectName={selectedScope?.details?.product || selectedProjectName}
                            onRefresh={fetchData}
                          />
                        }
                        style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                      />
                    </Form.Item>
                  )}

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
          </>
          )}
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

/* ────────────────────────────────────────────────────────────────────────────
   Styles — the Ticket List's shell, header, banner, table and pager, with the
   case-specific cells layered on top.
   ──────────────────────────────────────────────────────────────────────── */
const CASES_PAGE_STYLES = `
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
.pp-case-id {
  cursor: pointer; color: var(--premium-blue, #3B82F6); font-weight: 700; font-size: 11px;
  font-family: 'JetBrains Mono', monospace; letter-spacing: -0.02em;
  padding: 2px 6px; background: var(--bg-blue-50); border-radius: 4px;
  border: 1px solid var(--border-blue-200); white-space: nowrap;
  display: inline-flex; align-items: center; gap: 4px;
  transition: opacity .15s ease;
}
.pp-case-id:hover { opacity: 0.8; }

.pp-plain { font-size: 11.5px; color: var(--text-slate-700); }
[data-theme='dark'] .pp-plain { color: #cbd5e1; }

.tc-suites {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 999px; cursor: pointer;
  font-size: 11.5px; font-weight: 600;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.22);
  transition: background .15s ease;
}
.tc-suites:hover { background: rgba(59,130,246,.18); }

/* The module a case is filed under, when the list is narrowed to one. */
.tl-sprint-tag-module { background: transparent; color: #3b82f6; border-color: rgba(59,130,246,0.32); }

.sc-empty__icon { display: inline-block; }
`;

