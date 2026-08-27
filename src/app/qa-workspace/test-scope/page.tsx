"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Tooltip, Result, Table, Typography, message, Modal, Input, Select, Dropdown } from "antd";
import { BugOutlined, InboxOutlined, PlusOutlined, SnippetsOutlined, FileTextOutlined, SendOutlined, CheckCircleOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, EllipsisOutlined, RightOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Menu, User, Users, Folder, FolderOpen, ChevronDown, Link2, Monitor, AlertCircle, CheckCircle, Pencil, Trash2, PlayCircle, Boxes, ClipboardList, ExternalLink, RotateCw } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios, apiClient } from "@/lib/axios";
import TiptapViewer from "@/components/common/TiptapViewer";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader, { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import dayjs from "dayjs";
import { ProjectService } from "@/services/projectService";

const { Text, Paragraph } = Typography;

/** How many projects the sidebar shows before "Show more". */
const PROJECTS_PREVIEW = 3;

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

/* Stat tile */
const StatTile = ({ label, value, icon: Icon, color, bgColor, sub }: { label: string; value: string | number; icon: any; color: string; bgColor: string; sub?: string; }) => (
  <div className="pp-stat-card">
    <div className="pp-stat-top">
      <div className="pp-stat-left">
        <span className="pp-stat-icon" style={{ background: bgColor, color }}>
          <Icon size={14} />
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

/* ── Scope list primitives ─────────────────────────────────────────────────── */

const STATUS_TONE: Record<string, string> = {
  Approved: 'green',
  Rejected: 'red',
  'In Review': 'blue',
  Draft: 'ash',
};

/** Status as a dotted pill — reads faster than a solid tag in a dense table. */
const StatusPill = ({ status }: { status?: string }) => {
  const tone = STATUS_TONE[status || ''] || 'blue';
  return (
    <span className={`sc-pill sc-pill--${tone}`}>
      <span className="sc-pill__dot" />
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

/** Initials avatar + name; falls back to a dash when unassigned. */
const PersonChip = ({ name, muted }: { name?: string; muted?: boolean }) => {
  if (!name) return <span className="sc-muted">—</span>;
  return (
    <span className="sc-person">
      <span className={`sc-person__av${muted ? ' is-muted' : ''}`}>{initialsOf(name)}</span>
      <span className="sc-person__name">{name}</span>
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

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [scopes, setScopes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  const [projectFilter, setProjectFilter] = useState<string | undefined>();
  const [sortKey] = useState<string>('recent');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sprintsMap, setSprintsMap] = useState<Record<string, string>>({});
  const [previewFile, setPreviewFile] = useState<any>(null);
  // User's accessible projects — drives both dropdown options and visibility restriction
  const [userProjects, setUserProjects] = useState<{ value: string; label: string }[]>([]);
  const [showAllProjects, setShowAllProjects] = useState(false);
  /** Total scopes owned by the signed-in user, for the "My Scopes" badge. */
  const [myScopesCount, setMyScopesCount] = useState<number | null>(null);

  const { canReadScope, canCreateScope, canUpdateScope, canDeleteScope } = usePermission();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Pre-fill the QA Owner filter with the current user's name once auth loads
  useEffect(() => {
    if (!isLoading && user?.name) {
      setOwnerFilter(user.name);
    }
  }, [isLoading, user?.name]);

  // Any filter change resets to the first page
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, ownerFilter, timelineFilter, projectFilter]);

  const fetchStats = async () => {
    try {
      // api.get() auto-unwraps: returns response.data.data directly
      // So `res` is already { totalScopes, approved, inReview, ... }
      const res: any = await axios.get("/api/v2/qa/test-scopes/stats");
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
    if (!isLoading && canReadScope) {
      fetchScopes();
    }
  }, [isLoading, canReadScope, page, pageSize, debouncedSearch, statusFilter, priorityFilter, ownerFilter, projectFilter, userProjects, sortKey]);


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
   * The list endpoint is the only place that knows how many scopes a given QA
   * owner has, so the sidebar badge asks for a single row and reads the total.
   */
  const fetchMyScopesCount = async () => {
    if (!user?.name) return;
    try {
      const res: any = await apiClient.get("/api/v2/qa/test-scopes", {
        params: {
          page: 1,
          pageSize: 1,
          qa_owner: user.name,
          ...(userProjects.length > 0 ? { allowed_products: userProjects.map(p => p.label).join(',') } : {}),
        }
      });
      setMyScopesCount(res?.data?.pagination?.total ?? 0);
    } catch (err) {
      console.error('fetchMyScopesCount error:', err);
    }
  };

  useEffect(() => {
    if (!isLoading && canReadScope) fetchMyScopesCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, canReadScope, user?.name, userProjects]);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        fetchScopes(),
        fetchStats(),
        fetchScopeSettings(),
        fetchMyScopesCount()
      ]);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  // ── Initialisation effect: runs once auth is ready ────────────────────────
  useEffect(() => {
    if (!isLoading && canReadScope) {
      fetchScopeSettings();
      fetchStats();
      // Fetch user's accessible projects for the visibility restriction + dropdown
      ProjectService.getUserProjects(true)
        .then((projects: any) => {
          const list = Array.isArray(projects) ? projects : (projects?.data ?? []);
          setUserProjects(
            list.map((p: any) => ({ value: String(p.label ?? p.name ?? ''), label: String(p.label ?? p.name ?? '') }))
                .filter((p: any) => p.value)
          );
        })
        .catch(console.error);
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

  /**
   * Only the first few projects are listed; a selected project that falls
   * outside that window is appended so the active item is never hidden.
   */
  const visibleProjects = useMemo(() => {
    if (showAllProjects) return userProjects;
    const head = userProjects.slice(0, PROJECTS_PREVIEW);
    if (projectFilter && !head.some(p => p.value === projectFilter)) {
      const selected = userProjects.find(p => p.value === projectFilter);
      if (selected) return [...head, selected];
    }
    return head;
  }, [userProjects, showAllProjects, projectFilter]);

  const hiddenProjectCount = Math.max(0, userProjects.length - PROJECTS_PREVIEW);

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
  const linkedNames = (v: any): string[] => {
    if (Array.isArray(v)) return v.map((i: any) => i?.name).filter(Boolean);
    return v?.name ? [v.name] : [];
  };

  /**
   * The expanded child row — Runs, Suite and Cases side by side.
   *
   * Each chip is a real link to the record it names, opened in a new tab: the
   * row is a reference while you are scanning the scope list, so following one
   * shouldn't cost you your place. Entries with no id stay as plain text rather
   * than rendering a link that goes nowhere.
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

  const columns = [
    {
      title: "Test Scope",
      dataIndex: "name",
      key: "name",
      width: 340,
      render: (t: string, r: any) => {
        const meta = [r.type, r.details?.product, r.details?.modules?.length ? `${r.details.modules.length} modules` : null]
          .filter(Boolean).join(' · ');
        return (
          <div className="sc-name">
            <span className="sc-name__badge">{initialsOf(t || '')}</span>
            <span className="sc-name__text">
              <span className="sc-name__title">{t || 'Untitled scope'}</span>
              {meta ? <span className="sc-name__meta">{meta}</span> : null}
            </span>
          </div>
        );
      }
    },
    {
      title: "Status", dataIndex: "status", key: "status", width: 130,
      render: (t: string) => <StatusPill status={t} />
    },
    {
      title: "Priority", dataIndex: "priority", key: "priority", width: 120,
      render: (t: string) => <PriorityMeter priority={t} />
    },
    {
      title: "QA Owner", dataIndex: "qa_owner", key: "qa_owner", width: 170,
      render: (t: string) => <PersonChip name={t} />
    },
    {
      title: "Reviewer", key: "reviewer", width: 170,
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
    (timelineFilter ? 1 : 0) + (projectFilter ? 1 : 0) + (searchTerm.trim() ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setPriorityFilter(undefined);
    setOwnerFilter(user?.name || undefined);
    setTimelineFilter(undefined);
    setProjectFilter(undefined);
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
    const s = scopeSettings.find(set => set.category === 'status' && set.value === r.status);
    const color = s?.color && s.color !== 'default' ? s.color : (r.status === 'Approved' ? '#10b981' : r.status === 'Rejected' ? '#ef4444' : r.status === 'In Review' ? '#f59e0b' : r.status === 'Draft' ? '#64748b' : '#3b82f6');

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

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{
        __html: `
        .pp-detail-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
        }
        .pp-card-header {
          background: var(--bg-slate-50);
          padding: 12px 16px;
          font-weight: 600;
          font-size: 14px;
          color: var(--text-slate-800);
          border-bottom: 1px solid var(--border-slate-200);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pp-card-body {
          padding: 16px;
        }
        .ro-label {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-400);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }
        .ro-value {
          font-size: 13px;
          color: var(--text-slate-700);
        }
        
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
        .pp-side-cta {
          margin-top: 12px; height: 34px !important; border-radius: 8px !important;
          font-size: 12.5px; font-weight: 600;
        }

        .dh-sidebar-scroll { flex: 1; overflow-y: auto; padding: 12px 8px 16px; }
        .pp-nav-caption {
          display: block; padding: 0 8px; margin: 0 0 6px;
          font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
          color: var(--text-slate-400);
        }
        .pp-nav-caption + .pp-nav-item { margin-top: 0; }
        .pp-nav-item ~ .pp-nav-caption { margin-top: 16px; }

        .pp-nav-item {
          position: relative;
          display: flex; align-items: center; gap: 9px; width: 100%; height: 33px; padding: 0 9px;
          border-radius: 7px; border: none; background: transparent; color: var(--text-slate-600);
          font-size: 12.5px; font-weight: 500; cursor: pointer; text-align: left;
          transition: background .15s ease, color .15s ease;
          margin-bottom: 2px;
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
        .pp-nav-item.is-active .pp-nav-count {
          background: rgba(59,130,246,.14); color: #2563eb; border-color: transparent;
        }
        /* Left rail marker on the active item */
        .pp-nav-item.is-active::before {
          content: ''; position: absolute; left: -8px; top: 7px; bottom: 7px;
          width: 3px; border-radius: 0 3px 3px 0; background: #3B82F6;
        }
        .pp-nav-item:disabled { opacity: .45; cursor: not-allowed; }
        .pp-nav-item:disabled:hover { background: transparent; color: var(--text-slate-600); }

        /* "Show N more" toggle under the project list */
        .pp-nav-more {
          display: flex; align-items: center; gap: 6px; width: 100%; height: 28px; padding: 0 9px;
          margin-top: 2px; border: none; background: transparent; border-radius: 7px;
          color: var(--text-slate-500); font-size: 11.5px; font-weight: 600; cursor: pointer; text-align: left;
          transition: background .15s ease, color .15s ease;
        }
        .pp-nav-more:hover { background: var(--bg-slate-50); color: #3B82F6; }
        .pp-nav-more-icon { transition: transform .18s ease; }
        .pp-nav-more.is-open .pp-nav-more-icon { transform: rotate(180deg); }

        .pp-nav-empty {
          display: block; padding: 4px 9px 2px; font-size: 11.5px; color: var(--text-slate-400);
        }
        
        .dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
        .dh-main-topbar { height: 56px; border-bottom: 1px solid var(--border-slate-200); background: transparent; display: flex; align-items: center; padding: 0 18px; justify-content: space-between; }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; background: transparent; }
        
        /* Table Styles for Test Scope */
        .ts-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase !important; color: var(--text-slate-500) !important;
          white-space: nowrap !important;
        }
        .ts-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .ts-table .ant-table-tbody > tr:hover > td {
          background: rgba(255, 255, 255, 0.05) !important;
        }

        /* ── All Scopes: compact page chrome ────────────────────────── */
        .sc-topbar { height: auto !important; min-height: 52px; padding: 8px 20px !important; }
        /* Every control in the topbar shares one 32px height */
        .sc-topbar .dh-main-controls { display: flex; align-items: center; gap: 8px; }
        .sc-topbar .dh-main-controls .ant-btn { height: 32px !important; border-radius: 8px; }
        .sc-topbar .pp-segmented { height: 32px; display: inline-flex; align-items: center; border-radius: 8px; overflow: hidden; }
        .sc-topbar .pp-segmented button {
          height: 32px; width: 34px; display: inline-flex; align-items: center; justify-content: center;
        }
        .sc-topbar__title { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .sc-topbar__h1 { font-size: 15px; font-weight: 700; color: var(--text-slate-900); white-space: nowrap; }
        .sc-topbar__div { width: 1px; height: 14px; background: var(--border-slate-200); flex-shrink: 0; }
        .sc-topbar__sub {
          font-size: 12px; color: var(--text-slate-500);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        @media (max-width: 860px) { .sc-topbar__div, .sc-topbar__sub { display: none; } }

        /* ── All Scopes: stat tiles (shared StatTile, click to filter) ── */
        .sc-stat-hit { cursor: pointer; outline: none; }
        .sc-stat-hit .pp-stat-card { transition: border-color .15s ease, background .15s ease; }
        .sc-stat-hit:hover .pp-stat-card { border-color: #bfdbfe; background: var(--bg-slate-50); }
        .sc-stat-hit.is-active .pp-stat-card { border-color: #3b82f6; box-shadow: inset 0 -2px 0 #3b82f6; }
        .sc-stat-hit:focus-visible .pp-stat-card { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }

        /* ── All Scopes: filter row — every control on one 32px axis ─── */
        .sc-filters {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;
        }
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
          border: 1px solid var(--border-slate-200); transition: all .15s ease;
        }
        .sc-clear:hover { background: var(--bg-blue-50); border-color: #bfdbfe; }

        /* ── All Scopes: pager pinned to the bottom of the pane ─────── */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap; gap: 10px;
          padding: 0 20px; border-top: 1px solid var(--border-slate-200);
          height: 52px; min-height: 52px; box-sizing: border-box; flex-shrink: 0;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
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

        /* ── All Scopes: table ──────────────────────────────────────── */
        /* ── Expanded linked-items row ─────────────────────────────── */
        .sc-expand {
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; border-radius: 6px; cursor: pointer;
          border: 1px solid var(--border-slate-200); background: transparent;
          color: var(--text-slate-400); font-size: 10px;
          transition: transform .15s ease, color .15s ease, border-color .15s ease;
        }
        .sc-expand:hover { color: #2563eb; border-color: #bfdbfe; }
        .sc-expand.is-open { transform: rotate(90deg); color: #2563eb; border-color: #bfdbfe; }
        .sc-linked {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px; padding: 4px 2px 6px; cursor: default;
        }
        @media (max-width: 900px) { .sc-linked { grid-template-columns: 1fr; } }
        .sc-linked__col {
          min-width: 0; padding: 10px 12px;
          border: 1px solid var(--border-slate-100); background: var(--bg-slate-50);
        }
        .sc-linked__head { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; color: var(--text-slate-400); }
        .sc-linked__label {
          font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
        }
        .sc-linked__count {
          margin-left: auto; min-width: 18px; padding: 0 6px; border-radius: 999px;
          font-size: 10.5px; font-weight: 700; text-align: center; line-height: 17px;
          background: var(--bg-pure-white); color: var(--text-slate-500);
          border: 1px solid var(--border-slate-200);
        }
        .sc-linked__items { display: flex; flex-wrap: wrap; gap: 5px; }
        .sc-linked__chip {
          display: inline-flex; align-items: center; gap: 5px; max-width: 100%;
          padding: 3px 9px; border-radius: 999px;
          font-size: 11.5px; font-weight: 500; color: var(--text-slate-700);
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          transition: all .15s ease;
        }
        .sc-linked__chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sc-linked__chip-ext { flex-shrink: 0; opacity: 0; transition: opacity .15s ease; }
        .sc-linked__chip.is-link { cursor: pointer; text-decoration: none; }
        .sc-linked__chip.is-link:hover {
          color: #2563eb; border-color: #bfdbfe; background: rgba(59,130,246,.07);
        }
        .sc-linked__chip.is-link:hover .sc-linked__chip-ext { opacity: 1; }
        .sc-linked__chip.is-link:focus-visible {
          outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16);
        }
        .sc-linked__none { font-size: 11.5px; color: var(--text-slate-300); }
        .sc-linked__empty { padding: 10px 2px; font-size: 12.5px; color: var(--text-slate-400); }

        .sc-tablewrap {
          background: transparent; border: 1px solid var(--border-slate-200);
          border-radius: 0; overflow: hidden;
        }
        .sc-table .ant-table { background: transparent; }
        .sc-table, .sc-table.ant-table-wrapper, .sc-table .ant-table, .sc-table .ant-table-container, .sc-table .ant-table-content, .sc-table .ant-table-header, .sc-table .ant-table-body { border-radius: 0 !important; }
        .sc-table .ant-table-thead > tr > th, .sc-table .ant-table-thead > tr > td { border-radius: 0 !important; border-start-start-radius: 0 !important; border-start-end-radius: 0 !important; }
        .sc-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          letter-spacing: .06em !important; padding: 8px 14px !important;
        }
        .sc-table .ant-table-tbody > tr > td { padding: 8px 14px !important; }
        .sc-table .ant-table-tbody > tr { cursor: pointer; }
        .sc-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        .sc-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .sc-table .ant-table-cell-fix-right { background: inherit !important; }
        .sc-table .ant-pagination { padding: 12px 16px; margin: 0 !important; border-top: 1px solid var(--border-slate-100); }

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

        .sc-prio { display: inline-flex; align-items: center; gap: 8px; }
        .sc-prio__bars { display: inline-flex; align-items: flex-end; gap: 2px; }
        .sc-prio__bar { width: 4px; height: 12px; border-radius: 2px; background: var(--border-slate-200); }
        .sc-prio__bar.is-on { background: #60a5fa; }
        .sc-prio__bar.is-on.is-max { background: #2563eb; }
        .sc-prio__label { font-size: 12px; font-weight: 500; color: var(--text-slate-600); }

        .sc-person { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
        .sc-person__av {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 24px; height: 24px; border-radius: 999px;
          background: rgba(59,130,246,.12); color: #2563eb; font-size: 9.5px; font-weight: 700;
        }
        .sc-person__av.is-muted { background: rgba(100,116,139,.12); color: #64748b; }
        .sc-person__name {
          font-size: 12.5px; color: var(--text-slate-700);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;
        }

        .sc-timeline { display: flex; flex-direction: column; line-height: 1.35; }
        .sc-timeline__range { font-size: 12.5px; color: var(--text-slate-700); font-variant-numeric: tabular-nums; white-space: nowrap; }
        .sc-timeline__hint { font-size: 10.5px; color: var(--text-slate-400); }
        .sc-timeline__hint.is-late { color: #dc2626; font-weight: 600; }

        /* Always visible so the column never looks empty; no fixed column,
           which was rendering a stray divider over the last data column. */
        .sc-rowactions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
        .sc-rowactions button {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 7px;
          border: 1px solid transparent; color: var(--text-slate-400);
          transition: all .15s ease;
        }
        .sc-rowactions button:hover { color: #2563eb; background: var(--bg-blue-50); border-color: #bfdbfe; }
        .sc-rowactions button.is-danger:hover { color: #dc2626; background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.25); }
        .sc-table .ant-table-tbody > tr > td:last-child { padding-right: 12px !important; }

        .sc-empty { padding: 44px 24px; text-align: center; }
        .sc-empty__icon { font-size: 26px; color: var(--border-slate-200); }
        .sc-empty__title { margin: 12px 0 4px; font-size: 14px; font-weight: 600; color: var(--text-slate-700); }
        .sc-empty__desc { margin: 0 auto 14px; max-width: 340px; font-size: 12.5px; color: var(--text-slate-400); }

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
              <div className="pp-side-head-text">
                <h1 className="pp-side-title">Scope</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateScope && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/qa-workspace/test-scope/create')}
                block
                className="pp-side-cta"
              >
                Create Scope
              </Button>
            )}
          </div>

          <div className="dh-sidebar-scroll">
            <span className="pp-nav-caption">QA Owner</span>
            <button
              className={`pp-nav-item ${isMyScopes ? 'is-active' : ''}`}
              onClick={() => { setOwnerFilter(user?.name); setMobileSidebarOpen(false); }}
              disabled={!user?.name}
            >
              <User size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">My Scopes</span>
              {myScopesCount !== null ? <span className="pp-nav-count">{myScopesCount}</span> : null}
            </button>
            <button
              className={`pp-nav-item ${isAllScopes ? 'is-active' : ''}`}
              onClick={() => { setOwnerFilter(undefined); setMobileSidebarOpen(false); }}
            >
              <Users size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">All Scopes</span>
              <span className="pp-nav-count">{stats.totalScopes}</span>
            </button>

            <span className="pp-nav-caption">Projects</span>
            <button
              className={`pp-nav-item ${!projectFilter ? 'is-active' : ''}`}
              onClick={() => { setProjectFilter(undefined); setMobileSidebarOpen(false); }}
            >
              <Boxes size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">All Projects</span>
              {userProjects.length > 0 ? <span className="pp-nav-count">{userProjects.length}</span> : null}
            </button>
            {visibleProjects.map(pj => (
              <button
                key={pj.value}
                className={`pp-nav-item ${projectFilter === pj.value ? 'is-active' : ''}`}
                onClick={() => { setProjectFilter(pj.value); setMobileSidebarOpen(false); }}
                title={pj.label}
              >
                {projectFilter === pj.value
                  ? <FolderOpen size={15} className="pp-nav-icon" />
                  : <Folder size={15} className="pp-nav-icon" />}
                <span className="pp-nav-label">{pj.label}</span>
              </button>
            ))}
            {userProjects.length === 0 && (
              <span className="pp-nav-empty">No projects assigned</span>
            )}
            {hiddenProjectCount > 0 && (
              <button
                type="button"
                className={`pp-nav-more ${showAllProjects ? 'is-open' : ''}`}
                onClick={() => setShowAllProjects(v => !v)}
              >
                <ChevronDown size={13} className="pp-nav-more-icon" />
                {showAllProjects ? 'Show less' : `Show ${hiddenProjectCount} more`}
              </button>
            )}
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
              <span className="sc-topbar__h1">{isMyScopes ? 'My Scopes' : isAllScopes ? 'All Scopes' : `${ownerFilter}'s Scopes`}</span>
              <span className="sc-topbar__div" />
              <span className="sc-topbar__sub">{projectFilter || 'All projects'}</span>
            </div>

            <div className="dh-main-controls">
              <Button
                type="default"
                icon={<RotateCw size={14} className={loading ? "animate-spin" : ""} />}
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0 }}
              />
              <div className="pp-segmented">
                <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => setViewMode('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')} aria-label="List view"><UnorderedListOutlined /></button>
              </div>
              {canCreateScope && (
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => router.push('/qa-workspace/test-scope/create')}>
                  New Scope
                </Button>
              )}
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Stats — product-standard StatTile, clickable to filter by status */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {[
                { key: undefined, label: "Total Scopes", value: stats.totalScopes, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: SnippetsOutlined, sub: `${stats.routedForApproval} routed for approval` },
                { key: 'Draft', label: "In Draft", value: stats.inDraft, color: "#64748b", bg: "rgba(100,116,139,0.1)", icon: FileTextOutlined, sub: `${stats.draftNoDueDate} without a due date` },
                { key: 'In Review', label: "In Review", value: stats.inReview, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: SendOutlined, sub: `${stats.overdueCount} past due date` },
                { key: 'Approved', label: "Approved", value: stats.approved, color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: CheckCircleOutlined, sub: `${stats.totalScopes ? Math.round((stats.approved / stats.totalScopes) * 100) : 0}% of all scopes` }
              ].map((stat) => {
                return (
                  <div key={stat.label}>
                    <StatTile label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} bgColor={stat.bg} sub={stat.sub} />
                  </div>
                );
              })}
            </div>

            {/* Filter bar — one row, uniform control heights */}
            <div className="sc-filters">
              <Input
                className="sc-filters__search"
                placeholder="Search scopes…"
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
              <SearchableDropdown
                options={statusOptions}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                placeholder="All statuses"
                itemNoun="statuses"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={priorityOptions}
                value={priorityFilter}
                onChange={(v) => setPriorityFilter(v)}
                placeholder="All priorities"
                itemNoun="priorities"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={ownerOptions}
                value={ownerFilter}
                onChange={(v) => setOwnerFilter(v)}
                placeholder="All QA owners"
                itemNoun="owners"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={TIMELINE_FILTERS}
                value={timelineFilter}
                onChange={(v) => setTimelineFilter(v)}
                placeholder="Any timeline"
                hideAvatar
                itemNoun="ranges"
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
            <ZukvoLoadingOverlay loading={loading} message="Loading test scopes…" minHeight={loading ? 320 : undefined}>
              {viewMode === 'list' ? (
                <div className="sc-tablewrap">
                  <Table
                    className="ts-table sc-table"
                    dataSource={scopes}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
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
                      emptyText: loading ? (
                        <div style={{ minHeight: 240 }} />
                      ) : (
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
                      )
                    }}
                    onRow={(record) => ({
                      onClick: () => router.push(`/qa-workspace/test-scope/${record.id}`)
                    })}
                  />
                </div>
              ) : (
                <div className="pp-grid">
                  {loading ? null : scopes.length === 0 ? (
                    <div className="sc-empty" style={{ gridColumn: '1 / -1' }}>
                      <SnippetsOutlined className="sc-empty__icon" />
                      <p className="sc-empty__title">{activeFilterCount > 0 ? 'No scopes match these filters' : 'No test scopes yet'}</p>
                      <p className="sc-empty__desc">
                        {activeFilterCount > 0 ? 'Try widening your search or clearing the filters.' : 'Create your first scope to get started.'}
                      </p>
                      {activeFilterCount > 0
                        ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
                        : canCreateScope && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => router.push('/qa-workspace/test-scope/create')}>Create Scope</Button>}
                    </div>
                  ) : (
                    scopes.map(r => renderScopeCard(r))
                  )}
                </div>
              )}
            </ZukvoLoadingOverlay>
          </div>

          {/* Pager sits outside the scroll area, so it stays pinned to the
              bottom of the pane whether or not the list overflows. */}
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
        </main>
      </div>


      <Modal
        open={!!previewFile}
        footer={null}
        onCancel={() => setPreviewFile(null)}
        title={previewFile?.name}
        width={800}
        styles={{ body: { padding: 0 } }}
      >
        {previewFile?.url || previewFile?.thumbUrl ? (
          previewFile?.name?.toLowerCase().endsWith('.pdf') ? (
            <iframe src={previewFile.url || previewFile.thumbUrl} style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }} />
          ) : (
            <div style={{ padding: 20, background: 'var(--bg-slate-50)', display: 'flex', justifyContent: 'center' }}>
              <img src={previewFile.url || previewFile.thumbUrl} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} alt="preview" />
            </div>
          )
        ) : (
          previewFile?.name?.toLowerCase().endsWith('.pdf') ? (
            <iframe src="data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjwwCiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+Cj4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKPDwKICAvTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAo3MCA1MCBUZAovRjEgMTIgVGYKKER1bW15IFBERiBQcmV2aWV3KSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTU3IDAwMDAwIG4gCjAwMDAwMDAyNTMgMDAwMDAgbiAKMDAwMDAwMDMzNiAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MzEKJSVFT0YK" style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }} />
          ) : (
            <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-slate-50)', color: 'var(--text-slate-500)' }}>
              <InboxOutlined style={{ fontSize: 48, marginBottom: 16, color: 'var(--text-slate-300)' }} />
              <p style={{ margin: 0, fontSize: 16 }}>Image not available</p>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>This file does not have a saved image URL.</p>
            </div>
          )
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .pp-stat-card {
          background: transparent; border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 10px 12px; min-height: 84px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 8px;
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        
        /* Grid and Segments */
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

        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 18px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; }

      `}} />
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
