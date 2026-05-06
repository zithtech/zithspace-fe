"use client";

import React from "react";
import { Skeleton, Avatar } from "antd";
import {
  Archive,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Dropdown } from "antd";
import {
  useArchivedSheets,
  useUpdateBugSheetStatus,
  useDeleteBugSheet,
} from "@/hooks/useBugList";
import type { BugSheet } from "@/services/bugListService";
import { hivebugStyles } from "./hivebug-styles";

// Helper functions from HivebugTable
const initials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
  return parts[0].slice(0, 2).toUpperCase();
};

const avatarColor = (id: string) => {
  const colors = [
    "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7",
    "#dfe6e9", "#74b9ff", "#a29bfe", "#6c5ce7", "#fd79a8",
    "#fdcb6e", "#e17055", "#00b894", "#00cec9", "#0984e3",
    "#6c5ce7", "#a29bfe", "#fd79a8", "#fdcb6e", "#e17055",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
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

const formatAbsolute = (date: string) => {
  return new Date(date).toLocaleString();
};

const cap = (s: string) => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

interface ArchivedSheetsViewProps {
  selectedSheetId: string | null;
  onSelectSheet: (sheetId: string | null) => void;
}

export default function ArchivedSheetsView({ selectedSheetId, onSelectSheet }: ArchivedSheetsViewProps) {
  const { data: archivedSheets, isLoading } = useArchivedSheets();
  const updateSheetStatus = useUpdateBugSheetStatus();
  const deleteSheet = useDeleteBugSheet();

  if (isLoading) {
    return (
      <div className="hb-table-wrapper">
        <table className="hb-table">
          <tbody>
            <tr>
              <td colSpan={6} className="hb-empty">
                Loading…
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (!archivedSheets || archivedSheets.length === 0) {
    return (
      <div className="hb-table-wrapper hb-board-empty">
        <table className="hb-table">
          <tbody>
            <tr>
              <td colSpan={6} className="hb-empty">
                <div style={{ textAlign: "center", padding: "48px 24px" }}>
                  <Archive size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                    No archived sheets
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Completed sheets will appear here when you archive them
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <style>{hivebugStyles}</style>
      <div className="hb-table-wrapper">
        <table className="hb-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>SHEET NAME</th>
              <th style={{ width: 180 }}>FOLDER</th>
              <th style={{ width: 100 }}>BUGS</th>
              <th style={{ width: 200 }}>CREATED</th>
              <th style={{ width: 200 }}>ARCHIVED</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {archivedSheets.map((sheet) => (
              <ArchivedSheetRow
                key={sheet.id}
                sheet={sheet}
                selectedSheetId={selectedSheetId}
                onSelectSheet={() => onSelectSheet(sheet.id)}
                onRestore={() => updateSheetStatus.mutate({
                  id: sheet.id,
                  status: "active",
                })}
                onDelete={() => deleteSheet.mutate(sheet.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

interface ArchivedSheetRowProps {
  sheet: BugSheet & { 
    folderName?: string;
    createdBy?: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    } | null;
  };
  selectedSheetId: string | null;
  onSelectSheet: (sheetId: string) => void;
  onRestore: () => void;
  onDelete: () => void;
}

function ArchivedSheetRow({ sheet, selectedSheetId, onSelectSheet, onRestore, onDelete }: ArchivedSheetRowProps) {
  const creatorName = sheet.createdBy?.name || "Unknown";
  const creatorId = sheet.createdBy?.id || sheet.createdById;

  return (
    <tr 
      className="hb-tr" 
      style={{ 
        opacity: 0.7,
        cursor: "pointer",
        backgroundColor: selectedSheetId === sheet.id ? "var(--hb-bg-hover)" : "transparent"
      }}
      onClick={() => onSelectSheet(sheet.id)}
    >
      <td>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: 4,
          background: "var(--hb-bg-soft)",
          border: "1px solid var(--hb-border)",
        }}>
          <Archive size={12} style={{ color: "var(--hb-text-muted)" }} />
        </div>
      </td>
      <td>
        <div className="hb-title-cell">
          <span className="hb-bug-num">
            SHEET-{sheet.id.slice(-3).toUpperCase()}
          </span>
          <span className="hb-bug-title" title={sheet.name}>
            {sheet.name}
          </span>
          {sheet.description && (
            <div style={{ 
              fontSize: 11, 
              color: "var(--hb-text-muted)",
              marginTop: 2,
              fontStyle: "italic"
            }}>
              {sheet.description}
            </div>
          )}
        </div>
      </td>
      <td>
        <div className="hb-assignee">
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: avatarColor(sheet.folderId || creatorId),
              fontSize: 10,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 500,
            }}
          >
            📁
          </div>
          <span>{sheet.folderName || "Unknown Folder"}</span>
        </div>
      </td>
      <td>
        <span style={{ 
          background: "var(--hb-bg-soft)",
          padding: "2px 8px",
          borderRadius: "999px",
          fontSize: 11,
          fontWeight: 500,
          color: "var(--hb-text-soft)",
          border: "1px solid var(--hb-border)"
        }}>
          {sheet._count?.bugs || 0} bugs
        </span>
      </td>
      <td>
        <div className="hb-meta-cell">
          <Avatar
            size={20}
            src={sheet.createdBy?.avatarUrl}
            style={{
              background: avatarColor(creatorId || creatorName),
              fontSize: 10,
            }}
          >
            {initials(creatorName)}
          </Avatar>
          <div className="hb-meta-stack">
            <span className="hb-meta-name" title={creatorName}>
              {creatorName}
            </span>
            <span className="hb-meta-time">{formatRelative(sheet.createdAt)}</span>
          </div>
        </div>
      </td>
      <td>
        <span className="hb-meta-time">{formatRelative(sheet.updatedAt)}</span>
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "restore", label: "Restore from archive" },
              { type: "divider" as const },
              { key: "delete", label: "Delete permanently", danger: true },
            ],
            onClick: ({ key }) => {
              if (key === "restore") onRestore();
              if (key === "delete") onDelete();
            },
          }}
        >
          <button className="hb-icon-btn">
            <MoreHorizontal size={14} />
          </button>
        </Dropdown>
      </td>
    </tr>
  );
}
