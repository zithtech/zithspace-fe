"use client";

import React, { useState } from "react";
import { Skeleton, Avatar, Popconfirm, Tooltip, Empty, Tag, Segmented } from "antd";
import {
  Trash2,
  RotateCcw,
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
  useTrashedSheets,
  useRestoreSheet,
  usePermanentDeleteSheet,
  useTrashedFolders,
  useRestoreFolder,
  usePermanentDeleteFolder,
  useBugs,
  useRestoreBug,
  usePermanentDeleteBug,
  useBulkRestoreBugs,
  useBulkPermanentDeleteBugs,
  useBulkRestoreFolders,
  useBulkPermanentDeleteFolders,
  useBulkRestoreSheets,
  useBulkPermanentDeleteSheets,
} from "@/hooks/useBugList";
import type { BugSheet, BugFolder, BugListItem } from "@/services/bugListService";
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

interface TrashViewProps {
  selectedSheetId: string | null;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  activeTab: "folders" | "sheets" | "bugs";
  onTabChange: (tab: "folders" | "sheets" | "bugs") => void;
  onSelectSheet: (sheetId: string | null) => void;
  onSelectBug?: (bug: BugListItem) => void;
}

type SheetWithMeta = BugSheet & {
  folderName?: string;
  createdBy?: { id: string; name: string; email: string; avatarUrl?: string } | null;
};

type FolderWithMeta = BugFolder & {
  createdBy?: { id: string; name: string; email: string; avatarUrl?: string } | null;
};

// ─── main component ──────────────────────────────────────────────────────────

