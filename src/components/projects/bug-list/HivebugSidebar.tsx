"use client";

import React, { useMemo, useState } from "react";
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
  MoreHorizontal,
  LayoutGrid,
  Library,
  CheckCircle2,
  Star,
  Trash2,
  Archive,
} from "lucide-react";
import { Dropdown, Skeleton, Tooltip } from "antd";
import {
  useBugFolders,
  useBugSheets,
  useBugStats,
  useDeleteBugFolder,
  useArchiveFolder,
  useDeleteBugSheet,
  useUpdateBugSheetStatus,
} from "@/hooks/useBugList";
import type {
  BugFolder,
  BugSheet,
  BugSheetStatus,
} from "@/services/bugListService";

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
}: HivebugSidebarProps) {
  const { data: folders, isLoading: foldersLoading } = useBugFolders();
  const stats = useBugStats({
    folderId: selectedFolderId || undefined,
    sheetId: selectedSheetId || undefined,
    scope,
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const totalAll = useMemo(
    () => folders?.reduce((acc, f) => acc + (f._count?.bugs || 0), 0) || 0,
    [folders]
  );

  return (
    <aside className="hb-sidebar">
      <div className="hb-brand">
        <div className="hb-brand-icon">
          <Bug size={18} />
        </div>
        <div className="hb-brand-text">
          <div className="hb-brand-name">Hivebug</div>
          <div className="hb-brand-sub">QA WORKSPACE</div>
        </div>
      </div>

      <div className="hb-section">
        <div className="hb-section-title">
          <span className="hb-section-title-text">
            <LayoutGrid size={11} className="hb-section-title-icon" />
            <span>WORKSPACE</span>
          </span>
        </div>
        <button
          className={`hb-row ${
            scope === "all" && !selectedFolderId && !selectedSheetId ? "active" : ""
          }`}
          onClick={() => {
            onScopeChange("all");
            onSelect(null, null);
          }}
        >
          <Inbox size={15} />
          <span className="hb-row-label">All Bugs</span>
          <span className="hb-row-count">{totalAll}</span>
        </button>
        <button
          className={`hb-row ${scope === "mine" ? "active" : ""}`}
          onClick={() => {
            onScopeChange("mine");
            onSelect(null, null);
          }}
        >
          <User size={15} />
          <span className="hb-row-label">My Bugs</span>
          <span className="hb-row-count">
            {stats.data && scope === "mine" ? stats.data.total : ""}
          </span>
        </button>
        <button
          className={`hb-row ${scope === "trash" ? "active" : ""}`}
          onClick={() => {
            onScopeChange("trash");
            onSelect(null, null);
          }}
        >
          <Trash2 size={15} />
          <span className="hb-row-label">Trash</span>
          <span className="hb-row-count">
            {stats.data && scope === "trash" ? stats.data.total : ""}
          </span>
        </button>
        <button
          className={`hb-row ${scope === "archived" ? "active" : ""}`}
          onClick={() => {
            onScopeChange("archived");
            onSelect(null, null);
          }}
        >
          <Archive size={15} />
          <span className="hb-row-label">Archived</span>
          <span className="hb-row-count">
            {stats.data && scope === "archived" ? stats.data.total : ""}
          </span>
        </button>
      </div>

      
      <div className="hb-section hb-section-grow">
        <div className="hb-section-title">
          <span className="hb-section-title-text">
            <Library size={11} className="hb-section-title-icon" />
            <span>COLLECTIONS</span>
          </span>
          <button className="hb-icon-btn" onClick={onCreateFolder} aria-label="New folder">
            <Plus size={13} />
          </button>
        </div>
        <div className="hb-collections">
          {foldersLoading ? (
            <div style={{ padding: 12 }}>
              <Skeleton active paragraph={{ rows: 4 }} title={false} />
            </div>
          ) : !folders || folders.length === 0 ? (
            <button className="hb-row hb-row-muted" onClick={onCreateFolder}>
              <Plus size={13} />
              <span className="hb-row-label">New collection</span>
            </button>
          ) : (
            folders.map((folder) => (
              <FolderNode
                key={folder.id}
                folder={folder}
                isOpen={!!expanded[folder.id]}
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
              />
            ))
          )}
        </div>
      </div>

     
    </aside>
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
}: FolderNodeProps) {
  const { data: sheets, isLoading } = useBugSheets(isOpen ? folder.id : null);
  const deleteFolder = useDeleteBugFolder();
  const archiveFolder = useArchiveFolder();
  const deleteSheet = useDeleteBugSheet();
  const updateSheetStatus = useUpdateBugSheetStatus();

  const sheetCount = folder._count?.sheets ?? 0;
  const completedCount = folder._count?.completedSheets ?? 0;
  const folderCompleted = sheetCount > 0 && completedCount === sheetCount;

  return (
    <div>
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
        <span className="hb-row-label">{folder.name}</span>
        {folderCompleted && (
          <Tooltip title="All sheets completed">
            <CheckCircle2
              size={12}
              className="hb-row-status-icon hb-row-status-completed"
              aria-label="All sheets completed"
            />
          </Tooltip>
        )}
        <span className="hb-row-count">{folder._count?.bugs ?? 0}</span>
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "add-sheet", label: "Add sheet" },
              { key: "edit", label: "Edit" },
              { type: "divider" },
              { key: "archive", label: "Move to Archive" },
              { key: "delete", label: "Move to Trash", danger: true },
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
      </div>

      {isOpen && (
        <div className="hb-sheets">
          {isLoading ? (
            <div style={{ padding: "4px 12px 4px 32px" }}>
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            </div>
          ) : !sheets || sheets.length === 0 ? (
            <button className="hb-row hb-row-sub hb-row-muted" onClick={onAddSheet}>
              <Plus size={12} />
              <span className="hb-row-label">Add sheet</span>
            </button>
          ) : (
            sheets.map((s) => {
              const status: BugSheetStatus = s.status ?? "active";
              const isCurrent = status === "current";
              const isCompleted = status === "completed";
              const isArchived = status === "archived";
              return (
                <div
                  key={s.id}
                  className={`hb-row hb-row-sub ${
                    selectedSheetId === s.id ? "active" : ""
                  } ${isCompleted ? "hb-row-completed" : ""} ${isArchived ? "hb-row-archived" : ""}`}
                  onClick={() => !isArchived && onSelectSheet(s.id)}
                  role="button"
                  style={{ opacity: isArchived ? 0.6 : 1 }}
                >
                  <SheetStatusIcon status={status} />
                  <span className="hb-row-label">{s.name}</span>
                  <span className="hb-row-count">{s._count?.bugs ?? 0}</span>
                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: [
                        ...(isArchived ? [{
                          key: "toggle-archived",
                          label: "Restore from archive",
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
                          }] : []),
                        ]),
                        { type: "divider" },
                        { key: "edit", label: "Edit", disabled: isArchived },
                        { type: "divider" },
                        { key: "delete", label: "Move to Trash", danger: true },
                      ],
                      onClick: ({ key, domEvent }) => {
                        domEvent.stopPropagation();
                        if (key === "toggle-current") {
                          updateSheetStatus.mutate({
                            id: s.id,
                            status: isCurrent ? "active" : "current",
                          });
                        }
                        if (key === "toggle-completed") {
                          updateSheetStatus.mutate({
                            id: s.id,
                            status: isCompleted ? "active" : "completed",
                          });
                        }
                        if (key === "toggle-archived") {
                          updateSheetStatus.mutate({
                            id: s.id,
                            status: isArchived ? "active" : "archived",
                          });
                        }
                        if (key === "edit") onEditSheet(s);
                        if (key === "delete") deleteSheet.mutate(s.id);
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
                </div>
              );
            })
          )}
        </div>
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

