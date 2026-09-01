"use client";

import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Bug,
  Inbox,
  User,
  Plus,
  Folder,
  FolderOpen,
  ChevronRight,
  FileText,
  FileCheck2,
  Archive,
  ChevronDown,
  Briefcase,
  LayoutGrid,
  Library,
  MoreHorizontal,
  Star,
  Trash2,
  CheckCircle2,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Dropdown, Skeleton, Tooltip, Select } from "antd";
import {
  useAllProjects
} from "@/hooks/useGlobalData";
import {
  useBugFolders,
  useBugSheets,
  useBugStats,
  useDeleteBugFolder,
  useArchiveFolder,
  useDeleteBugSheet,
  useUpdateBugSheetStatus,
  useUpdateBugSheet,
  useProjectSheets,
  useBugs,
} from "@/hooks/useBugList";
import { usePermission } from "@/hooks/usePermission";
import type {
  BugFolder,
  BugSheet,
  BugSheetStatus,
  BugListItem,
} from "@/services/bugListService";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

export type BugScope = "all" | "mine" | "trash" | "archived";

interface HivebugSidebarProps {
  scope: BugScope;
  onScopeChange: (s: BugScope) => void;
  selectedFolderId: string | null;
  selectedSheetId: string | null;
  onSelect: (folderId: string | null, sheetId: string | null) => void;
  onCreateFolder: () => void;
  onEditFolder: (f: BugFolder) => void;
  onCreateSheet: (folderId: string) => void;
  onEditSheet: (s: BugSheet) => void;
  selectedProjectId: string | null;
  onProjectChange: (id: string | null) => void;
  width?: number;
  onResizerMouseDown?: (e: React.MouseEvent) => void;
  onCreateBug?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function HivebugSidebar({
  scope,
  onScopeChange,
  selectedFolderId,
  selectedSheetId,
  onSelect,
  onCreateFolder,
  onEditFolder,
  onCreateSheet,
  onEditSheet,
  selectedProjectId,
  onProjectChange,
  width,
  onResizerMouseDown,
  onCreateBug,
  isCollapsed = false,
  onToggleCollapse,
}: HivebugSidebarProps) {
  const { data: folders, isLoading: foldersLoading } = useBugFolders(selectedProjectId || undefined);
  const { data: allProjects } = useAllProjects();
  const stats = useBugStats({ projectId: selectedProjectId || undefined });

  const selectedProject = useMemo(() =>
    allProjects?.find(p => p.value === selectedProjectId),
    [allProjects, selectedProjectId]
  );

  const { canCreateBug, canUpdateBug, canDeleteBug, canManageBugs, canReadBugTrash, canReadBugArchive, canRestoreBugArchive } = usePermission();
  const updateSheet = useUpdateBugSheet();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [workspaceExpanded, setWorkspaceExpanded] = useState(true);
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const sheetId = active.id as string;
    const targetFolderId = over.id as string;
    const sourceFolderId = active.data.current?.folderId;

    if (targetFolderId !== sourceFolderId) {
      updateSheet.mutate({
        id: sheetId,
        input: { folderId: targetFolderId },
      });
    }
  };

  const [collectionSearch, setCollectionSearch] = useState("");

  const { data: projectSheets } = useProjectSheets(selectedProjectId);

  const filteredFolders = useMemo(() => {
    if (!collectionSearch.trim()) return folders;
    const q = collectionSearch.toLowerCase();
    return folders?.filter((f) => {
      const folderMatch = f.name.toLowerCase().includes(q);
      const sheetMatch = projectSheets?.some(
        (s) => s.folderId === f.id && s.name.toLowerCase().includes(q)
      );
      return folderMatch || sheetMatch;
    });
  }, [folders, projectSheets, collectionSearch]);

  const { data: trashedBugsRes } = useBugs({
    scope: "trash",
    projectId: selectedProjectId || undefined,
    limit: 1000 // Fetch up to 1000 trashed bugs to reconcile counts
  });
  const trashedBugs = trashedBugsRes?.bugs || [];

