"use client";
import dayjs from "dayjs";
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  FilterOutlined,
  ExpandAltOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  UserOutlined,
  LinkOutlined,
  FolderOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { TicketFilterPill } from "../TicketFilterPill";

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
  Popover,
  Button,
  Space,
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
  RotateCw,
  FolderTree,
  Bug as BugIcon,
  Ticket as TicketIcon,
  Activity,
  Archive,
  ChevronLeft,
  ChevronRight,
  Folder,
  Layers,
  CircleDot,
  AlertTriangle,
  Tag,
  Calendar,
  CalendarDays,
  ChevronDown,
  CornerUpRight,
  Briefcase,
  List,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
} from "lucide-react";
import { useAllProjects } from "@/hooks/useGlobalData";
import HivebugSidebar, { BugScope } from "./HivebugSidebar";
import HivebugTable from "./HivebugTable";

const DateFilterPill = ({ icon, label, value, onChange }: { icon?: React.ReactNode, label: string, value: any, onChange: (dates: any) => void }) => {
  const [open, setOpen] = useState(false);
  const active = !!(value && value[0] && value[1]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <DatePicker.RangePicker
        open={open}
        onOpenChange={setOpen}
        value={value}
        onChange={onChange}
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          opacity: 0, zIndex: 2, cursor: 'pointer'
        }}
      />
      <button
        type="button"
        className={`fp-trigger ${active ? "is-active" : ""} ${open ? "is-open" : ""}`}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {icon && <span className="fp-trigger-icon">{icon}</span>}
        <span className="fp-trigger-label">{label}</span>
        {active && (
           <span className="fp-trigger-count" style={{ background: 'var(--bg-slate-100)', borderRadius: 4, padding: '0 4px', color: 'var(--text-slate-700)', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>
             {dayjs(value[0]).format('MMM D')} - {dayjs(value[1]).format('MMM D')}
           </span>
        )}
        <ChevronDown size={12} className={`fp-trigger-chevron ${open ? "is-open" : ""}`} />
      </button>
    </div>
  );
};

import ArchiveView from "./ArchiveView";
import TrashView from "./TrashView";
import CreateBugDrawer from "./CreateBugDrawer";
import { FolderModal, SheetModal } from "./FolderSheetModals";
import CreateTicketWizard from "./CreateTicketWizard";
import BugCalendarView from "./BugCalendarView";
import BugFilters from "./BugFilters";

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
import { useProjectQaModules } from "@/hooks/useQaOptions";
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
import { STATUS_OPTIONS } from "@/utils/ticketUtils";

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
  ticketStatus?: string;
  createdRange?: [any, any] | null;
  updatedRange?: [any, any] | null;
}

const DEFAULT_FILTERS: FilterState = { search: "" };

/** How many projects the empty-state picker shows before "Show more". */
const PROJECT_PICKER_PREVIEW = 6;

const stringToHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export default function BugListPage() {
  console.log("Forcing HMR reload for BugListPage");
  const { message } = App.useApp();
  /** The project picker on the empty state shows a first page of projects. */
  const [showAllPickerProjects, setShowAllPickerProjects] = useState(false);

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
  const [limit, setLimit] = useState(20);
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
  const [creationTargetOpen, setCreationTargetOpen] = useState(false);

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const [quickTitle, setQuickTitle] = useState("");
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
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

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  const members = users.map(u => ({ value: u.value, label: u.label, avatarUrl: u.avatarUrl, description: u.position || u.role }));
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

  /** Rich rows for the bulk-bar "Move to sheet" picker: sheet, its folder,
   *  how many bugs already live there and when it last changed. */
  const moveSheetOptions = useMemo(
    () =>
      (projectSheets || [])
        .filter((s) => s.id !== selectedSheetId)
        .map((s) => {
          const bugCount = s._count?.bugs ?? 0;
          return {
            value: s.id,
            label: s.name,
            description: s.folderName || "Ungrouped",
            badge: (
              <span className="hb-move-badge">
                <Layers size={14} />
              </span>
            ),
            meta: (
              <span className="hb-move-meta">
                {s.status && s.status !== "active" && (
                  <span className={`hb-move-status is-${s.status}`}>{s.status}</span>
                )}
                <span className="hb-move-count">
                  <BugIcon size={10} />
                  {bugCount}
                </span>
                {s.updatedAt && (
                  <span className="hb-move-when">{dayjs(s.updatedAt).format("MMM D")}</span>
                )}
              </span>
            ),
          };
        }),
    [projectSheets, selectedSheetId]
  );

  const workspaceStats = {
    totalFolders: folders?.length || 0,
    totalSheets: projectSheets?.length || 0,
    total: stats?.total || 0,
    verified: stats?.verified || 0,
    completed: stats?.completed || 0,
    linked: stats?.linked || 0,
  };
  const filterSheets = sheets?.filter(s => s.name.toLowerCase().includes(filters.search.toLowerCase())) || [];
  const showWorkspaceStats = !!selectedProjectId && scope !== "archived" && scope !== "trash" && (folders?.length || 0) > 0;
  const isViewingBugs = !!selectedProjectId && (selectedSheetId || (scope !== "archived" && scope !== "trash") || (subScope === "bugs"));

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
      ticketStatus: filters.ticketStatus,
      createdFrom: filters.createdRange?.[0] ? dayjs(filters.createdRange[0]).startOf("day").toISOString() : undefined,
      createdTo: filters.createdRange?.[1] ? dayjs(filters.createdRange[1]).endOf("day").toISOString() : undefined,
      updatedFrom: filters.updatedRange?.[0] ? dayjs(filters.updatedRange[0]).startOf("day").toISOString() : undefined,
      updatedTo: filters.updatedRange?.[1] ? dayjs(filters.updatedRange[1]).endOf("day").toISOString() : undefined,
      page,
      limit,
    }),
    [scope, selectedFolderId, selectedSheetId, selectedProjectId, filters, page, limit]
  );

  const { data: bugsResponse, isLoading, isFetching, refetch } = useBugs(queryFilters);

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
  }, [scope, selectedFolderId, selectedSheetId, filters]);

  useEffect(() => {
    if (scope === "trash" || scope === "archived") {
      setSubScope("folders");
    }
  }, [scope, selectedFolderId, selectedSheetId]);

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

  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = Math.min(page * limit, total);
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const showPagination =
    viewMode === "list" &&
    !!selectedProjectId &&
    !(folders?.length === 0 && scope === "all" && !foldersLoading) &&
    (scope !== "archived" || !!selectedSheetId) &&
    !!bugsResponse?.pagination &&
    total > 0;

  /**
   * The modules this project owns, from QA Space → Settings → Modules. Bugs,
   * scopes and test cases all file against the same list, so the capture form
   * offers those rather than whatever text past bugs happen to carry.
   */
  const { options: projectModuleOptions, refetch: refetchProjectModules } = useProjectQaModules(selectedProjectId);

  /** Module names already on this project's bugs — kept so old values still read back. */
  const legacyModules = useMemo(() => {
    const known = new Set(projectModuleOptions.map((o) => o.value.toLowerCase()));
    const set = new Set<string>();
    bugs.forEach((b) => {
      const name = (b.module || "").trim();
      if (name && !known.has(name.toLowerCase())) set.add(name);
    });
    return Array.from(set).sort();
  }, [bugs, projectModuleOptions]);

  /** Switching project starts from the top of that project's tree. */
  const chooseProject = (id: string) => {
    setSelectedProjectId(id);
    setSelectedFolderId(null);
    setSelectedSheetId(null);
  };

  const pickerProjects = projects || [];
  const visiblePickerProjects = showAllPickerProjects
    ? pickerProjects
    : pickerProjects.slice(0, PROJECT_PICKER_PREVIEW);
  const hiddenPickerCount = Math.max(0, pickerProjects.length - PROJECT_PICKER_PREVIEW);

  const formattedModuleOptions = useMemo(() => {
    return moduleOptions.map(m => ({
      value: m,
      label: m
    }));
  }, [moduleOptions]);

  const memberOptions = useMemo(
    () => members.map((m: any) => ({ value: m.value, label: m.label, avatarUrl: m.avatarUrl, description: m.description })),
    [members]
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.severity) n += filters.severity.length;
    if (filters.bugStatus) n += filters.bugStatus.length;
    if (filters.bugType) n += filters.bugType.length;
    if (filters.module) n += filters.module.length;
    if (filters.assigneeId) n += filters.assigneeId.length;
    if (filters.createdById) n += filters.createdById.length;
    if (filters.ticketStatus) n += filters.ticketStatus.length;
    if (selectedFolderId) n++;
    if (selectedSheetId) n++;
    return n;
  }, [filters, selectedFolderId, selectedSheetId]);


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
          className={theme === "dark" ? "hb-dark" : "hb-light"}
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          styles={{ 
            body: { padding: 0, background: theme === "dark" ? "#0B0F1A" : "#FFFFFF" }, 
            header: { display: "none" },
            mask: { background: "rgba(0, 0, 0, 0.45)" },
            content: { background: theme === "dark" ? "#0B0F1A" : "#FFFFFF" }
          }}
          width={260}
          closeIcon={null}
        >
          <HivebugSidebar
            scope={scope}
            width={260}
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
            onCreateBug={openCreateBug}
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
          onCreateBug={openCreateBug}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        />
      )}

      <style>{`
        /* Premium action dropdown */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0 !important; min-width: 236px;
          overflow: hidden !important;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }

        /* Dark Theme Action Popup */
        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu {
          background: #0B0F1A !important;
          border-color: #1E293B !important;
        }
        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item:hover {
          background: rgba(255,255,255,0.04) !important;
        }
        [data-theme='dark'] .pp-menu-title { color: #E2E8F0; }
        [data-theme='dark'] .pp-menu-desc { color: #64748B; }
        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item-divider { background: #1E293B; }
        
        /* Selected item overrides for dark mode */
        [data-theme='dark'] .pp-menu-item[style*="var(--bg-slate-50"] {
          background: rgba(255,255,255,0.08) !important;
        }
      `}</style>

      <main className="hb-main">
        <header className="hb-header">
          <div className="hb-breadcrumb" style={{ paddingLeft: 0 }}>
            {isMobile ? (
              <button
                className="hb-sidebar-toggle"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                aria-pressed={mobileMenuOpen}
              >
                <MenuFoldOutlined style={{ fontSize: 14 }} />
              </button>
            ) : (
              <button
                className="hb-sidebar-toggle"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                aria-label={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
                aria-pressed={!sidebarCollapsed}
              >
                {sidebarCollapsed ? (
                  <MenuUnfoldOutlined style={{ fontSize: 14 }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: 14 }} />
                )}
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
                        <div className="pp-menu-item" style={{ background: p.value === selectedProjectId ? 'var(--bg-slate-50, #f8fafc)' : undefined }}>
                          <span className="pp-menu-ic" style={{ 
                            background: p.value === selectedProjectId ? 'var(--hb-accent, #3b82f6)' : `hsla(${stringToHash(p.code || 'PRJ') % 360}, 70%, 50%, 0.1)`,
                            color: p.value === selectedProjectId ? '#fff' : `hsl(${stringToHash(p.code || 'PRJ') % 360}, 70%, 50%)`,
                            fontSize: 10, fontWeight: 800
                          }}>
                            {p.code?.substring(0, 3).toUpperCase() || "PRJ"}
                          </span>
                          <span className="pp-menu-text">
                            <span className="pp-menu-title" style={{ color: p.value === selectedProjectId ? 'var(--hb-accent, #3b82f6)' : undefined }}>
                              {p.label}
                            </span>
                            <span className="pp-menu-desc">#{p.code || "N/A"}</span>
                          </span>
                        </div>
                      ),
                      onClick: () => {
                        setSelectedProjectId(p.value);
                        setSelectedFolderId(null);
                        setSelectedSheetId(null);
                      }
                    }))
                  ],
                }}
                overlayClassName="pp-action-pop"
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
                    {selectedProjectId ? (
                      <X 
                        size={12} 
                        className="hb-project-hint-arrow" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectId(null);
                          setSelectedFolderId(null);
                          setSelectedSheetId(null);
                        }}
                        style={{ cursor: 'pointer', zIndex: 10 }}
                      />
                    ) : (
                      <ChevronRight size={8} className="hb-project-hint-arrow" />
                    )}
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

          {((folders?.length || 0) > 0 || scope === "trash" || scope === "archived") && (
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
                  <List size={15} />
                </button>
                <button
                  type="button"
                  className={`hb-viewmode-btn ${viewMode === "calendar" ? "active" : ""}`}
                  onClick={() => setViewMode("calendar")}
                  aria-pressed={viewMode === "calendar"}
                  role="tab"
                >
                  <CalendarDays size={15} />
                </button>
              </div>

              <button
                type="button"
                className="hb-btn hb-btn-ghost hb-refresh-btn"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh"
                style={{ width: 32, height: 32, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 32 }}
              >
                <RotateCw size={14} className={isFetching ? "animate-spin" : ""} />
              </button>

              <Space.Compact className="ticket-filter-group">
                <Popover
                  content={
                    <BugFilters
                      filters={filters}
                      onFilterChange={(key, val) => setFilters(f => ({ ...f, [key]: val }))}
                      onReset={() => {
                        setFilters(DEFAULT_FILTERS);
                        setSelectedFolderId(null);
                        setSelectedSheetId(null);
                      }}
                      folders={allFolders.map(f => ({ value: f.id, label: f.name }))}
                      sheets={allSheets.filter(s => !selectedFolderId || s.folderId === selectedFolderId).map(s => ({ value: s.id, label: s.name }))}
                      selectedFolderId={selectedFolderId}
                      selectedSheetId={selectedSheetId}
                      onFolderChange={(id) => { setSelectedFolderId(id); setSelectedSheetId(null); }}
                      onSheetChange={(id) => setSelectedSheetId(id)}
                      members={memberOptions}
                      severityOptions={[
                        { value: "critical", label: "Critical" },
                        { value: "high", label: "High" },
                        { value: "medium", label: "Medium" },
                        { value: "low", label: "Low" }
                      ]}
                      statusOptions={[
                        { value: "not started", label: "Not Started" },
                        { value: "pending", label: "Pending" },
                        { value: "completed", label: "Completed" }
                      ]}
                      typeOptions={[
                        { value: "functional", label: "Functional" },
                        { value: "visual", label: "Visual" },
                        { value: "crash", label: "Crash" },
                        { value: "performance", label: "Performance" },
                        { value: "security", label: "Security" },
                        { value: "other", label: "Other" }
                      ]}
                      moduleOptions={formattedModuleOptions}
                      ticketStatusOptions={[
                        { value: "all", label: "All bugs" },
                        { value: "linked", label: "Linked to tickets" },
                        { value: "unlinked", label: "No ticket" }
                      ]}
                    />
                  }
                  trigger="click"
                  placement="bottomRight"
                  overlayClassName="tf-popover-overlay"
                  styles={{ body: { padding: 0 } }}
                >
                  <Button
                    icon={<FilterOutlined />}
                    className={activeFilterCount > 0 ? 'saas-tag-blue' : ''}
                    style={{ height: 30, fontWeight: 600, fontSize: 12 }}
                    disabled={viewMode === "calendar"}
                  >
                    Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </Button>
                </Popover>
                <Button
                  icon={<ExpandAltOutlined />}
                  style={{ height: 30 }}
                  aria-label="Expand filters"
                  onClick={() => setFiltersVisible(prev => !prev)}
                  disabled={viewMode === "calendar"}
                />
              </Space.Compact>

              {/* <Tooltip title="Trash Bin">
                <button
                  className={`hb-btn hb-btn-ghost ${scope === "trash" ? "active" : ""}`}
                  onClick={() => {
                    setScope("trash");
                    setSelectedFolderId(null);
                    setSelectedSheetId(null);
                  }}
                >
                  <Trash2 size={14} />
                  <span className="hb-btn-text">Trash</span>
                </button>
              </Tooltip> */}
              {/* 
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
                  <span className="hb-btn-text">Archive</span>

                </button>
              </Tooltip> */}


            </div>
          )}
        </header>

        {filtersVisible && viewMode === "list" && (
          <div className="tl-filter-row" style={{ padding: '12px 24px', marginBottom: '16px' }}>
            <div className="tl-filter-row-label">
              <FilterOutlined style={{ fontSize: 11 }} />
              <span>Filters</span>
              <span className="tl-filter-row-count">
                {activeFilterCount > 0 ? activeFilterCount : '0'}
              </span>
            </div>
            <div className="tl-filter-row-pills">
              <TicketFilterPill
                icon={<FolderOutlined style={{ fontSize: 11 }} />}
                label="Folder"
                value={selectedFolderId || ""}
                options={allFolders.map(f => ({ value: f.id, label: f.name }))}
                onChange={(val: any) => {
                  setSelectedFolderId(val || null);
                  setSelectedSheetId(null);
                }}
                itemNoun="folders"
                multiple={false}
              />
              <TicketFilterPill
                icon={<ApartmentOutlined style={{ fontSize: 11 }} />}
                label="Sheet"
                value={selectedSheetId || ""}
                options={allSheets.filter(s => !selectedFolderId || s.folderId === selectedFolderId).map(s => ({ value: s.id, label: s.name }))}
                onChange={(val: any) => setSelectedSheetId(val || null)}
                itemNoun="sheets"
                multiple={false}
              />
              <TicketFilterPill
                icon={<CheckCircleOutlined style={{ fontSize: 11 }} />}
                label="Status"
                value={filters.bugStatus || ""}
                options={[
                  { value: "not started", label: "Not Started" },
                  { value: "pending", label: "Pending" },
                  { value: "completed", label: "Completed" }
                ]}
                onChange={(val: any) => setFilters(f => ({ ...f, bugStatus: val }))}
                itemNoun="statuses"
                multiple={false}
              />
              <TicketFilterPill
                icon={<ThunderboltOutlined style={{ fontSize: 11 }} />}
                label="Severity"
                value={filters.severity || ""}
                options={[
                  { value: "critical", label: "Critical" },
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" }
                ]}
                onChange={(val: any) => setFilters(f => ({ ...f, severity: val }))}
                itemNoun="severities"
                multiple={false}
              />
              <TicketFilterPill
                icon={<AppstoreOutlined style={{ fontSize: 11 }} />}
                label="Type"
                value={filters.bugType || ""}
                options={[
                  { value: "functional", label: "Functional" },
                  { value: "visual", label: "Visual" },
                  { value: "crash", label: "Crash" },
                  { value: "performance", label: "Performance" },
                  { value: "security", label: "Security" },
                  { value: "other", label: "Other" }
                ]}
                onChange={(val: any) => setFilters(f => ({ ...f, bugType: val }))}
                itemNoun="types"
                multiple={false}
              />
              {formattedModuleOptions.length > 0 && (
                <TicketFilterPill
                  icon={<AppstoreOutlined style={{ fontSize: 11 }} />}
                  label="Module"
                  value={filters.module || ""}
                  options={formattedModuleOptions}
                  onChange={(val: any) => setFilters(f => ({ ...f, module: val }))}
                  itemNoun="modules"
                  multiple={false}
                />
              )}
              <TicketFilterPill
                icon={<UserOutlined style={{ fontSize: 11 }} />}
                label="Assignee"
                value={filters.assigneeId || ""}
                options={memberOptions}
                onChange={(val: any) => setFilters(f => ({ ...f, assigneeId: val }))}
                itemNoun="members"
                width={290}
                showAvatar
                multiple={false}
              />
              <TicketFilterPill
                icon={<UserOutlined style={{ fontSize: 11 }} />}
                label="Created By"
                value={filters.createdById || ""}
                options={memberOptions}
                onChange={(val: any) => setFilters(f => ({ ...f, createdById: val }))}
                itemNoun="members"
                width={290}
                showAvatar
                multiple={false}
              />
              <TicketFilterPill
                icon={<LinkOutlined style={{ fontSize: 11 }} />}
                label="Ticket"
                value={filters.ticketStatus || ""}
                options={[
                  { value: "all", label: "All bugs" },
                  { value: "linked", label: "Linked to tickets" },
                  { value: "unlinked", label: "No ticket" }
                ]}
                onChange={(val: any) => setFilters(f => ({ ...f, ticketStatus: val }))}
                itemNoun="ticket statuses"
                multiple={false}
              />
              <DateFilterPill
                icon={<CalendarOutlined style={{ fontSize: 11 }} />}
                label="Created"
                value={filters.createdRange ? [dayjs(filters.createdRange[0]), dayjs(filters.createdRange[1])] : null}
                onChange={(dates) => setFilters(f => ({ ...f, createdRange: dates ? [dates[0]?.toDate(), dates[1]?.toDate()] : null }))}
              />
              <DateFilterPill
                icon={<CalendarOutlined style={{ fontSize: 11 }} />}
                label="Updated"
                value={filters.updatedRange ? [dayjs(filters.updatedRange[0]), dayjs(filters.updatedRange[1])] : null}
                onChange={(dates) => setFilters(f => ({ ...f, updatedRange: dates ? [dates[0]?.toDate(), dates[1]?.toDate()] : null }))}
              />
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="fp-trigger"
                  onClick={() => {
                    setFilters(DEFAULT_FILTERS);
                    setSelectedFolderId(null);
                    setSelectedSheetId(null);
                  }}
                  title="Clear all filters"
                >
                  <span className="fp-trigger-icon"><ReloadOutlined style={{ fontSize: 11 }} /></span>
                  <span className="fp-trigger-label">Clear</span>
                  <span className="fp-trigger-count">{activeFilterCount}</span>
                </button>
              )}
            </div>
          </div>
        )}

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
                    workspaceStats && workspaceStats.total > 0 ? `${percentage}%` : "0%"
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
                  <SearchableDropdown
                    value={null}
                    onChange={(targetSheetId) => {
                      if (!targetSheetId) return;
                      bulkMoveBugs.mutate(
                        {
                          bugIds: Array.from(selectedIds),
                          targetSheetId,
                        },
                        {
                          onSuccess: () => {
                            setSelectedIds(new Set());
                          },
                        }
                      );
                    }}
                    options={moveSheetOptions}
                    loading={bulkMoveBugs.isPending}
                    disabled={bulkMoveBugs.isPending}
                    searchPlaceholder="Search sheets or folders…"
                    itemNoun="sheets"
                    allowClear={false}
                    overlayClassName="hb-move-pop"
                    onOpenChange={setMoveMenuOpen}
                    emptyComponent={
                      <div className="hb-move-empty">
                        <Layers size={18} />
                        <div className="hb-move-empty-title">No other sheet to move into</div>
                        <div className="hb-move-empty-sub">
                          Create another sheet in this project first.
                        </div>
                      </div>
                    }
                    customTrigger={
                      <button
                        type="button"
                        className={`hb-btn hb-move-trigger ${moveMenuOpen ? "is-open" : ""}`}
                        disabled={bulkMoveBugs.isPending}
                      >
                        <CornerUpRight size={13} />
                        {bulkMoveBugs.isPending ? "Moving…" : "Move to sheet"}
                        <ChevronDown size={12} className="hb-move-trigger-caret" />
                      </button>
                    }
                  />
                  <button
                    className="hb-btn hb-btn-primary"
                    onClick={() => setCreationTargetOpen(true)}
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
            /* Nothing to show until a project is chosen — so choose it here,
               rather than pointing at the switcher and leaving the page blank.
               `.hb-content` clips its overflow, so the picker owns its own
               scroll — otherwise the expanded grid runs off the bottom. */
            <div className="hb-pp-scroll">
            <div className="hb-projectpicker">
              <div className="hb-pp-head">
                <span className="hb-pp-badge"><Briefcase size={20} /></span>
                <h3 className="hb-pp-title">Choose a project</h3>
                <p className="hb-pp-sub">
                  Bugs, sheets and folders all live inside a project. Pick one to open its bug list.
                </p>
              </div>

              <div className="hb-pp-search">
                <SearchableDropdown
                  options={pickerProjects.map(p => ({
                    value: p.value,
                    label: p.label,
                    description: p.code ? `#${p.code}` : undefined,
                  }))}
                  value={undefined}
                  onChange={(v: any) => v && chooseProject(v)}
                  placeholder={projectsLoading ? "Loading projects…" : "Search all projects"}
                  searchPlaceholder="Type a project name or code…"
                  itemNoun="projects"
                  loading={projectsLoading}
                  allowClear={false}
                  style={{ width: "100%" }}
                />
              </div>

              {pickerProjects.length > 0 && (
                <>
                  <div className="hb-pp-divider">
                    <span>{showAllPickerProjects ? "All projects" : "Recent projects"}</span>
                  </div>

                  <div className="hb-pp-grid">
                    {visiblePickerProjects.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        className="hb-pp-card"
                        onClick={() => chooseProject(p.value)}
                      >
                        <span className="hb-pp-card__code">
                          {(p.code || "PRJ").substring(0, 3).toUpperCase()}
                        </span>
                        <span className="hb-pp-card__text">
                          <span className="hb-pp-card__name">{p.label}</span>
                          <span className="hb-pp-card__meta">#{p.code || "N/A"}</span>
                        </span>
                        <ArrowRight size={14} className="hb-pp-card__go" />
                      </button>
                    ))}
                  </div>

                  {hiddenPickerCount > 0 && (
                    <button
                      type="button"
                      className="hb-pp-more"
                      onClick={() => setShowAllPickerProjects(v => !v)}
                    >
                      <ChevronDown size={13} className={showAllPickerProjects ? "is-open" : ""} />
                      {showAllPickerProjects ? "Show less" : `Show ${hiddenPickerCount} more`}
                    </button>
                  )}
                </>
              )}

              {!projectsLoading && pickerProjects.length === 0 && (
                <p className="hb-pp-none">You don’t belong to any project yet — ask a project manager to add you.</p>
              )}
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
                  searchQuery={filters.search}
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
                  searchQuery={filters.search}
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
                      setCreationTargetOpen(true);
                    }}
                    onVerify={(bug) => {
                      verifyBug.mutate(bug.id);
                      handleBugStatusUpdate(bug.id, "completed");
                    }}
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
          <div className="pp-footer pp-footer--sticky">
            <div className="pp-footer-info">
              Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
            </div>
            <div className="pp-pager">
              <button
                type="button"
                className="pp-pager-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                .map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`pp-pager-num ${p === page ? "is-active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              <button
                type="button"
                className="pp-pager-btn"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                ›
              </button>
              <Select
                className="pp-pagesize"
                value={limit}
                onChange={(v) => {
                  setLimit(v);
                  setPage(1);
                }}
                options={[10, 20, 25, 50, 100].map((n) => ({
                  value: n,
                  label: `${n} / page`,
                }))}
                popupMatchSelectWidth={120}
              />
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
        moduleOptions={projectModuleOptions}
        legacyModules={legacyModules}
        projectName={projects?.find(p => p.value === selectedProjectId)?.label}
        onModulesRefresh={() => refetchProjectModules()}
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

      <CreateTicketWizard
        open={creationTargetOpen}
        onClose={() => setCreationTargetOpen(false)}
        bugs={selectedBugs}
        count={selectedIds.size}
        bugIds={Array.from(selectedIds)}
        prefilledProjectId={selectedProjectId || undefined}
        onManageIntegrations={() => {
          setCreationTargetOpen(false);
          router.push("/integrations");
        }}
        onLinearSuccess={() => {
          setCreationTargetOpen(false);
          setSelectedIds(new Set());
          refetch();
        }}
      />

      <style>{`
        /* ── Inline filter row (compact pill strip) ────────── */
        .tl-filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .tl-filter-row {
          background: #0f1419;
          border-bottom-color: #1f2937;
        }
        .tl-filter-row-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-filter-row-label { color: #94a3b8; }
        .tl-filter-row-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500);
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0;
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .tl-filter-row-count {
          background: #111720;
          border-color: #2d3748;
          color: #cbd5e1;
        }
        .tl-filter-row-pills {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 12px 6px;
        }
      `}</style>
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
      <div className="hb-stat-left">
        <div className="hb-stat-icon">{icon}</div>
      </div>
      <div className="hb-stat-value-wrap">
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
