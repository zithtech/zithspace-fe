"use client";

import React, { useState } from "react";
import { Skeleton, Avatar, Popconfirm, Tooltip, Empty, Tag } from "antd";
import {
  Archive,
  RotateCcw,
  Trash2,
  FolderOpen,
  Bug as BugIcon,
  Clock,
  CalendarDays,
  Eye,
  Layers,
  Folder,
  ArrowLeft,
} from "lucide-react";
import {
  useArchivedSheets,
  useUpdateBugSheetStatus,
  useDeleteBugSheet,
  useArchivedFolders,
  useRestoreFolder,
  useDeleteBugFolder,
  useBugs,
  useRestoreBug,
  useDeleteBug,
  useBulkRestoreBugs,
  useBulkDeleteBugs,
} from "@/hooks/useBugList";
import type { BugSheet, BugFolder } from "@/services/bugListService";
import { hivebugStyles } from "./hivebug-styles";

// ─── helpers ────────────────────────────────────────────────────────────────

const initials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
  return parts[0].slice(0, 2).toUpperCase();
};

const avatarColor = (id: string) => {
  const colors = [
    "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7",
    "#74b9ff", "#a29bfe", "#6c5ce7", "#fd79a8", "#fdcb6e",
    "#e17055", "#00b894", "#00cec9", "#0984e3",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatRelative = (date: string) => {
  if (!date) return "unknown";
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const plural = (count: number, label: string) =>
  `${count} ${count === 1 ? label : label + "s"}`;

const formatBreakdown = (folders: number, sheets: number, bugs: number) => {
  const parts = [];
  if (folders > 0) parts.push(plural(folders, "folder"));
  if (sheets > 0) parts.push(plural(sheets, "sheet"));
  if (bugs > 0) parts.push(plural(bugs, "bug"));
  if (parts.length === 0) return "";
  return ` (${parts.join(", ")})`;
};

// ─── types ───────────────────────────────────────────────────────────────────

interface ArchiveViewProps {
  selectedSheetId: string | null;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  activeTab: "folders" | "sheets" | "bugs";
  onTabChange: (tab: "folders" | "sheets" | "bugs") => void;
  onSelectSheet: (sheetId: string | null) => void;
  onSelectBug?: (bug: (any)) => void;
  searchQuery?: string;
}

type SheetWithMeta = BugSheet & {
  folderName?: string;
  createdBy?: { id: string; name: string; email: string; avatarUrl?: string } | null;
};

type FolderWithMeta = BugFolder & {
  createdBy?: { id: string; name: string; email: string; avatarUrl?: string } | null;
};

// ─── main component ──────────────────────────────────────────────────────────

export default function ArchiveView({
  selectedSheetId,
  selectedFolderId,
  onSelectFolder,
  activeTab,
  onTabChange,
  onSelectSheet,
  onSelectBug,
  searchQuery = "",
}: ArchiveViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = ids.every(id => next.has(id));
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const { data: archivedFolders, isLoading: loadingFolders } = useArchivedFolders();
  const { data: archivedSheets, isLoading: loadingSheets } = useArchivedSheets(selectedFolderId || undefined);
  const { data: archivedBugsData, isLoading: loadingBugs } = useBugs({
    scope: "archived",
    folderId: selectedFolderId || undefined
  });
  const archivedBugs = archivedBugsData?.bugs || [];

  const restoreFolder = useRestoreFolder();
  const deleteFolder = useDeleteBugFolder();
  const updateSheetStatus = useUpdateBugSheetStatus();
  const deleteSheet = useDeleteBugSheet();
  const restoreBug = useRestoreBug();
  const deleteBug = useDeleteBug();

  const bulkRestore = useBulkRestoreBugs();
  const bulkDelete = useBulkDeleteBugs();

  const isLoading = loadingFolders || loadingSheets || loadingBugs;

  const q = searchQuery.toLowerCase().trim();
  const baseFolders = selectedFolderId ? archivedFolders?.filter(f => f.id === selectedFolderId) : archivedFolders;
  const filteredFolders = q ? baseFolders?.filter(f => f.name?.toLowerCase().includes(q)) : baseFolders;
  const filteredSheets = q ? archivedSheets?.filter(s => (s.name as string)?.toLowerCase().includes(q)) : archivedSheets;
  const filteredBugs = q ? archivedBugs.filter(b => b.title?.toLowerCase().includes(q)) : archivedBugs;

  const selectedFolderName = archivedFolders?.find(f => f.id === selectedFolderId)?.name;

  const totalItems = (filteredFolders?.length || 0) + (filteredSheets?.length || 0) + filteredBugs.length;

  const currentItems = activeTab === "folders" ? filteredFolders : activeTab === "sheets" ? filteredSheets : filteredBugs;
  const currentIds = (currentItems || []).map((i: any) => i.id);
  const isAllSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.has(id));

  // Auto-switch tabs based on search matches
  React.useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return;

    // Count matches in each tab
    const bugMatches = archivedBugs.filter(b => b.title?.toLowerCase().includes(q)).length;
    const folderMatches = archivedFolders?.filter(f => f.name?.toLowerCase().includes(q)).length ?? 0;
    const sheetMatches = archivedSheets?.filter(s => (s.name as string)?.toLowerCase().includes(q)).length ?? 0;

    // Get matches for the current tab
    const currentMatches = activeTab === "folders" ? folderMatches : activeTab === "sheets" ? sheetMatches : bugMatches;

    // If current tab has no matches, but other tabs do, auto-switch to the tab with matches
    if (currentMatches === 0) {
      if (bugMatches > 0) {
        onTabChange("bugs");
      } else if (sheetMatches > 0) {
        onTabChange("sheets");
      } else if (folderMatches > 0) {
        onTabChange("folders");
      }
    }
  }, [searchQuery, archivedBugs, archivedFolders, archivedSheets, activeTab, onTabChange]);

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <style>{hivebugStyles}</style>
        <div className="arc-header">
          <div className="arc-header-icon arc-header-icon-archive"><Archive size={16} /></div>
          <div>
            <div className="arc-header-title">Archive</div>
            <div className="arc-header-sub">Loading archived items…</div>
          </div>
        </div>
        <div className="arc-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="arc-card arc-card-skeleton">
              <Skeleton active paragraph={{ rows: 3 }} title={false} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="archive-view-container">
      <style>{hivebugStyles}</style>

      {/* ── header ── */}
      <div className="arc-header">
        <div className="arc-header-icon arc-header-icon-archive" onClick={() => selectedFolderId && onSelectFolder(null)} style={{ cursor: selectedFolderId ? 'pointer' : 'default' }}>
          {selectedFolderId ? <ArrowLeft size={16} /> : <Archive size={16} />}
        </div>
        <div>
          <div className="arc-header-title">
            {selectedFolderId ? `Folder: ${selectedFolderName}` : "Archive"}
          </div>
          <div className="arc-header-sub">
            {selectedFolderId
              ? `${filteredSheets?.length || 0} sheets in this folder`
              : `${plural(totalItems, "item")} archived${formatBreakdown(archivedFolders?.length || 0, filteredSheets?.length || 0, archivedBugs.length)}`
            }
          </div>
        </div>

        {totalItems > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--hb-text-muted)' }}>
              {isAllSelected ? "Deselect all" : "Select all"}
            </span>
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => selectAll(currentIds)}
              style={{ width: 16, height: 16, accentColor: 'var(--hb-accent)', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      {/* ── tabs ── */}
      {!selectedFolderId && (
        <div className="trash-tabs">
          <button
            className={`trash-tab ${activeTab === "folders" ? "active" : ""}`}
            onClick={() => onTabChange("folders")}
          >
            <Folder size={14} />
            Folders
            <span className="count-badge">{archivedFolders?.length || 0}</span>
          </button>
          <button
            className={`trash-tab ${activeTab === "sheets" ? "active" : ""}`}
            onClick={() => onTabChange("sheets")}
          >
            <Layers size={14} />
            Sheets
            <span className="count-badge">{filteredSheets?.length || 0}</span>
          </button>
          <button
            className={`trash-tab ${activeTab === "bugs" ? "active" : ""}`}
            onClick={() => onTabChange("bugs")}
          >
            <BugIcon size={14} />
            Standalone Bugs
            <span className="count-badge">{archivedBugs.length}</span>
          </button>
        </div>
      )}

      {/* ── bulk bar ── */}
      {selectedIds.size > 0 && (
        <div className="hb-bulkbar" style={{ margin: "0 0 12px 0" }}>
          <span>{selectedIds.size} selected</span>
          <div className="hb-bulkbar-actions">
            <button
              className="hb-btn hb-btn-primary"
              onClick={() => {
                bulkRestore.mutate(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
            >
              <RotateCcw size={13} />
              Restore Selected
            </button>
            <Popconfirm
              title={`Move ${selectedIds.size} items to trash?`}
              onConfirm={() => {
                bulkDelete.mutate(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
            >
              <button className="hb-btn hb-btn-danger">
                <Trash2 size={13} />
                Move to Trash
              </button>
            </Popconfirm>
          </div>
        </div>
      )}

      <div className="trash-content">
        {(activeTab === "folders" || selectedFolderId) && !selectedFolderId && (
          <div className="arc-grid">
            {(!filteredFolders || filteredFolders.length === 0) ? (
              <EmptyArchive title="No archived folders" />
            ) : (
              filteredFolders.map((f) => (
                <ArchivedFolderCard
                  key={f.id}
                  folder={f as FolderWithMeta}
                  isSelected={selectedIds.has(f.id)}
                  onSelect={() => toggleSelect(f.id)}
                  onView={() => {
                    onSelectFolder(f.id);
                    onTabChange("sheets");
                  }}
                  onRestore={() => restoreFolder.mutate(f.id)}
                  onDelete={() => deleteFolder.mutate(f.id)}
                />
              ))
            )}
          </div>
        )}

        {(activeTab === "sheets" || selectedFolderId) && (
          <div className="arc-grid">
            {(!filteredSheets || filteredSheets.length === 0) ? (
              <EmptyArchive title={selectedFolderId ? "No sheets in this folder" : "No archived sheets"} />
            ) : (
              filteredSheets.map((s) => (
                <ArchivedSheetCard
                  key={s.id}
                  sheet={s as SheetWithMeta}
                  isSelected={selectedIds.has(s.id)}
                  onSelect={() => toggleSelect(s.id)}
                  isCurrent={selectedSheetId === s.id}
                  isNestedInFolder={!!selectedFolderId}
                  onView={() => onSelectSheet(s.id)}
                  onRestore={() => {
                    updateSheetStatus.mutate({ id: s.id, status: "active" });
                    onSelectSheet(null);
                  }}
                  onDelete={() => {
                    deleteSheet.mutate(s.id);
                    onSelectSheet(null);
                  }}
                />
              ))
            )}
          </div>
        )}
        {activeTab === "bugs" && (
          <div className="arc-grid">
            {filteredBugs.length === 0 ? (
              <EmptyArchive title={selectedFolderId ? "No bugs in this folder" : "No archived bugs"} />
            ) : (
              filteredBugs.map((b: any) => (
                <ArchivedBugCard
                  key={b.id}
                  bug={b}
                  isSelected={selectedIds.has(b.id)}
                  onSelect={() => toggleSelect(b.id)}
                  onView={() => onSelectBug?.(b)}
                  isNestedInSheet={!!selectedSheetId}
                  isNestedInFolder={!!selectedFolderId}
                  onRestore={() => {
                    restoreBug.mutate(b.id);
                    setSelectedIds(new Set());
                  }}
                  onDelete={() => {
                    deleteBug.mutate(b.id);
                    setSelectedIds(new Set());
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── components ──────────────────────────────────────────────────────────────

function EmptyArchive({ title }: { title: string }) {
  return (
    <div className="arc-empty-wrap" style={{ gridColumn: "1 / -1" }}>
      <div className="arc-empty-icon"><Archive size={32} /></div>
      <div className="arc-empty-title">{title}</div>
      <div className="arc-empty-sub">Archived items are kept safe and out of your active workspace.</div>
    </div>
  );
}

function ArchivedFolderCard({ folder, isSelected, onSelect, onView, onRestore, onDelete }: { folder: FolderWithMeta, isSelected: boolean, onSelect: () => void, onView: () => void, onRestore: () => void, onDelete: () => void }) {
  const creatorName = folder.createdBy?.name || "Unknown";
  const sheetCount = folder._count?.sheets || 0;

  return (
    <div className={`arc-card ${isSelected ? "arc-card-bulk-selected" : ""}`} onClick={onView}>
      <div className="arc-card-top" style={{ flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => {
              e.stopPropagation();
              onSelect();
            }}
            onClick={e => e.stopPropagation()}
            style={{ width: 14, height: 14, accentColor: '#3b82f6', flexShrink: 0 }}
          />
          <div className="arc-card-avatar" style={{ background: `linear-gradient(135deg, ${folder.color || '#3b82f6'} 0%, ${folder.color || '#1d4ed8'} 100%)` }}>
            <FolderOpen size={14} />
          </div>
          <div className="arc-card-name" style={{ flex: 1 }}>{folder.name}</div>
          <span className="arc-badge-bugs"><Layers size={10} /> {sheetCount} sheets</span>
        </div>
        <div className="arc-card-desc">{folder.description || "No description"}</div>
      </div>
      <div className="arc-card-foot">
        <div className="arc-foot-row">
          <span className="arc-foot-item">
            <span className="arc-foot-key">Creator:</span>
            <Avatar size={16} style={{ background: avatarColor(folder.id), fontSize: 8 }}>{initials(creatorName)}</Avatar>
            <span className="arc-foot-val">{creatorName}</span>
          </span>
          <span className="arc-foot-div" />
          <span className="arc-foot-item">
            <span className="arc-foot-key">Archived:</span>
            <Tooltip title={formatDate(folder.updatedAt)}>
              <span className="arc-foot-val">{formatRelative(folder.updatedAt)}</span>
            </Tooltip>
          </span>
        </div>
        <div className="arc-foot-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="arc-action-btn arc-action-view" onClick={onView}><Eye size={12} /> View Content</button>
            <button className="arc-action-btn arc-action-restore" onClick={(e) => { e.stopPropagation(); onRestore(); }}>
              <RotateCcw size={12} /> Restore
            </button>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Popconfirm
              title="Move to Trash"
              description="This folder will be moved to trash."
              okText="Move to Trash"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              onConfirm={onDelete}
            >
              <button className="arc-action-btn arc-action-delete"><Trash2 size={12} /></button>
            </Popconfirm>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchivedSheetCard({ sheet, isSelected, onSelect, isCurrent, onView, onRestore, onDelete, isNestedInFolder }: any) {
  const creatorName = sheet.createdBy?.name || "Unknown";
  const creatorId = sheet.createdBy?.id || sheet.createdById || "x";
  const bugCount = sheet._count?.bugs ?? 0;
  const restoreTooltip = isNestedInFolder ? "First restore folder" : "";

  return (
    <div className={`arc-card ${isCurrent ? "arc-card-selected" : ""} ${isSelected ? "arc-card-bulk-selected" : ""}`} onClick={onView}>
      <div className="arc-card-top" style={{ flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => {
              e.stopPropagation();
              onSelect();
            }}
            onClick={e => e.stopPropagation()}
            style={{ width: 14, height: 14, accentColor: '#3b82f6', flexShrink: 0 }}
          />
          <div className="arc-card-avatar" style={{ background: `linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)` }}>
            <Layers size={14} />
          </div>
          <div className="arc-card-name" style={{ flex: 1 }}>{sheet.name}</div>
          <span className="arc-badge-bugs"><BugIcon size={10} /> {bugCount} bugs</span>
        </div>
        <div className="arc-card-folder"><FolderOpen size={11} /> <span>{sheet.folderName}</span></div>
      </div>
      <div className="arc-card-foot">
        <div className="arc-foot-row">
          <span className="arc-foot-item">
            <span className="arc-foot-key">Creator:</span>
            <Avatar size={16} src={sheet.createdBy?.avatarUrl} style={{ background: avatarColor(creatorId), fontSize: 8 }}>{initials(creatorName)}</Avatar>
            <span className="arc-foot-val">{creatorName}</span>
          </span>
          <span className="arc-foot-div" />
          <span className="arc-foot-item">
            <span className="arc-foot-key">Created:</span>
            <Tooltip title={formatDate(sheet.createdAt)}>
              <span className="arc-foot-val">{formatRelative(sheet.createdAt)}</span>
            </Tooltip>
          </span>
          <span className="arc-foot-div" />
          <span className="arc-foot-item">
            <span className="arc-foot-key">Archived:</span>
            <Tooltip title={formatDate(sheet.updatedAt)}>
              <span className="arc-foot-val">{formatRelative(sheet.updatedAt)}</span>
            </Tooltip>
          </span>
        </div>
        <div className="arc-foot-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="arc-action-btn arc-action-view" onClick={onView}><Eye size={12} /> View</button>
            <Tooltip title={restoreTooltip}>
              <button 
                className="arc-action-btn arc-action-restore" 
                onClick={(e) => { e.stopPropagation(); onRestore(); }}
                disabled={!!restoreTooltip}
              >
                <RotateCcw size={12} /> Restore
              </button>
            </Tooltip>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Popconfirm
              title="Move to Trash"
              description="This sheet will be moved to trash."
              okText="Move to Trash"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              onConfirm={onDelete}
            >
              <button className="arc-action-btn arc-action-delete"><Trash2 size={12} /></button>
            </Popconfirm>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchivedBugCard({ bug, isSelected, onSelect, onView, onRestore, onDelete, isNestedInSheet, isNestedInFolder }: any) {
  const restoreTooltip = isNestedInFolder ? "First restore folder" : isNestedInSheet ? "First restore sheet" : "";

  return (
    <div 
      className={`arc-card ${isSelected ? "arc-card-bulk-selected" : ""}`}
      style={{ cursor: "default" }}
    >
      <div className="arc-card-top" style={{ flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => {
              e.stopPropagation();
              onSelect();
            }}
            onClick={e => e.stopPropagation()}
            style={{ width: 14, height: 14, accentColor: '#3b82f6', flexShrink: 0 }}
          />
          <div className="arc-card-avatar" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
            <BugIcon size={14} />
          </div>
          <div className="arc-card-name" style={{ flex: 1 }}>{bug.title || "No Title"}</div>
        </div>
        <div className="arc-card-desc">{bug.description}</div>
      </div>
      <div className="arc-card-foot">
        <div className="arc-foot-row">
          <span className="arc-foot-item">
            <span className="arc-foot-key">Severity:</span>
            <span className="arc-foot-val">{bug.severity}</span>
          </span>
          <span className="arc-foot-div" />
          <span className="arc-foot-item">
            <span className="arc-foot-key">Archived:</span>
            <Tooltip title={formatDate(bug.updatedAt)}>
              <span className="arc-foot-val">{formatRelative(bug.updatedAt)}</span>
            </Tooltip>
          </span>
        </div>
        <div className="arc-foot-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Tooltip title={restoreTooltip}>
            <button 
              className="arc-action-btn arc-action-restore" 
              onClick={onRestore} 
              disabled={!!restoreTooltip}
            >
              <RotateCcw size={12} /> Restore Bug
            </button>
          </Tooltip>
          <Popconfirm
            title="Move to Trash"
            description="This bug will be moved to trash."
            okText="Move to Trash"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            onConfirm={onDelete}
          >
            <button className="arc-action-btn arc-action-delete"><Trash2 size={12} /></button>
          </Popconfirm>
        </div>
      </div>
    </div>
  );
}