  const trashMap = useMemo(() => {
    const map: Record<string, { folder: number; sheet: number }> = {};
    trashedBugs.forEach((bug: BugListItem) => {
      if (!map[bug.folderId]) map[bug.folderId] = { folder: 0, sheet: 0 };
      if (!map[bug.sheetId]) map[bug.sheetId] = { folder: 0, sheet: 0 };
      map[bug.folderId].folder++;
      map[bug.sheetId].sheet++;
    });
    return map;
  }, [trashedBugs]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        className={`hb-sidebar-wrap ${isCollapsed ? "hb-sidebar-collapsed" : ""}`}
        style={{ width: isCollapsed ? undefined : width }}
      >
        <aside className="hb-sidebar">
          <div className="hb-brand">
            <div className="hb-brand-top">
              {!isCollapsed && (
                <>
                  <div className="hb-brand-icon">
                    <Bug size={20} />
                  </div>
                  <div className="hb-brand-text">
                    <div className="hb-brand-name">Bug List</div>
                    <div className="hb-brand-workspace">QA SPACE</div>
                  </div>
                </>
              )}
            </div>
            {!isCollapsed && onCreateBug && canCreateBug && selectedProjectId && (
              <button
                data-tour="new-bug-btn"
                className="hb-btn hb-btn-primary hb-sidebar-new-bug-btn"
                onClick={onCreateBug}
              >
                <Plus size={13} />
                New Bug
              </button>
            )}
          </div>

          {!isCollapsed && selectedProjectId && (<div className="hb-section">
            <div
              className="hb-section-title"
              style={{ cursor: "pointer" }}
              onClick={() => setWorkspaceExpanded(!workspaceExpanded)}
            >
              <span className="hb-section-title-text">
                <LayoutGrid size={11} className="hb-section-title-icon" />
                <span>WORKSPACE</span>
              </span>
              <button className="hb-icon-btn" aria-label="Toggle workspace">
                <ChevronDown
                  size={13}
                  style={{
                    transition: "transform 0.2s",
                    transform: workspaceExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
            </div>
            {workspaceExpanded && (
              <>
                <button
                  className={`hb-row ${scope === "all" && !selectedFolderId && !selectedSheetId ? "active" : ""
                    }`}
                  onClick={() => {
                    onScopeChange("all");
                    onSelect(null, null);
                  }}
                >
                  <Inbox size={15} style={{ color: (scope === "all" && !selectedFolderId && !selectedSheetId) ? "#3B82F6" : "var(--hb-text-muted)" }} />
                  <span className="hb-row-label">All Bugs</span>
                  <span className="hb-row-count">{stats.data?.total ?? 0}</span>
                </button>
                <button
                  className={`hb-row ${scope === "mine" ? "active" : ""}`}
                  onClick={() => {
                    onScopeChange("mine");
                    onSelect(null, null);
                  }}
                >
                  <User size={15} style={{ color: scope === "mine" ? "#64748B" : "var(--hb-text-muted)" }} />
                  <span className="hb-row-label">My Bugs</span>
                  <span className="hb-row-count">
                    {stats.data?.mineTotal ?? 0}
                  </span>
                </button>
                {canReadBugTrash && (
                  <button
                    className={`hb-row ${scope === "trash" ? "active" : ""}`}
                    onClick={() => {
                      onScopeChange("trash");
                      onSelect(null, null);
                    }}
                  >
                    <Trash2 size={15} style={{ color: scope === "trash" ? "#ef4444" : "var(--hb-text-muted)" }} />
                    <span className="hb-row-label">Trash</span>
                    <span className="hb-row-count">
                      {stats.data?.trashTotal ?? 0}
                    </span>
                  </button>
                )}
                {canReadBugArchive && (
                  <button
                    className={`hb-row ${scope === "archived" ? "active" : ""}`}
                    onClick={() => {
                      onScopeChange("archived");
                      onSelect(null, null);
                    }}
                  >
                  <Archive size={15} style={{ color: scope === "archived" ? "#10B981" : "var(--hb-text-muted)" }} />
                  <span className="hb-row-label">Archived</span>
                  <span className="hb-row-count">
                    {stats.data?.archivedTotal ?? 0}
                  </span>
                  </button>
                )}
              </>
            )}
          </div>)}

          {!isCollapsed && selectedProjectId && (<div className="hb-section hb-section-grow">
            <div className="hb-section-title">
              <span className="hb-section-title-text">
                <Library size={11} className="hb-section-title-icon" />
                <span>COLLECTIONS</span>
              </span>
              {canCreateBug && (
                <button className="hb-icon-btn" onClick={onCreateFolder} aria-label="New folder">
                  <Plus size={13} />
                </button>
              )}
            </div>

            <div className="hb-sidebar-search">
              <Search size={13} />
              <input
                type="text"
                placeholder="Search collections..."
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
              />
              {collectionSearch && (
                <button
                  className="hb-sidebar-search-clear"
                  onClick={() => setCollectionSearch("")}
                >
                  <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
                </button>
              )}
            </div>

            <div className="hb-collections">
              {foldersLoading ? (
                <div style={{ padding: 12 }}>
                  <Skeleton active paragraph={{ rows: 4 }} title={false} />
                </div>
              ) : !filteredFolders || filteredFolders.length === 0 ? (
                <div className="hb-section-empty">
                  {collectionSearch ? (
                    <span className="hb-row-muted">No matches found</span>
                  ) : (
                    <button className="hb-row hb-row-muted" onClick={onCreateFolder}>
                      <Plus size={13} />
                      <span className="hb-row-label">New collection</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredFolders.map((folder) => (
                  <FolderNode
                    key={folder.id}
                    folder={folder}
                    isOpen={!!expanded[folder.id] || !!collectionSearch}
                    isFolderSelected={
                      selectedFolderId === folder.id && !selectedSheetId
                    }
                    selectedSheetId={
                      selectedFolderId === folder.id ? selectedSheetId : null
                    }
                    onToggle={() => toggle(folder.id)}
                    onSelectFolder={() => {
                      onSelect(folder.id, null);
                      if (!expanded[folder.id]) toggle(folder.id);
                    }}
                    onSelectSheet={(sid) => onSelect(folder.id, sid)}
                    onEdit={() => onEditFolder(folder)}
                    onAddSheet={() => onCreateSheet(folder.id)}
                    onEditSheet={onEditSheet}
                    searchQuery={collectionSearch}
                    trashCount={trashMap[folder.id]?.folder || 0}
                    sheetTrashMap={trashMap}
                  />
                ))
              )}
            </div>
          </div>)}

        </aside>
        {!isCollapsed && <div className="hb-resizer" onMouseDown={onResizerMouseDown} />}
      </div>
    </DndContext>
  );
}

function PulseCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | undefined;
  tone: "default" | "danger" | "success";
}) {
  const hasValue = typeof value === "number";
  const cls =
    tone === "danger" ? "hb-danger" : tone === "success" ? "hb-success" : "";
  return (
    <div className="hb-pulse-cell">
      <div className="hb-pulse-label">{label}</div>
      {hasValue ? (
        <div className={`hb-pulse-value ${cls}`}>{value}</div>
      ) : (
        <div className={`hb-pulse-bar ${cls}`} aria-hidden />
      )}
    </div>
  );
}

/**
 * Hover card for a collection row — the full name never truncates here, and it
 * carries the counts you'd otherwise have to open the collection to see.
 */
function CollectionTip({
  folder,
  trashCount = 0,
}: {
  folder: BugFolder;
  trashCount?: number;
}) {
  const sheets = folder._count?.sheets ?? 0;
  const completed = folder._count?.completedSheets ?? 0;
  const bugs = Math.max(0, (folder._count?.bugs ?? 0) - trashCount);
  const allDone = sheets > 0 && completed === sheets;
  const progress = sheets > 0 ? Math.round((completed / sheets) * 100) : 0;
  const accent = folder.color || "#7aa2f7";

  return (
    <div className="hb-ctip" style={{ ["--ctip-accent" as string]: accent }}>
      <div className="hb-ctip-glow" aria-hidden />

      <div className="hb-ctip-head">
        <span className="hb-ctip-mark">
          <Library size={14} />
        </span>
        <div className="hb-ctip-headtext">
          <div className="hb-ctip-eyebrow">
            Collection
            {allDone && <span className="hb-ctip-pill">All complete</span>}
          </div>
          <div className="hb-ctip-name">{folder.name}</div>
        </div>
      </div>

      {folder.description && (
        <div className="hb-ctip-desc">{folder.description}</div>
      )}

      <div className="hb-ctip-stats">
        <div className="hb-ctip-stat">
          <div className="hb-ctip-stat-value">{sheets}</div>
          <div className="hb-ctip-stat-label">Sheets</div>
        </div>
        <div className="hb-ctip-stat">
          <div className="hb-ctip-stat-value">{completed}</div>
          <div className="hb-ctip-stat-label">Completed</div>
        </div>
        <div className="hb-ctip-stat">
          <div className="hb-ctip-stat-value">{bugs}</div>
          <div className="hb-ctip-stat-label">Bugs</div>
        </div>
      </div>

      {sheets > 0 && (
        <div className="hb-ctip-progress">
          <div className="hb-ctip-progress-track">
            <span
              className={`hb-ctip-progress-fill ${allDone ? "is-done" : ""}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="hb-ctip-progress-label">{progress}%</span>
        </div>
      )}

      {folder.updatedAt && (
        <div className="hb-ctip-foot">
          Updated {dayjs(folder.updatedAt).format("MMM D, YYYY")}
        </div>
      )}
    </div>
  );
}

interface FolderNodeProps {
  folder: BugFolder;
  isOpen: boolean;
  isFolderSelected: boolean;
  selectedSheetId: string | null;
  onToggle: () => void;
  onSelectFolder: () => void;
  onSelectSheet: (sheetId: string) => void;
  onEdit: () => void;
  onAddSheet: () => void;
  onEditSheet: (sheet: BugSheet) => void;
  searchQuery?: string;
  trashCount?: number;
  sheetTrashMap?: Record<string, { folder: number; sheet: number }>;
}

function FolderNode({
  folder,
  isOpen,
  isFolderSelected,
  selectedSheetId,
  onToggle,
  onSelectFolder,
  onSelectSheet,
  onEdit,
  onAddSheet,
  onEditSheet,
  searchQuery,
  trashCount = 0,
  sheetTrashMap = {},
}: FolderNodeProps) {
  const { data: sheets, isLoading } = useBugSheets(isOpen || !!searchQuery ? folder.id : null);
  const deleteFolder = useDeleteBugFolder();
  const archiveFolder = useArchiveFolder();
  const { canCreateBug, canUpdateBug, canDeleteBug } = usePermission();

  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
  });

  const sheetCount = folder._count?.sheets ?? 0;
  const completedCount = folder._count?.completedSheets ?? 0;
  const folderCompleted = sheetCount > 0 && completedCount === sheetCount;

  return (
    <div ref={setNodeRef} className={isOver ? "hb-folder-drop-target" : ""}>
      <div
        className={`hb-row ${isFolderSelected ? "active" : ""}`}
        onClick={onSelectFolder}
        role="button"
      >
        <button
          className="hb-chev"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label="Toggle folder"
        >
          <ChevronRight
            size={12}
            style={{
              transition: "transform 120ms ease",
              transform: isOpen ? "rotate(90deg)" : "none",
            }}
          />
        </button>
        {isOpen ? (
          <FolderOpen size={15} style={{ color: folder.color || "#7aa2f7" }} />
        ) : (
          <Folder size={15} style={{ color: folder.color || "#7aa2f7" }} />
        )}
        <Tooltip
          title={<CollectionTip folder={folder} trashCount={trashCount} />}
          placement="right"
          mouseEnterDelay={0.35}
          overlayClassName="hb-cardtip"
          align={{ offset: [10, 0] }}
        >
          <span
            className="hb-row-label"
            style={{ color: folderCompleted ? "var(--hb-success)" : undefined }}
          >
            {folder.name}
          </span>
        </Tooltip>
        <span className="hb-row-count">
          {Math.max(0, (folder._count?.bugs ?? 0) - trashCount)}
        </span>
        {(canCreateBug || canUpdateBug || canDeleteBug) && (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                { key: "add-sheet", label: "Add sheet", disabled: !canCreateBug },
                { key: "edit", label: "Edit", disabled: !canUpdateBug },
                { type: "divider" },
                { key: "archive", label: "Move to Archive", disabled: !canDeleteBug },
                { key: "delete", label: "Move to Trash", danger: true, disabled: !canDeleteBug },
              ],
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                if (key === "add-sheet") onAddSheet();
                if (key === "edit") onEdit();
                if (key === "archive") archiveFolder.mutate(folder.id);
                if (key === "delete") deleteFolder.mutate(folder.id);
              },
            }}
          >
            <button
              className="hb-icon-btn hb-row-action"
              onClick={(e) => e.stopPropagation()}
              aria-label="Folder actions"
            >
              <MoreHorizontal size={13} />
            </button>
          </Dropdown>
        )}
      </div>

      {isOpen && (
        <div className="hb-sheets">
          {isLoading ? (
            <div style={{ padding: "4px 12px 4px 32px" }}>
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            </div>
          ) : !sheets || sheets.length === 0 ? (
            canCreateBug ? (
              <button className="hb-row hb-row-sub hb-row-muted" onClick={onAddSheet}>
                <Plus size={12} />
                <span className="hb-row-label">Add sheet</span>
              </button>
            ) : null
          ) : (
            sheets
              .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((s) => (
                <SheetNode
                  key={s.id}
                  sheet={s}
                  selectedSheetId={selectedSheetId}
                  onSelectSheet={onSelectSheet}
                  onEditSheet={onEditSheet}
                  trashCount={sheetTrashMap[s.id]?.sheet || 0}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
}

function SheetNode({
  sheet,
  selectedSheetId,
  onSelectSheet,
  onEditSheet,
  trashCount = 0,
}: {
  sheet: BugSheet;
  selectedSheetId: string | null;
  onSelectSheet: (id: string) => void;
  onEditSheet: (s: BugSheet) => void;
  trashCount?: number;
}) {
  const deleteSheet = useDeleteBugSheet();
  const updateSheetStatus = useUpdateBugSheetStatus();
  const { canUpdateBug, canDeleteBug, canRestoreBugArchive } = usePermission();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: sheet.id,
    data: { folderId: sheet.folderId },
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 100,
    }
    : undefined;

  const status: BugSheetStatus = sheet.status ?? "active";
  const isCurrent = status === "current";
  const isCompleted = status === "completed";
  const isArchived = status === "archived";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`hb-row hb-row-sub ${selectedSheetId === sheet.id ? "active" : ""
        } ${isCompleted ? "hb-row-completed" : ""} ${isArchived ? "hb-row-archived" : ""} ${isDragging ? "dragging" : ""}`}
      onClick={() => !isArchived && onSelectSheet(sheet.id)}
      role="button"
    >
      <SheetStatusIcon status={status} />
      <span className="hb-row-label">{sheet.name}</span>
      <span className="hb-row-count">
        {Math.max(0, (sheet._count?.bugs ?? 0) - trashCount)}
      </span>
      {(canUpdateBug || canDeleteBug) && (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              ...(isArchived ? [{
                key: "toggle-archived",
                label: "Restore from archive",
                disabled: !canRestoreBugArchive
              }] : [
                {
                  key: "toggle-current",
                  label: isCurrent ? "Unmark as current" : "Mark as current",
                },
                {
                  key: "toggle-completed",
                  label: isCompleted ? "Reopen sheet" : "Mark as completed",
                },
                ...(isCompleted ? [{
                  key: "toggle-archived",
                  label: "Move to archive",
                  disabled: !canDeleteBug
                }] : []),
              ]),
              { type: "divider" },
              { key: "edit", label: "Edit", disabled: isArchived || !canUpdateBug },
              { type: "divider" },
              { key: "delete", label: "Move to Trash", danger: true, disabled: !canDeleteBug },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === "toggle-current") {
                updateSheetStatus.mutate({
                  id: sheet.id,
                  status: isCurrent ? "active" : "current",
                });
              }
              if (key === "toggle-completed") {
                updateSheetStatus.mutate({
                  id: sheet.id,
                  status: isCompleted ? "active" : "completed",
                });
              }
              if (key === "toggle-archived") {
                updateSheetStatus.mutate({
                  id: sheet.id,
                  status: isArchived ? "active" : "archived",
                });
              }
              if (key === "edit") onEditSheet(sheet);
              if (key === "delete") deleteSheet.mutate(sheet.id);
            },
          }}
        >
          <button
            className="hb-icon-btn hb-row-action"
            onClick={(e) => e.stopPropagation()}
            aria-label="Sheet actions"
          >
            <MoreHorizontal size={12} />
          </button>
        </Dropdown>
      )}
    </div>
  );
}

function SheetStatusIcon({ status }: { status: BugSheetStatus }) {
  if (status === "current") {
    return (
      <Tooltip title="Current sheet">
        <Star
          size={12}
          className="hb-row-status-icon hb-row-status-current"
          fill="currentColor"
          aria-label="Current sheet"
        />
      </Tooltip>
    );
  }
  if (status === "completed") {
    return (
      <Tooltip title="Completed">
        <FileCheck2
          size={12}
          className="hb-row-status-icon hb-row-status-completed"
          aria-label="Completed sheet"
        />
      </Tooltip>
    );
  }
  if (status === "archived") {
    return (
      <Tooltip title="Archived">
        <Archive
          size={12}
          className="hb-row-status-icon hb-row-status-archived"
          aria-label="Archived sheet"
        />
      </Tooltip>
    );
  }
  return <FileText size={12} style={{ color: "#9aa1ac" }} />;
}

