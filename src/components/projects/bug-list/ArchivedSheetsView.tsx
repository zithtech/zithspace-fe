"use client";

import React from "react";
import { Skeleton, Avatar, Popconfirm, Tooltip } from "antd";
import {
  Archive,
  RotateCcw,
  Trash2,
  FolderOpen,
  Bug,
  Clock,
  CalendarDays,
  Eye,
} from "lucide-react";
import {
  useArchivedSheets,
  useUpdateBugSheetStatus,
  useDeleteBugSheet,
} from "@/hooks/useBugList";
import type { BugSheet } from "@/services/bugListService";
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
    "#ff6b6b","#4ecdc4","#45b7d1","#96ceb4","#ffeaa7",
    "#74b9ff","#a29bfe","#6c5ce7","#fd79a8","#fdcb6e",
    "#e17055","#00b894","#00cec9","#0984e3",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatRelative = (date: string) => {
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

// ─── types ───────────────────────────────────────────────────────────────────

interface ArchivedSheetsViewProps {
  selectedSheetId: string | null;
  onSelectSheet: (sheetId: string | null) => void;
}

type SheetWithMeta = BugSheet & {
  folderName?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
};

// ─── main component ──────────────────────────────────────────────────────────

export default function ArchivedSheetsView({
  selectedSheetId,
  onSelectSheet,
}: ArchivedSheetsViewProps) {
  const { data: archivedSheets, isLoading } = useArchivedSheets();
  const updateSheetStatus = useUpdateBugSheetStatus();
  const deleteSheet = useDeleteBugSheet();

  if (isLoading) {
    return (
      <>
        <style>{hivebugStyles}</style>
        <div className="arc-header">
          <div className="arc-header-icon">
            <Archive size={16} />
          </div>
          <div>
            <div className="arc-header-title">Archived Sheets</div>
            <div className="arc-header-sub">Loading…</div>
          </div>
        </div>
        <div className="arc-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="arc-card arc-card-skeleton">
              <Skeleton active paragraph={{ rows: 3 }} title={false} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (!archivedSheets || archivedSheets.length === 0) {
    return (
      <>
        <style>{hivebugStyles}</style>
        <div className="arc-empty-wrap">
          <div className="arc-empty-icon">
            <Archive size={36} />
          </div>
          <div className="arc-empty-title">No archived sheets</div>
          <div className="arc-empty-sub">
            When you archive a sheet it will appear here — safe and out of the way.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{hivebugStyles}</style>

      {/* ── section header ── */}
      <div className="arc-header">
        <div className="arc-header-icon">
          <Archive size={16} />
        </div>
        <div>
          <div className="arc-header-title">Archived Sheets</div>
          <div className="arc-header-sub">
            {archivedSheets.length} sheet{archivedSheets.length !== 1 ? "s" : ""} archived
          </div>
        </div>
      </div>

      {/* ── card grid ── */}
      <div className="arc-grid">
        {archivedSheets.map((sheet) => (
          <ArchivedSheetCard
            key={sheet.id}
            sheet={sheet as SheetWithMeta}
            isSelected={selectedSheetId === sheet.id}
            onView={() => onSelectSheet(sheet.id)}
            onRestore={() =>
              updateSheetStatus.mutate({ id: sheet.id, status: "active" })
            }
            onDelete={() => deleteSheet.mutate(sheet.id)}
          />
        ))}
      </div>
    </>
  );
}

// ─── card ────────────────────────────────────────────────────────────────────

interface CardProps {
  sheet: SheetWithMeta;
  isSelected: boolean;
  onView: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

function ArchivedSheetCard({
  sheet,
  isSelected,
  onView,
  onRestore,
  onDelete,
}: CardProps) {
  const creatorName = sheet.createdBy?.name || "Unknown";
  const creatorId   = sheet.createdBy?.id || sheet.createdById || "x";
  const bugCount    = sheet._count?.bugs ?? 0;

  return (
    <div
      className={`arc-card${isSelected ? " arc-card-selected" : ""}`}
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onView()}
      aria-label={`View archived sheet ${sheet.name}`}
    >
      {/* ── top row: archive badge + bug count ── */}
      <div className="arc-card-toprow">
        <span className="arc-badge-archived">
          <Archive size={10} />
          Archived
        </span>
        <span className="arc-badge-bugs">
          <Bug size={10} />
          {bugCount} {bugCount === 1 ? "bug" : "bugs"}
        </span>
      </div>

      {/* ── sheet name ── */}
      <div className="arc-card-name" title={sheet.name}>
        {sheet.name}
      </div>

      {/* ── description ── */}
      {sheet.description && (
        <div className="arc-card-desc">{sheet.description}</div>
      )}

      {/* ── folder ── */}
      <div className="arc-card-folder">
        <FolderOpen size={12} />
        <span>{sheet.folderName || "Unknown Folder"}</span>
      </div>

      {/* ── divider ── */}
      <div className="arc-card-divider" />

      {/* ── footer meta ── */}
      <div className="arc-card-footer">
        <div className="arc-card-creator">
          <Avatar
            size={20}
            src={sheet.createdBy?.avatarUrl}
            style={{
              background: avatarColor(creatorId),
              fontSize: 9,
              flexShrink: 0,
            }}
          >
            {initials(creatorName)}
          </Avatar>
          <span className="arc-card-creator-name" title={creatorName}>
            {creatorName}
          </span>
        </div>

        <div className="arc-card-dates">
          <Tooltip title={`Created: ${formatDate(sheet.createdAt)}`}>
            <span className="arc-card-date">
              <CalendarDays size={10} />
              {formatRelative(sheet.createdAt)}
            </span>
          </Tooltip>
          <Tooltip title={`Archived: ${formatDate(sheet.updatedAt)}`}>
            <span className="arc-card-date">
              <Clock size={10} />
              {formatRelative(sheet.updatedAt)}
            </span>
          </Tooltip>
        </div>
      </div>

      {/* ── actions ── */}
      <div className="arc-card-actions" onClick={(e) => e.stopPropagation()}>
        <button className="arc-action-btn arc-action-view" onClick={onView}>
          <Eye size={13} />
          View Bugs
        </button>
        <Tooltip title="Restore sheet to active">
          <button className="arc-action-btn arc-action-restore" onClick={onRestore}>
            <RotateCcw size={13} />
            Restore
          </button>
        </Tooltip>
        <Popconfirm
          title="Permanently delete this sheet and all its bugs?"
          description="This action cannot be undone."
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={onDelete}
        >
          <Tooltip title="Delete permanently">
            <button className="arc-action-btn arc-action-delete">
              <Trash2 size={13} />
            </button>
          </Tooltip>
        </Popconfirm>
      </div>
    </div>
  );
}