export default function TrashView({
  selectedSheetId,
  selectedFolderId,
  onSelectFolder,
  activeTab,
  onTabChange,
  onSelectSheet,
  onSelectBug,
}: TrashViewProps) {
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

  const { data: trashedFolders, isLoading: loadingFolders } = useTrashedFolders();
  const { data: trashedSheets, isLoading: loadingSheets } = useTrashedSheets(selectedFolderId || undefined);
  const { data: trashedBugsData, isLoading: loadingBugs } = useBugs({
    scope: "trash",
    folderId: selectedFolderId || undefined
  });
  const trashedBugs = trashedBugsData?.bugs || [];

  const restoreFolder = useRestoreFolder();
  const deleteFolder = usePermanentDeleteFolder();
  const restoreSheet = useRestoreSheet();
  const deleteSheet = usePermanentDeleteSheet();
  const restoreBug = useRestoreBug();
  const deleteBug = usePermanentDeleteBug();

  const bulkRestoreBugs = useBulkRestoreBugs();
  const bulkDeleteBugs = useBulkPermanentDeleteBugs();
  const bulkRestoreFolders = useBulkRestoreFolders();
  const bulkDeleteFolders = useBulkPermanentDeleteFolders();
  const bulkRestoreSheets = useBulkRestoreSheets();
  const bulkDeleteSheets = useBulkPermanentDeleteSheets();

  const isLoading = loadingFolders || loadingSheets || loadingBugs;

  // The hooks now return the correct items (standalone if no folderId, folder contents if folderId)
  const filteredFolders = selectedFolderId ? trashedFolders?.filter(f => f.id === selectedFolderId) : trashedFolders;
  const filteredSheets = trashedSheets;
  const filteredBugs = trashedBugs;

  const selectedFolderName = trashedFolders?.find(f => f.id === selectedFolderId)?.name;

  const totalItems = (filteredFolders?.length || 0) + (filteredSheets?.length || 0) + filteredBugs.length;

  const currentItems = activeTab === "folders" ? filteredFolders : activeTab === "sheets" ? filteredSheets : filteredBugs;
  const currentIds = (currentItems || []).map((i: any) => i.id);
  const isAllSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.has(id));

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <style>{hivebugStyles}</style>
        <div className="arc-header">
          <div className="arc-header-icon"><Trash2 size={16} /></div>
          <div>
            <div className="arc-header-title">Trash</div>
            <div className="arc-header-sub">Loading trashed items…</div>
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
    <div className="trash-view-container">
      <style>{hivebugStyles}</style>

      {/* ── header ── */}
      <div className="arc-header">
        <div className="arc-header-icon" onClick={() => selectedFolderId && onSelectFolder(null)} style={{ cursor: selectedFolderId ? 'pointer' : 'default' }}>
          {selectedFolderId ? <ArrowLeft size={16} /> : <Trash2 size={16} />}
        </div>
        <div>
          <div className="arc-header-title">
            {selectedFolderId ? `Folder: ${selectedFolderName}` : "Trash"}
          </div>
          <div className="arc-header-sub">
            {selectedFolderId
              ? `${filteredSheets?.length || 0} sheets in this folder`
              : `${plural(totalItems, "item")} found in trash${formatBreakdown(trashedFolders?.length || 0, filteredSheets?.length || 0, trashedBugs.length)}`
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
            <span className="count-badge">{trashedFolders?.length || 0}</span>
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
            <span className="count-badge">{trashedBugs.length}</span>
          </button>
        </div>
      )}

      {/* ── bulk bar ── */}
      {selectedIds.size > 0 && (
        <div className="hb-bulkbar" style={{ margin: "0 14px 12px 12px" }}>
          <span>{selectedIds.size} selected</span>
          <div className="hb-bulkbar-actions">
            <button
              className="hb-btn hb-btn-primary"
              onClick={() => {
                const ids = Array.from(selectedIds);
                if (activeTab === "folders") bulkRestoreFolders.mutate(ids);
                else if (activeTab === "sheets") bulkRestoreSheets.mutate(ids);
                else bulkRestoreBugs.mutate(ids);
                setSelectedIds(new Set());
              }}
            >
              <RotateCcw size={13} />
              Restore Selected
            </button>
            <Popconfirm
              title={`Permanently delete ${selectedIds.size} items?`}
              onConfirm={() => {
                const ids = Array.from(selectedIds);
                if (activeTab === "folders") bulkDeleteFolders.mutate(ids);
                else if (activeTab === "sheets") bulkDeleteSheets.mutate(ids);
                else bulkDeleteBugs.mutate(ids);
                setSelectedIds(new Set());
              }}
            >
              <button className="hb-btn hb-btn-danger">
                <Trash2 size={13} />
                Delete Permanently
              </button>
            </Popconfirm>
          </div>
        </div>
      )}

      <div className="trash-content">
        {(activeTab === "folders" || selectedFolderId) && !selectedFolderId && (
          <div className="arc-grid">
            {(!filteredFolders || filteredFolders.length === 0) ? (
              <EmptyTrash title="No trashed folders" />
            ) : (
              filteredFolders.map((f) => (
                <TrashedFolderCard
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
              <EmptyTrash title={selectedFolderId ? "No sheets in this folder" : "No trashed sheets"} />
            ) : (
              filteredSheets.map((s) => (
                <TrashedSheetCard 
                  key={s.id} 
                  sheet={s} 
                  isSelected={selectedIds.has(s.id)}
                  onSelect={() => toggleSelect(s.id)}
                  isCurrent={selectedSheetId === s.id}
                  isNestedInFolder={!!selectedFolderId}
                  onView={() => onSelectSheet(s.id)}
                  onRestore={() => {
                    restoreSheet.mutate(s.id);
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
              <EmptyTrash title={selectedFolderId ? "No bugs in this folder" : "No standalone trashed bugs"} />
            ) : (
              filteredBugs.map((b) => (
                <TrashedBugCard
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

function EmptyTrash({ title }: { title: string }) {
  return (
    <div className="arc-empty-wrap" style={{ gridColumn: "1 / -1" }}>
      <div className="arc-empty-icon"><Trash2 size={32} /></div>
      <div className="arc-empty-title">{title}</div>
      <div className="arc-empty-sub">Items you delete will appear here for 30 days before permanent removal.</div>
    </div>
  );
}

function TrashedFolderCard({ folder, isSelected, onSelect, onView, onRestore, onDelete }: { folder: FolderWithMeta, isSelected: boolean, onSelect: () => void, onView: () => void, onRestore: () => void, onDelete: () => void }) {
  const creatorName = folder.createdBy?.name || "Unknown";
  const sheetCount = folder._count?.sheets || 0;
  const bugCount = folder._count?.bugs || 0;

  return (
    <div className={`arc-card ${isSelected ? "arc-card-bulk-selected" : ""}`} onClick={onView}>
      <div className="arc-card-toprow">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => {
              e.stopPropagation();
              onSelect();
            }}
            onClick={e => e.stopPropagation()}
            style={{ width: 14, height: 14, accentColor: 'var(--hb-accent)' }}
          />
          <span className="arc-badge-trashed"><Trash2 size={10} /> Folder</span>
        </div>
        <span className="arc-badge-bugs"><Layers size={10} /> {sheetCount} sheets</span>
      </div>
      <div className="arc-card-name" style={{ color: folder.color || "inherit" }}>{folder.name}</div>
      <div className="arc-card-desc">{folder.description || "No description"}</div>
      <div className="arc-card-footer">
        <div className="arc-card-creator">
          <Avatar size={20} style={{ background: avatarColor(folder.id), fontSize: 9 }}>{initials(creatorName)}</Avatar>
          <span className="arc-card-creator-name">{creatorName}</span>
        </div>
        <div className="arc-card-dates">
          <Tooltip title={`Trashed: ${formatDate(folder.updatedAt)}`}>
            <span className="arc-card-date"><Clock size={10} /> {formatRelative(folder.updatedAt)}</span>
          </Tooltip>
        </div>
      </div>
      <div className="arc-card-actions" onClick={e => e.stopPropagation()}>
        <button className="arc-action-btn arc-action-view" onClick={onView}><Eye size={13} /> View Content</button>
        <button className="arc-action-btn arc-action-restore" onClick={onRestore} style={{ flex: 1 }}>
          <RotateCcw size={13} /> Restore
        </button>
        <Popconfirm title="Delete folder permanently?" onConfirm={onDelete}>
          <button className="arc-action-btn arc-action-delete"><Trash2 size={13} /></button>
        </Popconfirm>
      </div>
    </div>
  );
}

function TrashedSheetCard({ sheet, isSelected, onSelect, isCurrent, onView, onRestore, onDelete, isNestedInFolder }: any) {
  const bugCount = sheet._count?.bugs ?? 0;
  const restoreTooltip = isNestedInFolder ? "First restore folder" : "";

  return (
    <div className={`arc-card ${isCurrent ? "arc-card-selected" : ""} ${isSelected ? "arc-card-bulk-selected" : ""}`} onClick={onView}>
      <div className="arc-card-toprow">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => {
              e.stopPropagation();
              onSelect();
            }}
            onClick={e => e.stopPropagation()}
            style={{ width: 14, height: 14, accentColor: 'var(--hb-accent)' }}
          />
          <span className="arc-badge-trashed"><Trash2 size={10} /> Sheet</span>
        </div>
        <span className="arc-badge-bugs"><BugIcon size={10} /> {bugCount} bugs</span>
      </div>
      <div className="arc-card-name">{sheet.name}</div>
      <div className="arc-card-folder"><FolderOpen size={12} /> {sheet.folderName}</div>
      <div className="arc-card-actions" onClick={e => e.stopPropagation()}>
        <button className="arc-action-btn arc-action-view" onClick={onView}><Eye size={13} /> View</button>
        <Tooltip title={restoreTooltip}>
          <button 
            className="arc-action-btn arc-action-restore" 
            onClick={onRestore}
            disabled={!!restoreTooltip}
          >
            <RotateCcw size={13} /> Restore
          </button>
        </Tooltip>
        <Popconfirm title="Delete sheet permanently?" onConfirm={onDelete}>
          <button className="arc-action-btn arc-action-delete"><Trash2 size={13} /></button>
        </Popconfirm>
      </div>
    </div>
  );
}

function TrashedBugCard({ bug, isSelected, onSelect, onView, onRestore, onDelete, isNestedInSheet, isNestedInFolder }: any) {
  const restoreTooltip = isNestedInFolder ? "First restore folder" : isNestedInSheet ? "First restore sheet" : "";

  return (
    <div className={`arc-card ${isSelected ? "arc-card-bulk-selected" : ""}`} onClick={onView}>
      <div className="arc-card-toprow">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => {
              e.stopPropagation();
              onSelect();
            }}
            onClick={e => e.stopPropagation()}
            style={{ width: 14, height: 14, accentColor: 'var(--hb-accent)' }}
          />
          <span className="arc-badge-trashed"><Trash2 size={10} /> Bug</span>
        </div>
        <Tag color="red" style={{ margin: 0, fontSize: 10 }}>{bug.severity}</Tag>
      </div>
      <div className="arc-card-name" style={{ fontSize: 13 }}>{bug.title || "No Title"}</div>
      <div className="arc-card-desc" style={{ WebkitLineClamp: 2 }}>{bug.description}</div>
      <div className="arc-card-footer">
        <div className="arc-card-dates">
          <span className="arc-card-date"><Clock size={10} /> {formatRelative(bug.updatedAt)}</span>
        </div>
      </div>
      <div className="arc-card-actions" onClick={e => e.stopPropagation()}>
        <Tooltip title={restoreTooltip}>
          <button 
            className="arc-action-btn arc-action-restore" 
            onClick={onRestore} 
            style={{ flex: 1 }}
            disabled={!!restoreTooltip}
          >
            <RotateCcw size={13} /> Restore Bug
          </button>
        </Tooltip>
        <Popconfirm title="Delete bug permanently?" onConfirm={onDelete}>
          <button className="arc-action-btn arc-action-delete"><Trash2 size={13} /></button>
        </Popconfirm>
      </div>
    </div>
  );
}
