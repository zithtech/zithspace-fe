"use client";

import React from "react";
import { Skeleton, Avatar, Popconfirm, Tooltip } from "antd";
import {
  Trash2,
  RotateCcw,
  FolderOpen,
  Bug,
  Clock,
  CalendarDays,
  Eye,
  Layers,
} from "lucide-react";
import {
  useTrashedSheets,
  useRestoreSheet,
  usePermanentDeleteSheet,
  useUpdateBugSheetStatus,
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

interface TrashedSheetsViewProps {
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

export default function TrashedSheetsView({
  selectedSheetId,
  onSelectSheet,
}: TrashedSheetsViewProps) {
  const { data: trashedSheets, isLoading } = useTrashedSheets();
  const restoreSheet = useRestoreSheet();
  const permanentDeleteSheet = usePermanentDeleteSheet();
  const updateSheetStatus = useUpdateBugSheetStatus();

  if (isLoading) {
    return (
      <>
        <style>{hivebugStyles}</style>
        <div className="arc-header">
          <div className="arc-header-icon">
            <Trash2 size={16} />
          </div>
          <div>
            <div className="arc-header-title">Trash</div>
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

  if (!trashedSheets || trashedSheets.length === 0) {
    return (
      <>
        <style>{hivebugStyles}</style>
        <div className="arc-empty-wrap">
          <div className="arc-empty-icon">
            <Trash2 size={36} />
          </div>
          <div className="arc-empty-title">No sheets in trash</div>
          <div className="arc-empty-sub">
            Sheets you move to trash will appear here — safe and recoverable.
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
          <Trash2 size={16} />
        </div>
        <div>
          <div className="arc-header-title">Trash</div>
          <div className="arc-header-sub">
            {trashedSheets.length} sheet{trashedSheets.length !== 1 ? "s" : ""} in trash
          </div>
        </div>
      </div>

      {/* ── card grid ── */}
      <div className="arc-grid">
        {trashedSheets.map((sheet) => (
          <TrashedSheetCard
            key={sheet.id}
            sheet={sheet as SheetWithMeta}
            isSelected={selectedSheetId === sheet.id}
            onView={() => onSelectSheet(sheet.id)}
            onRestore={() => restoreSheet.mutate(sheet.id)}
            onDelete={() => permanentDeleteSheet.mutate(sheet.id)}
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

function TrashedSheetCard({
  sheet,
  isSelected,
  onView,
  onRestore,
  onDelete,
}: CardProps) {
  const creatorName = sheet.createdBy?.name || "Unknown";
  const creatorId = sheet.createdBy?.id || sheet.createdById || "x";
  const bugCount = sheet._count?.bugs ?? 0;

  return (
    <div
      className={`arc-card${isSelected ? " arc-card-selected" : ""}`}
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onView()}
      aria-label={`View trashed sheet ${sheet.name}`}
    >
      <div className="arc-card-top">
        <div className="arc-card-avatar" style={{ background: `linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)` }}>
          <Layers size={14} style={{ color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* ── top row: trash badge + bug count ── */}
          <div className="arc-card-toprow">
            <span className="arc-badge-trashed">
              <Trash2 size={10} />
              Trashed
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
            <FolderOpen size={11} />
            <span>{sheet.folderName || "Unknown Folder"}</span>
          </div>
        </div>
      </div>

      <div className="arc-card-foot">
        <div className="arc-foot-row">
          {/* ── footer meta ── */}
          <span className="arc-foot-item">
            <span className="arc-foot-key">Creator:</span>
            <Avatar
              size={16}
              src={sheet.createdBy?.avatarUrl}
              style={{
                background: avatarColor(creatorId),
                fontSize: 8,
                flexShrink: 0,
              }}
            >
              {initials(creatorName)}
            </Avatar>
            <span className="arc-foot-val" title={creatorName}>
              {creatorName}
            </span>
          </span>

          <span className="arc-foot-div" />

          <span className="arc-foot-item">
            <span className="arc-foot-key">Created:</span>
            <Tooltip title={formatDate(sheet.createdAt)}>
              <span className="arc-foot-val">
                {formatRelative(sheet.createdAt)}
              </span>
            </Tooltip>
          </span>

          <span className="arc-foot-div" />

          <span className="arc-foot-item">
            <span className="arc-foot-key">Trashed:</span>
            <Tooltip title={formatDate(sheet.updatedAt)}>
              <span className="arc-foot-val">
                {formatRelative(sheet.updatedAt)}
              </span>
            </Tooltip>
          </span>
        </div>

        {/* ── actions ── */}
        <div className="arc-foot-row" style={{ justifyContent: 'flex-end', gap: 6 }}>
          <button className="arc-action-btn arc-action-view" onClick={onView}>
            <Eye size={12} />
            View Bugs
          </button>
          <Tooltip title="Restore sheet">
            <button className="arc-action-btn arc-action-restore" onClick={onRestore}>
              <RotateCcw size={12} />
              Restore
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete Permanently"
            description="This action cannot be undone."
            okText="Delete Permanently"
            okButtonProps={{ danger: true }}
            onConfirm={onDelete}
          >
            <Tooltip title="Delete Permanently">
              <button className="arc-action-btn arc-action-delete">
                <Trash2 size={12} />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      </div>
    </div>
  );
}
