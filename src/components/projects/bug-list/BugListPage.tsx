"use client";
import dayjs from "dayjs";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Popconfirm,
  Select,
  Tooltip,
  DatePicker,
  Segmented,
  Dropdown,
  App,
  Drawer,
} from "antd";
import SearchableDropdown from "@/components/common/SearchableDropdown";

const { RangePicker } = DatePicker;
import {
  Search,
  Plus,
  Sparkles,
  Trash2,
  Ban,
  SlidersHorizontal,
  X,
  RotateCcw,
  FolderTree,
  Bug as BugIcon,
  Ticket as TicketIcon,
  Activity,
  Archive,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Folder,
  Layers,
  CircleDot,
  AlertTriangle,
  Tag,
  Box,
  Calendar,
  CalendarDays,
  ChevronDown,
  Briefcase,
  List,
  Menu,
} from "lucide-react";
import { useAllProjects } from "@/hooks/useGlobalData";
import HivebugSidebar, { BugScope } from "./HivebugSidebar";
import HivebugTable from "./HivebugTable";
import ArchiveView from "./ArchiveView";
import TrashView from "./TrashView";
import CreateBugDrawer from "./CreateBugDrawer";
import { FolderModal, SheetModal } from "./FolderSheetModals";
import AiReviewModal from "./AiReviewModal";
import BulkTicketModal from "./BulkTicketModal";
import BugCalendarView from "./BugCalendarView";
import {
  useBugFolders,
  useBugSheets,
  useBugs,
  useBugStats,
  useBulkDeleteBugs,
  useBulkPermanentDeleteBugs,
  useBulkRestoreBugs,
  useBulkUpdateBugStatus,
  useCreateBug,
  useDeleteBug,
  usePermanentDeleteBug,
  useRestoreBug,
  useReopenBug,
  useUpdateBug,
  useVerifyBug,
  useArchivedSheets,
  useTrashedSheets,
  useArchivedFolders,
  useTrashedFolders,
  useProjectSheets,
  useBulkMoveBugs,
} from "@/hooks/useBugList";
import { useMembersSelect } from "@/hooks/useMembersSelect";
import type {
  BugFolder,
  BugListItem,
  BugSeverity,
  BugSheet,
  BugStatus,
  BugType,
  CreateBugInput,
  UpdateBugInput,
} from "@/services/bugListService";
import { useTheme } from "@/context/ThemeContext";
import { usePermission } from "@/hooks/usePermission";
import { hivebugStyles } from "./hivebug-styles";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const SEVERITY_OPTS: BugSeverity[] = ["blocker", "critical", "major", "minor"];
const STATUS_OPTS: BugStatus[] = ["new", "converted", "ignored", "verified", "reopened"];
const TYPE_OPTS: BugType[] = ["ui", "functional", "api"];

interface FilterState {
  search: string;
  severity?: BugSeverity;
  status?: BugStatus;
  bugStatus?: "not started" | "pending" | "completed";
  bugType?: BugType;
  module?: string;
  assigneeId?: string;
  createdById?: string;
  createdRange?: [any, any] | null;
  updatedRange?: [any, any] | null;
}

const DEFAULT_FILTERS: FilterState = { search: "" };

const stringToHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export default function BugListPage() {
  const { message } = App.useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("buglist_selected_project") || null;
    }
    return null;
  });

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem("buglist_selected_project", selectedProjectId);
    } else {
      localStorage.removeItem("buglist_selected_project");
    }
  }, [selectedProjectId]);

  const [scope, setScope] = useState<BugScope>("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [subScope, setSubScope] = useState<"bugs" | "sheets" | "folders">("sheets");

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { theme } = useTheme();
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const {
    canCreateBug,
    canReadBug,
    canUpdateBug,
    canDeleteBug,
    canReadBugTrash,
    canRestoreBugTrash,
    canDeleteBugTrash,
    canReadBugArchive,
    canRestoreBugArchive,
    canManageBugs,
    canCreateTicket,
  } = usePermission();

  useEffect(() => {
    if (!authLoading && !canReadBug) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadBug, router]);

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<BugFolder | null>(null);
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<BugSheet | null>(null);
  const [sheetParentFolderId, setSheetParentFolderId] = useState<string | null>(null);

  const [bugDrawerOpen, setBugDrawerOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<BugListItem | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [bulkTicketOpen, setBulkTicketOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const [quickTitle, setQuickTitle] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: projects, isLoading: projectsLoading } = useAllProjects();
  const { data: folders, isLoading: foldersLoading } = useBugFolders(selectedProjectId || undefined);
  const { data: projectSheets } = useProjectSheets(selectedProjectId);
  const { data: sheets } = useBugSheets(selectedFolderId);
  const { data: archivedSheets } = useArchivedSheets(selectedFolderId || undefined);
  const { data: trashedSheets } = useTrashedSheets(selectedFolderId || undefined);
  const { data: archivedFolders } = useArchivedFolders();
  const { data: trashedFolders } = useTrashedFolders();
  const { data: stats } = useBugStats({
    folderId: selectedFolderId || undefined,
    sheetId: selectedSheetId || undefined,
    scope,
    projectId: selectedProjectId || undefined,
  });

  const [sidebarWidth, setSidebarWidth] = useState(252);
  const [isResizing, setIsResizing] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 1024px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent | any) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= 180 && newWidth <= 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const bulkMoveBugs = useBulkMoveBugs();

  const prefilledProjectId = useMemo(() => {
    if (!selectedFolderId) return undefined;
    const folder = folders?.find((f) => f.id === selectedFolderId);
    return folder?.projectId || undefined;
  }, [selectedFolderId, folders]);

  // Add missing variables to fix TypeScript errors
  const { users } = useMembersSelect();
  const members = users.map(u => ({ value: u.value, label: u.label }));
  const allFolders = useMemo(() => {
    const res = [...(folders || [])];
    archivedFolders?.forEach(f => { if (!res.find(x => x.id === f.id)) res.push(f); });
    trashedFolders?.forEach(f => { if (!res.find(x => x.id === f.id)) res.push(f); });
    return res;
  }, [folders, archivedFolders, trashedFolders]);

  const allSheets = useMemo(() => {
    const res = [...(sheets || [])];
    projectSheets?.forEach(s => { if (!res.find(x => x.id === s.id)) res.push(s); });
    archivedSheets?.forEach(s => { if (!res.find(x => x.id === s.id)) res.push(s); });
    trashedSheets?.forEach(s => { if (!res.find(x => x.id === s.id)) res.push(s); });
    return res;
  }, [sheets, projectSheets, archivedSheets, trashedSheets]);

  const workspaceStats = {
    totalFolders: folders?.length || 0,
    totalSheets: projectSheets?.length || 0,
    total: stats?.total || 0,
    verified: stats?.verified || 0,
    completed: stats?.completed || 0,
    linked: stats?.linked || 0,
  };
  const filterSheets = sheets?.filter(s => s.name.toLowerCase().includes(filters.search.toLowerCase())) || [];
  const showWorkspaceStats = scope !== "archived" && scope !== "trash" && (folders?.length || 0) > 0;
  const isViewingBugs = selectedSheetId || (scope !== "archived" && scope !== "trash") || (subScope === "bugs");

  const isSelectedFolderArchived = useMemo(() => {
    return !!selectedFolderId && !!archivedFolders?.some(f => f.id === selectedFolderId);
  }, [selectedFolderId, archivedFolders]);

  const isSelectedSheetArchived = useMemo(() => {
    return !!selectedSheetId && !!archivedSheets?.some(s => s.id === selectedSheetId);
  }, [selectedSheetId, archivedSheets]);

  const isSelectedFolderTrashed = useMemo(() => {
    return !!selectedFolderId && !!trashedFolders?.some(f => f.id === selectedFolderId);
  }, [selectedFolderId, trashedFolders]);

  const isSelectedSheetTrashed = useMemo(() => {
    return !!selectedSheetId && !!trashedSheets?.some(s => s.id === selectedSheetId);
  }, [selectedSheetId, trashedSheets]);

  const isNestedInFolder = scope === "archived" ? isSelectedFolderArchived : scope === "trash" ? isSelectedFolderTrashed : false;
  const isNestedInSheet = scope === "archived" ? isSelectedSheetArchived : scope === "trash" ? isSelectedSheetTrashed : false;

  const queryFilters = useMemo(
    () => ({
      folderId: selectedFolderId || undefined,
      sheetId: selectedSheetId || undefined,
      projectId: selectedProjectId || undefined,
      scope,
      search: filters.search || undefined,
      severity: filters.severity,
      status: filters.status,
      bugStatus: filters.bugStatus,
      bugType: filters.bugType,
      module: filters.module,
      assigneeId: filters.assigneeId,
      createdById: filters.createdById || undefined,
      createdFrom: filters.createdRange?.[0] ? dayjs(filters.createdRange[0]).startOf("day").toISOString() : undefined,
      createdTo: filters.createdRange?.[1] ? dayjs(filters.createdRange[1]).endOf("day").toISOString() : undefined,
      updatedFrom: filters.updatedRange?.[0] ? dayjs(filters.updatedRange[0]).startOf("day").toISOString() : undefined,
      updatedTo: filters.updatedRange?.[1] ? dayjs(filters.updatedRange[1]).endOf("day").toISOString() : undefined,
      page,
      limit,
    }),
    [scope, selectedFolderId, selectedSheetId, selectedProjectId, filters, page, limit]
  );

  const { data: bugsResponse, isLoading, isFetching } = useBugs(queryFilters);

  const createBug = useCreateBug();
  const updateBug = useUpdateBug();
  const deleteBug = useDeleteBug();
  const bulkUpdateStatus = useBulkUpdateBugStatus();
  const bulkDelete = useBulkDeleteBugs();
  const bulkPermanentDelete = useBulkPermanentDeleteBugs();
  const bulkRestore = useBulkRestoreBugs();

  const verifyBug = useVerifyBug();
  const reopenBug = useReopenBug();
  const restoreBug = useRestoreBug();
  const permanentDeleteBug = usePermanentDeleteBug();

  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
    if (scope === "trash" || scope === "archived") {
      setSubScope("folders");
    }
  }, [scope, selectedFolderId, selectedSheetId, filters]);

  // Global "/" focuses search like the screenshot
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const rawBugs = bugsResponse?.bugs || [];
  const bugs = useMemo(() => {
    if (!filters.bugStatus) return rawBugs;
    return rawBugs.filter(b => b.bugStatus === filters.bugStatus || (!b.bugStatus && filters.bugStatus === "not started"));
  }, [rawBugs, filters.bugStatus]);
  const total = bugsResponse?.pagination.total || 0;
  const shown = bugs.length;

  const showPagination =
    viewMode === "list" &&
    !!selectedProjectId &&
    !(folders?.length === 0 && scope === "all" && !foldersLoading) &&
    (scope !== "archived" || !!selectedSheetId) &&
    (scope !== "trash" || !!selectedSheetId) &&
    !!bugsResponse?.pagination &&
    total > 0;

  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    bugs.forEach((b) => b.module && set.add(b.module));
    return Array.from(set).sort();
  }, [bugs]);

  const memberOptions = useMemo(
    () => members.map((m: { value: string; label: string }) => ({ value: m.value, label: m.label })),
    [members]
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.search) n++;
    if (filters.severity) n++;
    if (filters.status) n++;
    if (filters.bugStatus) n++;
    if (filters.bugType) n++;
    if (filters.module) n++;
    if (filters.assigneeId) n++;
    if (filters.createdById) n++;
    if (filters.createdRange) n++;
    if (filters.updatedRange) n++;
    return n;
  }, [filters]);

  const breadcrumbScope = useMemo(() => {
    if (scope === "mine") return "My Bugs";
    if (selectedSheetId) {
      const folder = folders?.find((f) => f.id === selectedFolderId);
      return folder ? folder.name : "Bugs";
    }
    if (selectedFolderId) {
      const folder = folders?.find((f) => f.id === selectedFolderId);
      return folder?.name || "Bugs";
    }
    if (scope === "trash") return "Trash";
    if (scope === "archived") return "Archived";
    return "All Bugs";
  }, [scope, folders, selectedFolderId, selectedSheetId]);

  const handleSelectFromSidebar = (
    folderId: string | null,
    sheetId: string | null
  ) => {
    setSelectedFolderId(folderId);
    setSelectedSheetId(sheetId);
    // If we are in My Bugs, Trash or Archived and select a collection item, 
    // we should go back to the active view to show all bugs in that sheet.
    const isSelectingCollection = folderId !== null || sheetId !== null;
    if (isSelectingCollection && (scope === "mine" || scope === "trash" || scope === "archived")) {
      setScope("all");
    }
    if (typeof window !== "undefined" && window.innerWidth <= 1024) {
      setMobileMenuOpen(false);
    }
  };

  const openCreateBug = () => {
    if (!selectedFolderId || !selectedSheetId) {
      message.info("Select a sheet first to capture bugs");
      return;
    }
    setEditingBug(null);
    setBugDrawerOpen(true);
  };

  const handleQuickAdd = async () => {
    const title = quickTitle.trim();
    if (!title) return;
    if (!selectedFolderId || !selectedSheetId) {
      message.info("Select a sheet first to capture bugs");
      return;
    }
    try {
      await createBug.mutateAsync({
        folderId: selectedFolderId,
        sheetId: selectedSheetId,
        title,
        description: title,
      });
      setQuickTitle("");
    } catch {
      // hook handles error toast
    }
  };

  const handleSubmitBug = async (
    payload: CreateBugInput | (UpdateBugInput & { id: string })
  ) => {
    if ("id" in payload) {
      const { id, ...rest } = payload;
      await updateBug.mutateAsync({ id, input: rest });
    } else {
      await createBug.mutateAsync(payload);
    }
    setBugDrawerOpen(false);
    setEditingBug(null);
  };

  const handleBugStatusUpdate = async (bugId: string, bugStatus: "not started" | "pending" | "completed") => {
    try {
      await updateBug.mutateAsync({
        id: bugId,
        input: { bugStatus }
      });
    } catch {
      // hook handles error toast
    }
  };

  const toggleAll = (checked: boolean) => {
    if (checked)
      setSelectedIds(new Set(bugs.filter((b) => !b.ticketId).map((b) => b.id)));
    else setSelectedIds(new Set());
  };
  const toggleOne = (id: string, checked: boolean) => {
    const target = bugs.find((b) => b.id === id);
    if (target?.ticketId) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectedBugs = useMemo(
    () => bugs.filter((b) => selectedIds.has(b.id)),
    [bugs, selectedIds]
  );

  if (authLoading || !canReadBug) {
    return null;
  }

  return (
    <div className={`hb-root ${theme === "dark" ? "hb-dark" : "hb-light"}`}>
      <style>{hivebugStyles}</style>

      {isMobile ? (
        <Drawer
          className={`hb-root ${theme === "dark" ? "hb-dark" : "hb-light"}`}
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          styles={{ body: { padding: 0 }, header: { display: "none" } }}
          width={210}
          closeIcon={null}
        >
          <HivebugSidebar
            scope={scope}
            width={210}
            onResizerMouseDown={startResizing}
            onScopeChange={setScope}
            selectedFolderId={selectedFolderId}
            selectedSheetId={selectedSheetId}
            onSelect={handleSelectFromSidebar}
            onCreateFolder={() => {
              setEditingFolder(null);
              setFolderModalOpen(true);
            }}
            onEditFolder={(f) => {
              setEditingFolder(f);
              setFolderModalOpen(true);
            }}
            onCreateSheet={(folderId) => {
              setSheetParentFolderId(folderId);
              setEditingSheet(null);
              setSheetModalOpen(true);
            }}
            onEditSheet={(s) => {
              setSheetParentFolderId(s.folderId);
              setEditingSheet(s);
              setSheetModalOpen(true);
            }}
            selectedProjectId={selectedProjectId}
            onProjectChange={(id) => {
              setSelectedProjectId(id);
              setSelectedFolderId(null);
              setSelectedSheetId(null);
            }}
          />
        </Drawer>
      ) : (
        <HivebugSidebar
          scope={scope}
          width={sidebarWidth}
          onResizerMouseDown={startResizing}
          onScopeChange={setScope}
          selectedFolderId={selectedFolderId}
          selectedSheetId={selectedSheetId}
          onSelect={handleSelectFromSidebar}
          onCreateFolder={() => {
            setEditingFolder(null);
            setFolderModalOpen(true);
          }}
          onEditFolder={(f) => {
            setEditingFolder(f);
            setFolderModalOpen(true);
          }}
          onCreateSheet={(folderId) => {
            setSheetParentFolderId(folderId);
            setEditingSheet(null);
            setSheetModalOpen(true);
          }}
          onEditSheet={(s) => {
            setSheetParentFolderId(s.folderId);
            setEditingSheet(s);
            setSheetModalOpen(true);
          }}
          selectedProjectId={selectedProjectId}
          onProjectChange={(id) => {
            setSelectedProjectId(id);
            setSelectedFolderId(null);
            setSelectedSheetId(null);
          }}
        />
      )}

      <main className="hb-main">
        <header className="hb-header">
          <div className="hb-breadcrumb" style={{ paddingLeft: 0 }}>
            {isMobile && (
              <button
                className="hb-btn hb-btn-icon hb-btn-ghost"
                onClick={() => setMobileMenuOpen(true)}
                style={{ marginRight: 8, padding: "4px 8px" }}
              >
                <Menu size={18} />
              </button>
            )}
            <div className="hb-project-switcher-header">
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: [
                    {
                      key: 'header',
                      label: (
                        <div className="hb-project-dropdown-header">
                          <span className="hb-dropdown-title">Projects</span>
                          <span className="hb-dropdown-count">{(projects || []).length} Total</span>
                        </div>
                      ),
                      disabled: true,
                    },
                    { type: 'divider' },
                    ...(projects || []).map(p => ({
                      key: p.value,
                      label: (
                        <div className={`hb-project-dropdown-item ${p.value === selectedProjectId ? 'hb-selected' : ''}`}>
                          <div className="hb-project-code-badge" style={{
                            background: p.value === selectedProjectId ? 'var(--hb-accent)' : `hsla(${stringToHash(p.code || 'PRJ') % 360}, 70%, 50%, 0.1)`,
                            color: p.value === selectedProjectId ? '#fff' : `hsl(${stringToHash(p.code || 'PRJ') % 360}, 70%, 50%)`
                          }}>
                            {p.code?.toUpperCase() || "PRJ"}
                          </div>
                          <div className="hb-project-info">
                            <div className="hb-project-label">{p.label}</div>
                            <div className="hb-project-code">#{p.code || "N/A"}</div>
                          </div>
                          {p.value === selectedProjectId && (
                            <div className="hb-selected-dot" />
                          )}
                        </div>
                      ),
                      onClick: () => {
                        setSelectedProjectId(p.value);
                        setSelectedFolderId(null);
                        setSelectedSheetId(null);
                      }
                    }))
                  ],
                  style: { padding: 8, borderRadius: 16, border: '1px solid var(--hb-border)', boxShadow: '0 12px 48px rgba(0,0,0,0.3)', minWidth: 260 }
                }}
              >
                <div className="hb-project-trigger">
                  <div className="hb-project-trigger-main">
                    <Briefcase size={14} className="hb-project-trigger-icon" />
                    <span className="hb-project-name">
                      {projects?.find(p => p.value === selectedProjectId)?.label || "Select Project"}
                    </span>
                  </div>
                  <div className="hb-project-trigger-header">
                    <span className="hb-project-trigger-hint">Switch Project</span>
                    <ChevronRight size={8} className="hb-project-hint-arrow" />
                  </div>
                </div>
              </Dropdown>
            </div>

            {scope === "archived" && !selectedSheetId && (
              <>
                <span className="hb-bc-sep">›</span>
                <span className="hb-bc-soft">Archived Sheets</span>
              </>
            )}
            {scope === "archived" && selectedSheetId && (
              <>
                <span className="hb-bc-sep">›</span>
                <span className="hb-bc-soft">Archived Sheets</span>
                <span className="hb-bc-sep">›</span>
                <span className="hb-bc-soft">
                  {archivedSheets?.find((s) => s.id === selectedSheetId)?.name || "Loading..."}
                </span>
              </>
            )}
            {scope === "trash" && !selectedSheetId && (
              <>
                <span className="hb-bc-sep">›</span>
                <span className="hb-bc-soft">Trash</span>
              </>
            )}
            {selectedFolderId || (selectedSheetId && scope !== "archived") ? (
              <>
                <span className="hb-bc-sep">›</span>
                {selectedFolderId && (
                  <>
                    <span className="hb-bc-soft">
                      {allFolders.find((f) => f.id === selectedFolderId)?.name || "Loading..."}
                    </span>
                    {selectedSheetId && <span className="hb-bc-sep">›</span>}
                  </>
                )}
                {selectedSheetId && (
                  <span className="hb-bc-soft">
                    {allSheets.find((s) => s.id === selectedSheetId)?.name || "Loading..."}
                  </span>
                )}
              </>
            ) : null}
            {total > 0 && (
              <span className="hb-bc-count">
                {total} {total === 1 ? "bug" : "bugs"}
              </span>
            )}
          </div>

          {(folders?.length || 0) > 0 && (
            <div className="hb-header-tools">
              <div className="hb-search">
                <Search size={14} />
                <input
                  ref={searchRef}
                  placeholder="Search title, tags, assignee…"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                />
              </div>

              <div className="hb-viewmode-toggle" role="tablist" aria-label="View mode">
                <button
                  type="button"
                  className={`hb-viewmode-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  role="tab"
                >
                  <List size={13} />
                  List
                </button>
                <button
                  type="button"
                  className={`hb-viewmode-btn ${viewMode === "calendar" ? "active" : ""}`}
                  onClick={() => setViewMode("calendar")}
                  aria-pressed={viewMode === "calendar"}
                  role="tab"
                >
                  <CalendarDays size={13} />
                  Calendar
                </button>
              </div>

              <button
                className={`hb-btn hb-btn-ghost hb-filter-toggle ${filtersVisible ? "active" : ""
                  }`}
                onClick={() => setFiltersVisible((v) => !v)}
                aria-pressed={filtersVisible}
                disabled={viewMode === "calendar"}
                style={viewMode === "calendar" ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              >
                <SlidersHorizontal size={14} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="hb-filter-badge">{activeFilterCount}</span>
                )}
              </button>

              <Tooltip title="Trash Bin">
                <button
                  className={`hb-btn hb-btn-ghost ${scope === "trash" ? "active" : ""}`}
                  onClick={() => {
                    setScope("trash");
                    setSelectedFolderId(null);
                    setSelectedSheetId(null);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </Tooltip>

              <Tooltip title="Archive Bin">
                <button
                  className={`hb-btn hb-btn-ghost ${scope === "archived" ? "active" : ""}`}
                  onClick={() => {
                    setScope("archived");
                    setSelectedFolderId(null);
                    setSelectedSheetId(null);
                  }}
                >
                  <Archive size={14} />
                </button>
              </Tooltip>

              {selectedSheetId && (
                <button
                  className="hb-btn hb-btn-primary"
                  onClick={openCreateBug}
                >
                  <Plus size={14} />
                  New Bug
                </button>
              )}
            </div>
          )}
        </header>

        {showWorkspaceStats && (
          <div className="hb-stats-row">
            <StatCard
              icon={<FolderTree size={14} />}
              label={workspaceStats.totalSheets > 0 ? "Folders / Sheets" : "Folders"}
              value={
                <>
                  {workspaceStats.totalFolders}
                  {workspaceStats.totalSheets > 0 && (
                    <>
                      <span className="hb-stat-sep">/</span>
                      {workspaceStats.totalSheets}
                    </>
                  )}
                </>
              }
            />
            <StatCard
              icon={<BugIcon size={14} />}
              label="Total bugs"
              value={workspaceStats?.total ?? "—"}
            />
            <StatCard
              icon={<TicketIcon size={14} />}
              label="Tickets created"
              value={
                <>
                  {workspaceStats?.linked ?? "—"}
                  <span className="hb-stat-sep">/</span>
                  {workspaceStats?.total ?? "—"}
                </>
              }
            />
            {(() => {
              const percentage = workspaceStats && workspaceStats.total > 0
                ? Math.round((workspaceStats.completed / workspaceStats.total) * 100)
                : 0;

              let tone: "default" | "success" | "danger" | "warning" | "info" = "default";
              if (workspaceStats && workspaceStats.total > 0) {
                if (percentage < 30) tone = "danger";
                else if (percentage < 60) tone = "warning";
                else if (percentage < 80) tone = "info";
                else tone = "success";
              }

              return (
                <StatCard
                  icon={<Activity size={14} />}
                  label="Health"
                  value={
                    workspaceStats && workspaceStats.total > 0 ? `${percentage}%` : "—"
                  }
                  detail={
                    workspaceStats && workspaceStats.total > 0 ? (
                      <>
                        <strong>{workspaceStats.completed}</strong> completed out of{" "}
                        <strong>{workspaceStats.total}</strong>{" "}
                        {workspaceStats.total === 1 ? "Bug" : "Bugs"}
                      </>
                    ) : undefined
                  }
                  tone={tone}
                />
              );
            })()}
          </div>
        )}

        {filtersVisible && viewMode === "list" && (
          <div className="hb-filterbar">
            <div className="hb-filterbar-header">
              <div className="hb-filterbar-lead">
                <span className="hb-filterbar-lead-icon">
                  <SlidersHorizontal size={13} strokeWidth={2.5} />
                </span>
                <span className="hb-filterbar-lead-text">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="hb-filter-badge">{activeFilterCount}</span>
                )}
              </div>
              <div className="hb-filterbar-actions">
                {activeFilterCount > 0 && (
                  <button
                    className="hb-filter-reset"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    title="Reset filters"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                )}
                <Tooltip title="Hide filters">
                  <button
                    className="hb-icon-btn hb-filterbar-close"
                    onClick={() => setFiltersVisible(false)}
                    aria-label="Hide filters"
                  >
                    <X size={15} />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="hb-filter-grid">
              <SearchableDropdown
                triggerLabel="Folder"
                placeholder="All folders"
                searchPlaceholder="Search folders…"
                itemNoun="folders"
                value={selectedFolderId || undefined}
                onChange={(v) => {
                  setSelectedFolderId(v || null);
                  setSelectedSheetId(null);
                }}
                options={allFolders.map((f) => ({
                  value: f.id,
                  label: f.name,
                  badge: <Folder size={14} />,
                }))}
              />

              <SearchableDropdown
                triggerLabel="Sheet"
                placeholder="All sheets"
                searchPlaceholder="Search sheets…"
                itemNoun="sheets"
                value={selectedSheetId || undefined}
                onChange={(v) => setSelectedSheetId(v || null)}
                options={allSheets
                  .filter((s) => !selectedFolderId || s.folderId === selectedFolderId)
                  .map((s) => ({
                    value: s.id,
                    label: s.name,
                    badge: <Layers size={14} />,
                  }))}
              />

              <SearchableDropdown
                triggerLabel="Created by"
                placeholder="Anyone"
                searchPlaceholder="Search people…"
                itemNoun="members"
                value={filters.createdById || undefined}
                onChange={(v) => setFilters((f) => ({ ...f, createdById: v }))}
                options={memberOptions}
              />

              <SearchableDropdown
                triggerLabel="Assignee"
                placeholder="Anyone"
                searchPlaceholder="Search people…"
                itemNoun="members"
                value={filters.assigneeId || undefined}
                onChange={(v) => setFilters((f) => ({ ...f, assigneeId: v }))}
                options={memberOptions}
              />

              <SearchableDropdown
                triggerLabel="Status"
                placeholder="Any status"
                itemNoun="statuses"
                value={filters.status || undefined}
                onChange={(v) =>
                  setFilters((f) => ({ ...f, status: v as BugStatus | undefined }))
                }
                options={STATUS_OPTS.map((s) => ({
                  value: s,
                  label: cap(s),
                  badge: <CircleDot size={14} />,
                }))}
              />

              <SearchableDropdown
                triggerLabel="Bug status"
                placeholder="Any progress"
                itemNoun="states"
                value={filters.bugStatus || undefined}
                onChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    bugStatus: v as "not started" | "pending" | "completed" | undefined,
                  }))
                }
                options={[
                  { value: "not started", label: "Not Started", badge: <Activity size={14} /> },
                  { value: "pending", label: "Pending", badge: <Activity size={14} /> },
                  { value: "completed", label: "Completed", badge: <Activity size={14} /> },
                ]}
              />

              <SearchableDropdown
                triggerLabel="Severity"
                placeholder="Any severity"
                itemNoun="levels"
                value={filters.severity || undefined}
                onChange={(v) =>
                  setFilters((f) => ({ ...f, severity: v as BugSeverity | undefined }))
                }
                options={SEVERITY_OPTS.map((s) => ({
                  value: s,
                  label: cap(s),
                  badge: <AlertTriangle size={14} />,
                }))}
              />

              <SearchableDropdown
                triggerLabel="Type"
                placeholder="Any type"
                itemNoun="types"
                value={filters.bugType || undefined}
                onChange={(v) =>
                  setFilters((f) => ({ ...f, bugType: v as BugType | undefined }))
                }
                options={TYPE_OPTS.map((s) => ({
                  value: s,
                  label: s.toUpperCase(),
                  badge: <Tag size={14} />,
                }))}
              />

              <div
                className={`hb-filter-range ${filters.createdRange ? "is-active" : ""}`}
              >
                <span className="hb-filter-range-label">
                  <Calendar size={11} /> Created
                </span>
                <RangePicker
                  size="small"
                  variant="borderless"
                  value={filters.createdRange}
                  onChange={(v) =>
                    setFilters((f) => ({ ...f, createdRange: v as any }))
                  }
                />
              </div>

              <div
                className={`hb-filter-range ${filters.updatedRange ? "is-active" : ""}`}
              >
                <span className="hb-filter-range-label">
                  <Calendar size={11} /> Updated
                </span>
                <RangePicker
                  size="small"
                  variant="borderless"
                  value={filters.updatedRange}
                  onChange={(v) =>
                    setFilters((f) => ({ ...f, updatedRange: v as any }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === "list" && selectedSheetId && (scope === "all" || scope === "mine") && (
          <div className="hb-quickadd">
            <Plus size={14} />
            <input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuickAdd();
              }}
              placeholder="Type bug title and press Enter to add…"
              disabled={createBug.isPending}
            />
            <span className="hb-kbd hb-kbd-soft">Quick</span>
          </div>
        )}

        {viewMode === "list" && selectedIds.size > 0 && (
          <div className="hb-bulkbar">
            <span>{selectedIds.size} selected</span>
            <div className="hb-bulkbar-actions">
              {scope === "trash" ? (
                <>
                  <button
                    className="hb-btn hb-btn-primary"
                    onClick={() => bulkRestore.mutate(Array.from(selectedIds))}
                  >
                    <RotateCcw size={13} />
                    Restore
                  </button>
                  <Popconfirm
                    title="Permanently delete selected bugs? This cannot be undone."
                    okText="Delete Permanently"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => bulkPermanentDelete.mutate(Array.from(selectedIds))}
                  >
                    <button className="hb-btn hb-btn-danger">
                      <Trash2 size={13} />
                      Delete Permanently
                    </button>
                  </Popconfirm>
                </>
              ) : (
                <>
                  <Select
                    placeholder="Move to Sheet"
                    size="small"
                    className="hb-bulk-move-select"
                    popupClassName="hb-bulk-move-popup"
                    suffixIcon={<ChevronDown size={12} />}
                    style={{ width: 160 }}
                    value={null}
                    loading={bulkMoveBugs.isPending}
                    onChange={(targetSheetId) => {
                      if (!targetSheetId) return;
                      bulkMoveBugs.mutate(
                        {
                          bugIds: Array.from(selectedIds),
                          targetSheetId
                        },
                        {
                          onSuccess: () => {
                            setSelectedIds(new Set());
                          }
                        }
                      );
                    }}
                    options={(projectSheets || [])
                      .filter(s => s.id !== selectedSheetId)
                      .map(s => ({
                        value: s.id,
                        label: (
                          <div className="hb-move-option">
                            <Box size={12} className="hb-move-icon" />
                            <div className="hb-move-info">
                              <div className="hb-move-name">{s.name}</div>
                              <div className="hb-move-folder">{s.folderName}</div>
                            </div>
                          </div>
                        )
                      }))}
                  />
                  <button
                    className="hb-btn hb-btn-primary"
                    onClick={() => setBulkTicketOpen(true)}
                  >
                    <Sparkles size={13} />
                    Create ticket{selectedIds.size === 1 ? "" : "s"}
                  </button>
                  {/* <button
                    className="hb-btn hb-btn-ghost"
                    onClick={() =>
                      bulkUpdateStatus.mutate({
                        bugIds: Array.from(selectedIds),
                        status: "ignored",
                      })
                    }
                  >
                    <Ban size={13} />
                    Ignore
                  </button> */}
                  <Popconfirm
                    title="Move selected bugs to trash?"
                    okText="Move to Trash"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => bulkDelete.mutate(Array.from(selectedIds))}
                    disabled={!canDeleteBug}
                  >
                    <button
                      className="hb-btn hb-btn-danger"
                      disabled={!canDeleteBug}
                      style={{ opacity: canDeleteBug ? 1 : 0.5, cursor: canDeleteBug ? 'pointer' : 'not-allowed' }}
                    >
                      <Trash2 size={13} />
                      Move to Trash
                    </button>
                  </Popconfirm>
                </>
              )}
            </div>
          </div>
        )}

        <div className="hb-content">
          {!selectedProjectId ? (
            <div className="hb-empty-state hb-project-empty">
              <div className="hb-empty-icon">
                <div className="hb-empty-icon-ring">
                  <Briefcase size={40} />
                </div>
              </div>
              <h3>Choose a Project</h3>
              <p>To view bugs and manage your workflow, please select a project from the header above.</p>
              <div className="hb-empty-actions">
                <button
                  className="hb-btn hb-btn-primary hb-btn-lg"
                  onClick={() => {
                    message.info("Click the project switcher in the top-left");
                  }}
                >
                  <Search size={14} />
                  Find Project
                </button>
              </div>
            </div>
          ) : viewMode === "calendar" ? (
            <BugCalendarView
              projectId={selectedProjectId}
              folderId={selectedFolderId}
              sheetId={selectedSheetId}
              scope={scope}
              onSelectBug={(bug) => {
                setEditingBug(bug);
                setBugDrawerOpen(true);
              }}
            />
          ) : (folders?.length === 0 && scope === "all" && !foldersLoading) ? (
            <div className="hb-empty-state hb-folders-empty">
              <div className="hb-empty-icon">
                <div className="hb-empty-icon-ring hb-folder-ring">
                  <FolderTree size={40} />
                </div>
              </div>
              <h3>No Folders Found</h3>
              <p>This project doesn't have any bug folders yet. Create your first folder to start tracking bugs.</p>
              <div className="hb-empty-actions">
                <button
                  className="hb-btn hb-btn-primary hb-btn-lg"
                  onClick={() => setFolderModalOpen(true)}
                >
                  <Plus size={14} />
                  New Folder
                </button>
              </div>
            </div>
          ) : (
            <>
              {scope === "archived" && !selectedSheetId && (
                <ArchiveView
                  selectedSheetId={selectedSheetId}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={setSelectedFolderId}
                  activeTab={subScope as any}
                  onTabChange={(v) => setSubScope(v as any)}
                  onSelectSheet={setSelectedSheetId}
                  onSelectBug={(bug) => {
                    setEditingBug(bug);
                    setBugDrawerOpen(true);
                  }}
                />
              )}
              {scope === "trash" && !selectedSheetId && (
                <TrashView
                  selectedSheetId={selectedSheetId}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={setSelectedFolderId}
                  activeTab={subScope as any}
                  onTabChange={(v) => setSubScope(v as any)}
                  onSelectSheet={setSelectedSheetId}
                  onSelectBug={(bug) => {
                    setEditingBug(bug);
                    setBugDrawerOpen(true);
                  }}
                />
              )}

              {/* ── archived sheet context banner ── */}
              {scope === "archived" && selectedSheetId && (
                <div className="hb-archive-banner">
                  <div className="hb-archive-banner-icon">
                    <Archive size={14} />
                  </div>
                  <div className="hb-archive-banner-text">
                    <div className="hb-archive-banner-title">
                      Archived Sheet — Read Only
                    </div>
                    <div className="hb-archive-banner-sub">
                      You're viewing bugs from{" "}
                      <strong>
                        {archivedSheets?.find((s) => s.id === selectedSheetId)?.name || "this sheet"}
                      </strong>.
                      Archived sheets cannot be edited.
                    </div>
                  </div>
                  <button
                    className="hb-archive-banner-back"
                    onClick={() => setSelectedSheetId(null)}
                  >
                    <ChevronLeft size={13} />
                    Back to Archived Sheets
                  </button>
                </div>
              )}

              {/* ── trash sheet context banner ── */}
              {scope === "trash" && selectedSheetId && (
                <div className="hb-archive-banner">
                  <div className="hb-archive-banner-icon">
                    <Trash2 size={14} />
                  </div>
                  <div className="hb-archive-banner-text">
                    <div className="hb-archive-banner-title">
                      Trashed Sheet — Read Only
                    </div>
                    <div className="hb-archive-banner-sub">
                      You're viewing bugs from{" "}
                      <strong>
                        {trashedSheets?.find((s) => s.id === selectedSheetId)?.name || "this trashed sheet"}
                      </strong>.
                      Trashed sheets can be restored or permanently deleted.
                    </div>
                  </div>
                  <button
                    className="hb-archive-banner-back"
                    onClick={() => setSelectedSheetId(null)}
                  >
                    <ChevronLeft size={13} />
                    Back to Trash
                  </button>
                </div>
              )}
              {(scope !== "archived" || (scope === "archived" && selectedSheetId)) && (scope !== "trash" || (scope === "trash" && selectedSheetId)) && (
                <>
                  <HivebugTable
                    bugs={bugs}
                    loading={isLoading || isFetching}
                    selectedIds={selectedIds}
                    onToggleAll={toggleAll}
                    onToggle={toggleOne}
                    onEdit={(bug) => {
                      setEditingBug(bug);
                      setBugDrawerOpen(true);
                    }}
                    onCreateTicket={(bug) => {
                      setSelectedIds(new Set([bug.id]));
                      setBulkTicketOpen(true);
                    }}
                    onVerify={(bug) => verifyBug.mutate(bug.id)}
                    onReopen={(bug) => reopenBug.mutate(bug.id)}
                    onIgnore={(bug) =>
                      bulkUpdateStatus.mutate({ bugIds: [bug.id], status: "ignored" })
                    }
                    onDelete={(bug) =>
                      scope === "trash"
                        ? permanentDeleteBug.mutate(bug.id)
                        : deleteBug.mutate(bug.id)
                    }
                    onRestore={(bug) => restoreBug.mutate(bug.id)}
                    onArchive={(bug) =>
                      bulkUpdateStatus.mutate({ bugIds: [bug.id], status: "archived" })
                    }
                    onBugStatusUpdate={handleBugStatusUpdate}
                    isTrashView={scope === "trash"}
                    isArchiveView={scope === "archived"}
                    isNestedInSheet={isNestedInSheet}
                    isNestedInFolder={isNestedInFolder}
                  />
                </>
              )}
            </>
          )}
        </div>

        {showPagination && bugsResponse?.pagination && (
          <div className="hb-pagination">
            <div className="hb-pagination-info">
              Showing
              <strong>
                {" "}
                {(page - 1) * limit + 1}
                –{(page - 1) * limit + shown}{" "}
              </strong>
              of <strong>{total}</strong>
            </div>
            <div className="hb-pagination-controls">
              <label className="hb-pagination-pagesize">
                Rows
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="hb-pagination-pager">
                <button
                  className="hb-pagination-btn"
                  disabled={!bugsResponse.pagination.hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  ‹ Prev
                </button>
                <span className="hb-pagination-page">
                  Page <strong>{page}</strong> of{" "}
                  <strong>{bugsResponse.pagination.pages}</strong>
                </span>
                <button
                  className="hb-pagination-btn"
                  disabled={!bugsResponse.pagination.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <CreateBugDrawer
        open={bugDrawerOpen}
        onClose={() => {
          setBugDrawerOpen(false);
          setEditingBug(null);
        }}
        folderId={selectedFolderId}
        sheetId={selectedSheetId}
        editingBug={editingBug}
        modules={moduleOptions}
        onSubmit={handleSubmitBug}
        submitting={createBug.isPending || updateBug.isPending}
      />

      <FolderModal
        open={folderModalOpen}
        editing={editingFolder}
        defaultProjectId={selectedProjectId}
        onClose={() => {
          setFolderModalOpen(false);
          setEditingFolder(null);
        }}
      />

      <SheetModal
        open={sheetModalOpen}
        folderId={sheetParentFolderId}
        editing={editingSheet}
        onClose={() => {
          setSheetModalOpen(false);
          setEditingSheet(null);
        }}
      />

      <AiReviewModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        bugs={selectedBugs}
      />

      <BulkTicketModal
        open={bulkTicketOpen}
        bugs={selectedBugs}
        prefilledProjectId={prefilledProjectId}
        onClose={() => setBulkTicketOpen(false)}
        onPickAi={() => {
          setBulkTicketOpen(false);
          setAiOpen(true);
        }}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: "default" | "success" | "danger" | "warning" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "hb-stat-success"
      : tone === "danger"
        ? "hb-stat-danger"
        : tone === "warning"
          ? "hb-stat-warning"
          : tone === "info"
            ? "hb-stat-info"
            : "";
  return (
    <div className={`hb-stat-card ${toneClass}`}>
      <div className="hb-stat-icon">{icon}</div>
      <div className="hb-stat-body">
        <div className="hb-stat-label">{label}</div>
        <div className="hb-stat-value">{value}</div>
        {detail && <div className="hb-stat-detail">{detail}</div>}
      </div>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
