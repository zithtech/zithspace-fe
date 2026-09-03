"use client";
import { message } from "@/providers/AntdGlobalProvider";

import React, { Suspense, useState, useEffect } from "react";

import NoData from "@/components/common/NoData";
import MainLayout from "@/components/layout/MainLayout";
import { Button,
  Tooltip,
  Result,
  Table,
  Typography,
  Input,
  Select,
  Dropdown,
  Popover,
  Space,
  Segmented,
  Divider,
} from "antd";
import {
  PlusOutlined,
  SnippetsOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EllipsisOutlined,
  RightOutlined,
  FilterOutlined,
  ExpandAltOutlined,
  ReloadOutlined,
  CopyOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UserOutlined,
  CalendarOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  User,
  Users,
  Pencil,
  Trash2,
  PlayCircle,
  Boxes,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios, apiClient } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader, { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import dayjs from "dayjs";
import { useQaProject, QaProjectPicker, QaProjectSwitcher } from "@/components/qa/QaProjectGate";
import TestScopeFilters from "./TestScopeFilters";

const { Text } = Typography;


function initialsOf(name: string) {
  if (!name) return 'TS';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

const CARD_ACCENTS = [
  ['#3b82f6', '#1d4ed8']
];

function accentFor(str: string) {
  const h = Math.abs(hashCode(str || 'default'));
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
}

/* ── Scope list primitives ─────────────────────────────────────────────────── */

/* Status colours stay inside the workspace palette: blue / green / ash, with
   light red reserved for the one genuinely negative outcome. */
const STATUS_TONE: Record<string, { color: string }> = {
  Approved: { color: '#10b981' },
  Rejected: { color: '#ef4444' },
  'In Review': { color: '#3b82f6' },
  Draft: { color: '#64748b' },
  'On Hold': { color: '#64748b' },
  Archived: { color: '#94a3b8' },
};

/** Status as the Ticket List's dotted pill, so both lists read the same. */
const StatusPill = ({ status }: { status?: string }) => {
  const color = STATUS_TONE[status || '']?.color || '#3b82f6';
  return (
    <span
      className="pp-vis-pill"
      style={{ color, background: `${color}1A`, borderColor: `${color}40` }}
    >
      <span className="pp-vis-dot" style={{ background: color }} />
      {status || '—'}
    </span>
  );
};

const PRIORITY_LEVEL: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

/** Priority as filled steps — conveys rank without adding accent colours. */
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

/** Initials avatar + name, in the Ticket List's assignee shape. */
const PersonChip = ({ name, muted }: { name?: string; muted?: boolean }) => {
  if (!name) return <span className="sc-muted">—</span>;
  return (
    <span className="pp-creator" title={name}>
      <span className={`sc-person__av${muted ? ' is-muted' : ''}`}>{initialsOf(name)}</span>
      <span className="pp-creator-name">{name.split(' ')[0]}</span>
    </span>
  );
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : null;

const TIMELINE_FILTERS = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'active', label: 'Running now' },
  { value: 'soon', label: 'Due in 7 days' },
  { value: 'upcoming', label: 'Not started' },
  { value: 'undated', label: 'No dates set' },
];

/** Which timeline bucket a scope falls into, for the timeline filter. */
const timelineBucket = (s: any): string => {
  const start = s.start_date ? dayjs(s.start_date) : null;
  const end = s.end_date ? dayjs(s.end_date) : null;
  if (!start?.isValid() && !end?.isValid()) return 'undated';
  const now = dayjs();
  if (end?.isValid() && end.isBefore(now, 'day')) return 'overdue';
  if (end?.isValid() && end.diff(now, 'day') <= 7) return 'soon';
  if (start?.isValid() && start.isAfter(now, 'day')) return 'upcoming';
  return 'active';
};

/** Planned window plus a relative hint for scopes that are running or overdue. */
const TimelineCell = ({ start, end }: { start?: string; end?: string }) => {
  if (!start && !end) return <span className="sc-muted">—</span>;
  const now = dayjs();
  const endDay = end ? dayjs(end) : null;
  const startDay = start ? dayjs(start) : null;

  let hint = '';
  let tone = 'sc-timeline__hint';
  if (endDay?.isValid() && endDay.isBefore(now, 'day')) {
    hint = `${now.diff(endDay, 'day')}d overdue`;
    tone += ' is-late';
  } else if (endDay?.isValid()) {
    hint = `${endDay.diff(now, 'day')}d left`;
  } else if (startDay?.isValid() && startDay.isAfter(now, 'day')) {
    hint = `starts in ${startDay.diff(now, 'day')}d`;
  }

  return (
    <span className="sc-timeline">
      <span className="sc-timeline__range">{fmtDate(start) || 'TBD'} – {fmtDate(end) || 'TBD'}</span>
      {hint ? <span className={tone}>{hint}</span> : null}
    </span>
  );
};

function TestScopeContent() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestScope" });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [scopes, setScopes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [stats, setStats] = useState<any>({
    totalScopes: 0,
    approved: 0,
    inReview: 0,
    inDraft: 0,
    pendingApprovals: 0,
    routedForApproval: 0,
    draftNoDueDate: 0,
    overdueCount: 0,
  });
  const [totalScopes, setTotalScopes] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [ownerFilter, setOwnerFilter] = useState<string | undefined>();
  const [timelineFilter, setTimelineFilter] = useState<string | undefined>();
  /* Scopes are read inside one project, the way the Bug List works — the
     choice is remembered and shared with the other QA Space lists. Scopes
     store the project's *name* as `details.product`, so that is what the
     queries below filter on. */
  const {
    projects: userProjects,
    ready: projectReady,
    loading: loadingProjects,
    projectId: selectedProjectId,
    projectName: projectFilter,
    setProjectId,
  } = useQaProject();
  const [sortKey] = useState<string>('recent');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sprintsMap, setSprintsMap] = useState<Record<string, string>>({});
  const [ownerCounts, setOwnerCounts] = useState({ all: 0, mine: 0 });

  const { canReadScope, canCreateScope, canUpdateScope, canDeleteScope } = usePermission();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [hasInitializedOwner, setHasInitializedOwner] = useState(false);

  // Pre-fill the QA Owner filter with the current user's name once auth loads,
  // or restore the last selected filter from session storage.
  useEffect(() => {
    if (!isLoading && user?.name && !hasInitializedOwner) {
      const stored = sessionStorage.getItem('testScopeOwnerFilter');
      if (stored !== null) {
        setOwnerFilter(stored || undefined);
      } else {
        setOwnerFilter(user.name);
      }
      setHasInitializedOwner(true);
    }
  }, [isLoading, user?.name, hasInitializedOwner]);

  useEffect(() => {
    if (hasInitializedOwner) {
      sessionStorage.setItem('testScopeOwnerFilter', ownerFilter || '');
    }
  }, [ownerFilter, hasInitializedOwner]);

  // Any filter change resets to the first page
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, ownerFilter, timelineFilter, projectFilter]);

  const fetchStats = async () => {
    try {
      // api.get() auto-unwraps: returns response.data.data directly
      // So `res` is already { totalScopes, approved, inReview, ... }
      const res: any = await axios.get("/api/v2/qa/test-scopes/stats", {
        params: {
          product: projectFilter || undefined,
          qa_owner: ownerFilter || undefined
        },
      });
      if (res && res.totalScopes !== undefined) {
        setStats(res);
      }
    } catch (err) {
      console.error('fetchStats error:', err);
    }
  };

  const fetchScopes = async () => {
    try {
      setLoading(true);
      // Use apiClient (raw axios) so we get the full response including pagination
      const res: any = await apiClient.get("/api/v2/qa/test-scopes", {
        params: {
          page,
          pageSize,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          qa_owner: ownerFilter || undefined,
          ...(projectFilter ? { product: projectFilter } : {}),
          // Pass the user's accessible project names so the backend restricts visibility
          ...(userProjects.length > 0 ? { allowed_products: userProjects.map(p => p.label).join(',') } : {}),
          sortBy: sortKey === 'endDate' ? 'endDate' : sortKey === 'name' ? 'name' : 'created_at',
          sortOrder: 'desc',
        }
      });
      // Backend: { success: true, data: [...], pagination: { total, page, pageSize, totalPages } }
      const body = res.data;
      setScopes(body?.data || []);
      setTotalScopes(body?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    /* Nothing is worth fetching until a project is chosen — an unscoped list
       is exactly what this page moved away from. */
    if (!isLoading && canReadScope && projectFilter) {
      fetchScopes();
      fetchStats();
    }
  }, [isLoading, canReadScope, page, pageSize, debouncedSearch, statusFilter, priorityFilter, ownerFilter, projectFilter, userProjects, sortKey]);

  /** Switching project drops filters that name things from the old one. */
  const chooseProject = (id: string | null) => {
    setProjectId(id);
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
    setTimelineFilter(undefined);
    setSearchTerm('');
    setPage(1);
  };


  /** Confirmation lives in the ConfirmDialog wrapping each delete trigger. */
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/v2/qa/test-scopes/${id}`);
      message.success('Test Scope deleted successfully');
      fetchScopes();
    } catch (error) {
      console.error(error);
      message.error('Failed to delete Test Scope');
    }
  };

  /**
   * The curated option lists (Scope Type / Priority / Status). They are managed
   * in QA Space → Settings; the page still reads them so the filters and the
   * status badges use the workspace's own labels and colours.
   */
  const [scopeSettings, setScopeSettings] = useState<any[]>([]);

  const fetchScopeSettings = async () => {
    try {
      const res: any = await axios.get(`/api/v2/qa/test-scopes/settings?_t=${Date.now()}`);
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (Array.isArray(res?.data)) data = res.data;
      else if (Array.isArray(res?.data?.data)) data = res.data.data;
      setScopeSettings(data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };
  /**
   * Totals behind the My / All Scopes switch, read independent of the
   * filters currently applied to the list.
   */
  const fetchOwnerCounts = async () => {
    try {
      const allRes: any = await axios.get("/api/v2/qa/test-scopes/stats", {
        params: { product: projectFilter || undefined }
      });
      const mineRes: any = user?.name ? await axios.get("/api/v2/qa/test-scopes/stats", {
        params: { product: projectFilter || undefined, qa_owner: user.name }
      }) : null;

      setOwnerCounts({
        all: allRes?.totalScopes ?? 0,
        mine: mineRes?.totalScopes ?? 0
      });
    } catch (err) {
      console.error('fetchOwnerCounts error:', err);
    }
  };

  useEffect(() => {
    if (!isLoading && canReadScope && projectFilter) fetchOwnerCounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, canReadScope, user?.name, userProjects, projectFilter]);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        fetchScopes(),
        fetchStats(),
        fetchScopeSettings(),
        fetchOwnerCounts()
      ]);
      message.success("View refreshed");
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  // ── Initialisation effect: runs once auth is ready ────────────────────────
  useEffect(() => {
    if (!isLoading && canReadScope) {
      fetchScopeSettings();
      axios.get("/api/release-plans").then((res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        const map: Record<string, string> = {};
        data.forEach((s: any) => { if (s.id) map[s.id] = s.name; });
        setSprintsMap(map);
      }).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, canReadScope]);

  /* "My Scopes" vs "All Scopes" both drive the same qa_owner filter. */
  const isMyScopes = !!user?.name && ownerFilter === user.name;
  const isAllScopes = !ownerFilter;

  if (isLoading) return null;

  if (!canReadScope) {
    return (
      <MainLayout>
        <div style={{ padding: "100px 0", background: "var(--bg-pure-white)", minHeight: "calc(100vh - 64px)" }}>
          <Result
            status="403"
            title="403"
            subTitle="Sorry, you are not authorized to access this page."
            extra={<Button type="primary" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>}
          />
        </div>
      </MainLayout>
    );
  }

  /**
   * Linked items are stored either as an array of { name, link } (suites, runs,
   * dev tickets) or as a single object (cases, bug sheets), depending on when
   * the field became multi-select. Both are read here.
   */
  const LINKED_GROUPS = [
    { key: 'testRuns', label: 'Runs', icon: PlayCircle, href: (id: string) => `/qa-workspace/test-runs/${id}` },
    { key: 'testSuites', label: 'Suite', icon: Boxes, href: (id: string) => `/qa-workspace/test-suites/${id}` },
    { key: 'testCases', label: 'Cases', icon: ClipboardList, href: (id: string) => `/qa-workspace/test-cases/${id}` },
  ] as const;

  const linkedEntries = (v: any): Array<{ name: string; link?: string }> => {
    const list = Array.isArray(v) ? v : v ? [v] : [];
    return list
      .filter((i: any) => i?.name)
      .map((i: any) => ({ name: i.name, link: i.link ? String(i.link) : undefined }));
  };

  /**
   * The expanded child row — Runs, Suite and Cases side by side.
   *
   * Each chip is a real link to the record it names, opened in a new tab: the
   * row is a reference while you are scanning the scope list, so following one
   * shouldn't cost you your place. Entries with no id stay as plain text rather
   * than rendering a link that goes nowhere.
   */
  const renderLinkedRow = (record: any) => {
    const li = record?.details?.linkedItems || {};
    const groups = LINKED_GROUPS.map((g) => ({ ...g, items: linkedEntries(li[g.key]) }));

    if (groups.every((g) => g.items.length === 0)) {
      return <div className="sc-linked__empty">Nothing linked to this scope yet.</div>;
    }

    return (
      <div className="sc-linked" onClick={(e) => e.stopPropagation()}>
        {groups.map((g) => (
          <div key={g.key} className="sc-linked__col">
            <div className="sc-linked__head">
              <g.icon size={13} />
              <span className="sc-linked__label">{g.label}</span>
              <span className="sc-linked__count">{g.items.length}</span>
            </div>
            {g.items.length === 0 ? (
              <span className="sc-linked__none">Not linked</span>
            ) : (
              <div className="sc-linked__items">
                {g.items.map((item, i) =>
                  item.link ? (
                    <a
                      key={`${item.name}-${i}`}
                      className="sc-linked__chip is-link"
                      href={g.href(item.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${item.name} in a new tab`}
                    >
                      <span className="sc-linked__chip-text">{item.name}</span>
                      <ExternalLink size={11} className="sc-linked__chip-ext" />
                    </a>
                  ) : (
                    <span key={`${item.name}-${i}`} className="sc-linked__chip" title={item.name}>
                      <span className="sc-linked__chip-text">{item.name}</span>
                    </span>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
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
          className="pp-scope-id"
          onClick={(e) => { e.stopPropagation(); router.push(`/qa-workspace/test-scope/${id}`); }}
          title={id}
        >
          {String(id || '').slice(0, 8).toUpperCase()}
          <CopyOutlined
            style={{ fontSize: 10, opacity: 0.6 }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(id);
              message.success("Scope ID copied!");
            }}
          />
        </span>
      ),
    },
    {
      title: "Title",
      dataIndex: "name",
      key: "name",
      width: 320,
      ellipsis: true,
      render: (t: string) => (
        <div className="pp-name-cell" title={t || 'Untitled scope'}>
          <span className="pp-name-icon"><SnippetsOutlined /></span>
          <span className="pp-name-title">{t || 'Untitled scope'}</span>
        </div>
      )
    },
    {
      title: "Status", dataIndex: "status", key: "status", width: 140,
      render: (t: string) => <StatusPill status={t} />
    },
    {
      title: "QA Owner", dataIndex: "qa_owner", key: "qa_owner", width: 160,
      render: (t: string) => <PersonChip name={t} />
    },
    {
      title: "Priority", dataIndex: "priority", key: "priority", width: 130,
      render: (t: string) => <PriorityMeter priority={t} />
    },
    {
      title: "Type", dataIndex: "type", key: "type", width: 120,
      render: (t: string) => t
        ? <span className="pp-vis-pill pp-vis-pill--ash">{t}</span>
        : <span className="sc-muted">—</span>
    },
    {
      title: "Modules", key: "modules", width: 90, align: 'center' as const,
      render: (_: any, r: any) => {
        const n = r.details?.modules?.length || 0;
        return <span className={`pp-count${n === 0 ? ' is-zero' : ''}`}>{n}</span>;
      }
    },
    {
      title: "Reviewer", key: "reviewer", width: 160,
      render: (_: any, r: any) => <PersonChip name={r.details?.reviewer} muted />
    },
    {
      title: "Timeline", key: "timeline", width: 170,
      render: (_: any, r: any) => <TimelineCell start={r.start_date} end={r.end_date} />
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: 'right' as const,
      fixed: 'right' as const,
      render: (_: any, r: any) => (
        <div className="sc-rowactions" onClick={(e) => e.stopPropagation()}>
          {canUpdateScope && (
            <Tooltip title="Edit">
              <button onClick={() => router.push(`/qa-workspace/test-scope/edit/${r.id}`)} aria-label="Edit"><Pencil size={15} /></button>
            </Tooltip>
          )}
          {canDeleteScope && (
            <ConfirmDialog
              tone="danger"
              title="Delete this test scope?"
              description={<>&ldquo;{r.name || 'Untitled scope'}&rdquo; will be permanently removed. This cannot be undone.</>}
              confirmText="Delete"
              onConfirm={() => handleDelete(r.id)}
            >
              <Tooltip title="Delete">
                <button className="is-danger" aria-label="Delete"><Trash2 size={15} /></button>
              </Tooltip>
            </ConfirmDialog>
          )}
          {!canUpdateScope && !canDeleteScope && <span className="sc-muted">—</span>}
        </div>
      )
    }
  ];

  const activeFilterCount =
    (statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0) + (ownerFilter ? 1 : 0) +
    (timelineFilter ? 1 : 0) + (searchTerm.trim() ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
    setOwnerFilter(undefined);
    setTimelineFilter(undefined);
  };

  const ownerOptions = Array.from(new Set(scopes.map(s => s.qa_owner).filter(Boolean)))
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map(v => ({ value: String(v), label: String(v) }));


  // Server-side pagination state already handles fetching
  const pageStart = totalScopes === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, totalScopes);
  const pageCount = Math.max(1, Math.ceil(totalScopes / pageSize));
  const safePage = Math.min(page, pageCount || 1);

  const statusFilterOpts = (
    scopeSettings.filter(s => s.category === 'status').map(s => ({ value: s.value, label: s.label }))
  );
  const statusOptions = statusFilterOpts.length > 0
    ? statusFilterOpts
    : ['Draft', 'In Review', 'Approved', 'Rejected', 'On Hold', 'Archived'].map(v => ({ value: v, label: v }));

  const priorityOptions = (() => {
    const fromSettings = scopeSettings.filter(s => s.category === 'priority').map(s => ({ value: s.value, label: s.label }));
    return fromSettings.length > 0
      ? fromSettings
      : ['Low', 'Medium', 'High', 'Critical'].map(v => ({ value: v, label: v }));
  })();

  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, bg: string) => (
    <div className="pp-menu-item" style={{ padding: 0 }}>
      <div className="pp-menu-ic" style={{ color, background: bg }}>{icon}</div>
      <div className="pp-menu-text">
        <div className="pp-menu-title" style={{ color }}>{title}</div>
        <div className="pp-menu-desc">{desc}</div>
      </div>
    </div>
  );

  const actionMenu = (r: any) => {
    return {
      className: 'pp-action-menu',
      items: [
        // Only the actions this role actually holds
        ...(canUpdateScope ? [
          { key: 'edit', label: menuLabel('Edit', 'Edit test scope', <Pencil size={15} />, '#64748b', 'rgba(100,116,139,0.12)'), onClick: () => router.push(`/qa-workspace/test-scope/edit/${r.id}`) },
        ] : []),
        ...(canUpdateScope && canDeleteScope ? [{ type: 'divider' as const }] : []),
        ...(canDeleteScope ? [{
          key: 'delete',
          danger: true,
          label: (
            <ConfirmDialog
              tone="danger"
              title="Delete Test Scope?"
              description="Are you sure you want to delete this test scope?"
              confirmText="Delete"
              onConfirm={() => handleDelete(r.id)}
            >
              {menuLabel('Delete', 'Remove from list', <Trash2 size={15} />, '#ef4444', 'rgba(239,68,68,0.12)')}
            </ConfirmDialog>
          )
        }] : []),
        ...(!canUpdateScope && !canDeleteScope ? [{
          key: 'none',
          disabled: true,
          label: menuLabel('View only', 'No edit access on this scope', <Pencil size={15} />, '#94a3b8', 'rgba(148,163,184,0.12)'),
        }] : []),
      ]
    };
  };

  const renderScopeCard = (r: any) => {
    const accent = accentFor(r.name || r.id);
    const color = STATUS_TONE[r.status || '']?.color || '#3b82f6';

    return (
      <div key={r.id} className="pc-card" onClick={() => router.push(`/qa-workspace/test-scope/${r.id}`)}>
        <div className="pc-top">
          <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
            {initialsOf(r.name)}
          </div>
          <div className="pc-identity-body">
            <div className="pc-title">{r.name}</div>
            <div className="pc-client-line">
              <span className="pc-client-key">Type:</span>
              <span className="pc-client-val">{r.type || 'N/A'}</span>
            </div>
          </div>
          <Dropdown
            menu={actionMenu(r)}
            overlayClassName="pp-action-pop"
            trigger={['click']}
            placement="bottomRight"
          >
            <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
              <EllipsisOutlined />
            </button>
          </Dropdown>
        </div>

        <div className="pc-foot">
          <div className="pc-foot-row">
            <span className="pc-foot-item">
              <span className="pc-foot-key">QA Owner:</span>
              <span className="pc-foot-val">{r.qa_owner || '—'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Reviewer:</span>
              <span className="pc-foot-val">{r.details?.reviewer || '—'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Start:</span>
              <span className="pc-foot-val">{r.start_date ? new Date(r.start_date).toLocaleDateString() : '—'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">End:</span>
              <span className="pc-foot-val">{r.end_date ? new Date(r.end_date).toLocaleDateString() : '—'}</span>
            </span>
          </div>
          <div className="pc-foot-row" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="pc-foot-item">
                <span className="pc-foot-key">Status:</span>
                <span className="pc-status-tag" style={{ color, background: `${color}1A` }}>
                  {r.status}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── Scope overview banner ────────────────────────────────────────────────
     Same three-row shape the Ticket List gives the active sprint, reading the
     scope pipeline instead: what is where, and how much of it is signed off. */
  const approvedPct = stats.totalScopes > 0 ? Math.round((stats.approved / stats.totalScopes) * 100) : 0;
  const bannerAccent = stats.overdueCount > 0 ? '#ef4444' : stats.inReview > 0 ? '#3b82f6' : '#10b981';
  const bannerScopeLabel = isMyScopes ? 'My Scopes' : isAllScopes ? 'All Scopes' : `${ownerFilter}'s Scopes`;

  const renderScopeBanner = () => (
    <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
      {/* Row 1: dot + title + tags + actions */}
      <div className="tl-sprint-row1">
        <div className="tl-sprint-title-block">
          <span
            className="tl-sprint-dot"
            style={{ background: bannerAccent, boxShadow: `0 0 0 3px ${bannerAccent}33` }}
          />
          <Text className="tl-sprint-title" ellipsis={{ tooltip: `${projectFilter} — ${bannerScopeLabel}` }}>
            {projectFilter} — {bannerScopeLabel}
          </Text>
          <span className="tl-sprint-tags">
            <span className="tl-sprint-tag tl-sprint-tag-active">{stats.totalScopes} SCOPES</span>
            {stats.overdueCount > 0 && (
              <span className="tl-sprint-tag tl-sprint-tag-delayed">{stats.overdueCount} OVERDUE</span>
            )}
          </span>
        </div>
        <div className="tl-sprint-actions">
          <Button
            type="default"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => router.push('/qa-workspace/test-scope/settings')}
            className="saas-button-item tl-sprint-burndown-btn"
          >
            Settings
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => router.push('/qa-workspace/approvals')}
            className="saas-button-item tl-sprint-complete-btn"
          >
            Approvals{stats.pendingApprovals ? ` (${stats.pendingApprovals})` : ''}
          </Button>
        </div>
      </div>

      {/* Row 2: where the scopes sit in the pipeline */}
      <div className="tl-sprint-row2">
        <span className="tl-sprint-meta">
          <CalendarOutlined style={{ fontSize: 11 }} />
          <span>{stats.routedForApproval || 0} routed for approval</span>
        </span>
        <span className="tl-sprint-meta">
          <b>{stats.approved || 0}</b>/{stats.totalScopes || 0} scopes approved
        </span>
        <span className="tl-sprint-meta">
          <b>{stats.inReview || 0}</b> in review
        </span>
        <span className="tl-sprint-meta">
          <b>{stats.inDraft || 0}</b> in draft
        </span>
      </div>

      {/* Row 3: wide approval progress bar + % */}
      <div className="tl-sprint-row3">
        <div className="tl-sprint-progress-bar">
          <div className="tl-sprint-progress-fill" style={{ width: `${Math.min(100, approvedPct)}%` }} />
        </div>
        <span className="tl-sprint-progress-pct">{approvedPct}%</span>
      </div>
    </div>
  );

  /** The shared NoData illustration, carrying this list's own words. */
  const renderEmpty = () => (
    <NoData
      description={
        <div className="sc-empty">
          <SnippetsOutlined className="sc-empty__icon" />
          <p className="sc-empty__title">{activeFilterCount > 0 ? 'No scopes match these filters' : 'No test scopes yet'}</p>
          <p className="sc-empty__desc">
            {activeFilterCount > 0
              ? 'Try widening your search or clearing the filters.'
              : 'Create your first scope to define what gets tested and when it\'s done.'}
          </p>
          {activeFilterCount > 0
            ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
            : canCreateScope && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => router.push('/qa-workspace/test-scope/create')}>Create Scope</Button>}
        </div>
      }
    />
  );

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: SCOPE_PAGE_STYLES }} />

      <div className="tl-shell-wrap">
        <div className="tl-shell">
          <div className="tl-main">

            {/* ── Header row — project, search, filters, view controls ───── */}
            <div className="saas-header-container sc-header">
              <QaProjectSwitcher
                projects={userProjects}
                value={selectedProjectId}
                onChange={chooseProject}
                loading={loadingProjects}
              />

              <Divider type="vertical" style={{ height: 24, margin: 0, opacity: 0.5 }} />

              <div className="sc-header-controls">
                <Input
                  placeholder="Quick search scopes..."
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
                      <TestScopeFilters
                        filters={{ statusFilter, priorityFilter, ownerFilter, timelineFilter }}
                        onFilterChange={(key, val) => {
                          if (key === 'statusFilter') setStatusFilter(val || undefined);
                          if (key === 'priorityFilter') setPriorityFilter(val || undefined);
                          if (key === 'ownerFilter') setOwnerFilter(val || undefined);
                          if (key === 'timelineFilter') setTimelineFilter(val || undefined);
                        }}
                        onReset={clearFilters}
                        statusOptions={statusOptions}
                        priorityOptions={priorityOptions}
                        ownerOptions={ownerOptions}
                        timelineOptions={TIMELINE_FILTERS}
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
                  value={isMyScopes ? 'mine' : isAllScopes ? 'all' : 'other'}
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
                          <span className="sc-owner-opt__label">My Scopes</span>
                          <span className="sc-owner-opt__count">{ownerCounts.mine}</span>
                        </span>
                      ),
                    },
                    {
                      value: 'all',
                      label: (
                        <span className="sc-owner-opt">
                          <Users size={13} />
                          <span className="sc-owner-opt__label">All Scopes</span>
                          <span className="sc-owner-opt__count">{ownerCounts.all}</span>
                        </span>
                      ),
                    },
                    /* A QA owner picked from the filter panel is neither "mine"
                       nor "all" — surfaced here so the switch never lies. */
                    ...(!isMyScopes && !isAllScopes
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
                    onClick={handleRefresh}
                    disabled={loading || !projectFilter}
                    style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </Tooltip>

                {canCreateScope && projectFilter && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push('/qa-workspace/test-scope/create')}
                    style={{ height: 36, borderRadius: 8, fontWeight: 700 }}
                    data-tour="test-scope"
                  >
                    Create Scope
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
                    icon={<CheckCircleOutlined style={{ fontSize: 11 }} />}
                    label="Status"
                    value={statusFilter || ""}
                    options={statusOptions}
                    onChange={(val) => setStatusFilter(val || undefined)}
                    itemNoun="statuses"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<ThunderboltOutlined style={{ fontSize: 11 }} />}
                    label="Priority"
                    value={priorityFilter || ""}
                    options={priorityOptions}
                    onChange={(val) => setPriorityFilter(val || undefined)}
                    itemNoun="priorities"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<UserOutlined style={{ fontSize: 11 }} />}
                    label="QA Owner"
                    value={ownerFilter || ""}
                    options={ownerOptions}
                    onChange={(val) => setOwnerFilter(val || undefined)}
                    itemNoun="owners"
                    multiple={false}
                    showAvatar
                  />
                  <TicketFilterPill
                    icon={<CalendarOutlined style={{ fontSize: 11 }} />}
                    label="Timeline"
                    value={timelineFilter || ""}
                    options={TIMELINE_FILTERS}
                    onChange={(val) => setTimelineFilter(val || undefined)}
                    itemNoun="ranges"
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
              /* Until the project is known there are no scopes, stats or
                 filters worth showing — the picker takes the whole area. */
              <div className="sc-pickerwrap">
                {!projectReady ? (
                  /* Reading the remembered project — showing the picker first
                     would flash it away a frame later. */
                  <ZukvoLoader size="md" message="Loading projects…" />
                ) : (
                  <QaProjectPicker
                    projects={userProjects}
                    loading={loadingProjects}
                    onChoose={chooseProject}
                    subtitle="A test scope plans the testing of one project. Pick one to open its scopes."
                  />
                )}
              </div>
            ) : (
              <div className="tl-section">
                {renderScopeBanner()}

                <div className="tl-section-body">
                  {/* Only the results blur, so the filters above stay usable
                      while a search refetches. */}
                  <ZukvoLoadingOverlay loading={loading} message="Loading test scopes…">
                    {viewMode === 'list' ? (
                      <div className="pp-table-wrap">
                        <Table
                          className="saas-table tl-table pp-table"
                          dataSource={scopes}
                          columns={columns}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          scroll={{ x: 'max-content' }}
                          expandable={{
                            expandedRowRender: renderLinkedRow,
                            rowExpandable: () => true,
                            // The row itself navigates to the scope, so the chevron
                            // has to swallow its click or expanding would leave the page.
                            expandIcon: ({ expanded, onExpand, record }) => (
                              <button
                                type="button"
                                className={`sc-expand${expanded ? ' is-open' : ''}`}
                                aria-label={expanded ? 'Hide linked items' : 'Show linked items'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExpand(record, e);
                                }}
                              >
                                <RightOutlined />
                              </button>
                            ),
                          }}
                          locale={{
                            /* Holding the height beats claiming "no scopes" mid-fetch. */
                            emptyText: loading ? <div style={{ minHeight: 240 }} /> : renderEmpty()
                          }}
                          onRow={(record) => ({
                            className: 'pp-row',
                            onClick: (e) => {
                              const t = e.target as HTMLElement;
                              if (t.closest('button, a, .ant-dropdown-trigger, .sc-expand, .sc-rowactions, .pp-scope-id')) return;
                              router.push(`/qa-workspace/test-scope/${record.id}`);
                            }
                          })}
                        />
                      </div>
                    ) : (
                      <div className="sc-gridwrap">
                        <div className="pp-grid">
                          {loading ? null : scopes.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1' }}>{renderEmpty()}</div>
                          ) : (
                            scopes.map(r => renderScopeCard(r))
                          )}
                        </div>
                      </div>
                    )}
                  </ZukvoLoadingOverlay>

                  {/* Pager sits outside the scroll area, so it stays pinned to
                      the bottom of the pane whether or not the list overflows. */}
                  {scopes.length > 0 && (
                    <div className="pp-footer">
                      <div className="pp-footer-info">
                        Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{totalScopes}</strong>
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
    </MainLayout>
  );
}

export default function TestScopePage() {
  return (
    <Suspense fallback={<ZukvoLoader size="lg" fullscreen message="Loading test scopes…" />}>
      <TestScopeContent />
    </Suspense>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Styles — the Ticket List's shell, header, sprint banner, table and pager,
   with the scope-specific cells layered on top.
   ──────────────────────────────────────────────────────────────────────── */
const SCOPE_PAGE_STYLES = `
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
`;
