"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useTheme } from "@/context/ThemeContext";
import {
  useUserProjects,
  useUserTicketsByProjects,
  useMembers,
} from "@/hooks/useGlobalData";
import DocumentHubService, { DocumentHub } from "@/services/documentHub";
import {
  FileZipOutlined,
  PlusOutlined,
  SearchOutlined,
  ProjectOutlined,
  TagOutlined,
  DeleteOutlined,
  RestOutlined,
  ShareAltOutlined,
  LockOutlined,
  FileTextOutlined,
  GlobalOutlined,
  UserOutlined,
  ReloadOutlined,
  FolderOutlined,
  StarOutlined,
  StarFilled,
  AppstoreOutlined,
  UnorderedListOutlined,
  ProjectFilled,
  ClockCircleOutlined,
  PushpinOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  TeamOutlined,
  EditOutlined,
  MoreOutlined,
  SettingOutlined,
  ColumnHeightOutlined,
  RightOutlined,
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  FolderOpenOutlined,
  FileOutlined,
  CaretUpFilled,
  CaretDownFilled,
  MenuOutlined,
  DownOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import ShareModal from "@/components/documenthub/ShareModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Button,
  Col,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Table,
  Tooltip,
  DatePicker,
  Space,
  message,
  Divider,
  Avatar,
  Segmented,
  Popover,
  Switch,
  Grid,
  Checkbox,
  Pagination,
} from "antd";
import type { MenuProps } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnsType } from "antd/es/table";
import { format, isWithinInterval, startOfDay, endOfDay, formatDistanceToNow } from "date-fns";
import dayjs from "dayjs";
import TrashDrawer from "@/components/documenthub/TrashDrawer";
import DocumentHubDashboard from "@/components/documenthub/DocumentHubDashboard";
import AiCreateHubModal from "@/components/documenthub/AiCreateHubModal";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { useTicketDrawer } from "@/context/TicketDrawerContext";
import { Trash2 } from "lucide-react";

const { RangePicker } = DatePicker;

// Six brand-accent colors used to tag each hub by a deterministic id-hash.
// Gives the table/grid/kanban a Notion-style visual identity per hub.
// const HUB_ACCENTS = [
//   { from: '#3B82F6', to: '#6366F1', tint: 'rgba(59, 130, 246, 0.10)' },   // blue
//   { from: '#10B981', to: '#14B8A6', tint: 'rgba(16, 185, 129, 0.10)' },   // emerald
//   { from: '#8B5CF6', to: '#A855F7', tint: 'rgba(139, 92, 246, 0.10)' },   // violet
//   { from: '#F97316', to: '#F59E0B', tint: 'rgba(249, 115, 22, 0.10)' },   // amber
//   { from: '#EC4899', to: '#F43F5E', tint: 'rgba(236, 72, 153, 0.10)' },   // pink
//   { from: '#06B6D4', to: '#0EA5E9', tint: 'rgba(6, 182, 212, 0.10)' },    // cyan
// ];
const HUB_ACCENTS = [
  { from: '#3B82F6', to: '#3B82F6', tint: 'rgba(59, 130, 246, 0.10)' },   // blue
  { from: '#3B82F6', to: '#3B82F6', tint: 'rgba(59, 130, 246, 0.10)' },   // emerald
  { from: '#3B82F6', to: '#3B82F6', tint: 'rgba(59, 130, 246, 0.10)' },   // violet
  { from: '#3B82F6', to: '#3B82F6', tint: 'rgba(59, 130, 246, 0.10)' },   // amber
  { from: '#3B82F6', to: '#3B82F6', tint: 'rgba(59, 130, 246, 0.10)' },   // pink
  { from: '#3B82F6', to: '#3B82F6', tint: 'rgba(59, 130, 246, 0.10)' },    // cyan
];

const accentForId = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HUB_ACCENTS[h % HUB_ACCENTS.length];
};

const RECENT_KEY = 'dh_recent_v1';
const VIEW_KEY = 'dh_view_v2';
const SAVED_VIEW_KEY = 'dh_savedview_v1';
const TOUR_KEY = 'dh_tour_seen_v1';
const DENSITY_KEY = 'dh_density_v1';
const COLS_KEY = 'dh_cols_v1';
const COL_WIDTHS_KEY = 'dh_col_widths_v3';
const RAILS_KEY = 'dh_rails_v1';

// Default rail visibility: only "Recently opened" is on by default; users opt
// into "Pinned" via the header overflow menu.
const DEFAULT_RAILS = { pinned: false, recent: true };
type RailVisibility = typeof DEFAULT_RAILS;

type ViewMode = 'cards' | 'table';
type SavedView = 'all' | 'mine' | 'shared' | 'public' | 'starred';
type Density = 'compact' | 'comfortable' | 'spacious';

// Hubs created within this many ms get a "NEW" pulse badge.
const NEW_BADGE_MS = 5 * 60 * 1000;

// Default widths used when the user hasn't dragged a column yet.
const DEFAULT_COL_WIDTHS: Record<string, number> = {
  name: 280,
  project: 110,
  ticket: 126,
  createdBy: 160,
  createdAt: 118,
  // updatedAt: 100,
  visibility: 120,
  actions: 72,
};

// Toggleable columns (star/name/actions are always visible).
const TOGGLEABLE_COLUMNS: { key: string; label: string }[] = [
  { key: 'project', label: 'Project' },
  { key: 'ticket', label: 'Ticket' },
  { key: 'createdBy', label: 'Created by' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'visibility', label: 'Visibility' },
];

const InlineTicketSelector = ({ record, updateHub, user }: any) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const { open: openTicketDrawer } = useTicketDrawer();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { canUpdateDocument } = usePermission();
  const isOwner = user?.id === record.createdById && canUpdateDocument;

  const { data: rowTickets = [], isLoading: rowTicketsLoading } =
    useUserTicketsByProjects(record.projectId);

  if (record.ticketId && !isEditing) {
    const ticketTooltip = (
      <div style={{ maxWidth: 260, padding: '2px 0' }}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <span
            className="inline-flex items-center gap-1 font-semibold uppercase"
            style={{
              fontSize: 9.5,
              letterSpacing: '0.08em',
              color: isDark ? 'rgba(255,255,255,0.62)' : 'var(--text-slate-400, #94a3b8)',
            }}
          >
            <TagOutlined style={{ fontSize: 10 }} /> Ticket
          </span>
          {record.project?.name && (
            <span
              className="inline-flex items-center gap-1 font-bold px-1.5 py-[1px] rounded-full"
              style={{
                fontSize: 9.5,
                background: isDark ? 'rgba(139,92,246,0.22)' : 'rgba(139,92,246,0.10)',
                color: isDark ? '#C4B5FD' : '#7C3AED',
              }}
            >
              <ProjectOutlined style={{ fontSize: 8 }} />
              {record.project.name}
            </span>
          )}
        </div>
        <div
          className="font-bold tracking-tight mb-1"
          style={{ fontSize: 14, color: isDark ? '#7DD3FC' : '#0284c7', letterSpacing: '-0.01em' }}
        >
          {record.ticket?.ticketNumber}
        </div>
        <div
          className="font-medium"
          style={{
            fontSize: 11.5,
            color: isDark ? 'rgba(255,255,255,0.88)' : 'var(--text-slate-700, #334155)',
            lineHeight: 1.45,
          }}
        >
          {record.ticket?.title}
        </div>
        <div
          className="mt-2 pt-2 flex items-center justify-between"
          style={{
            borderTop: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid var(--border-slate-200, #e2e8f0)',
            fontSize: 10,
          }}
        >
          <span style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'var(--text-slate-400, #94a3b8)' }}>
            Click number to open · title to change
          </span>
        </div>
      </div>
    );
    return (
      <Tooltip
        title={ticketTooltip}
        placement="topLeft"
        mouseEnterDelay={0.2}
        overlayInnerStyle={{
          background: isDark ? 'rgba(15, 23, 42, 0.96)' : '#ffffff',
          backdropFilter: 'blur(8px)',
          borderRadius: 10,
          padding: '10px 12px',
          boxShadow: isDark
            ? '0 10px 32px rgba(15,23,42,0.28), 0 0 0 1px rgba(255,255,255,0.06)'
            : '0 10px 32px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.08)',
        }}
      >
        <div
          className="dh-inline-cell flex items-center gap-1 py-1 px-2 rounded-md transition-colors group"
          style={{ width: 'fit-content', maxWidth: '100%' }}
        >
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); openTicketDrawer(record.ticketId); }}
            className="font-semibold text-[#3250ce] group-hover:text-[#3250ce] dark:text-sky-600 dark:hover:text-sky-700 cursor-pointer truncate"
            style={{ fontSize: '12px', lineHeight: '1.2' }}
          >
            {record.ticket?.ticketNumber}
          </span>
          {isOwner && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="dh-name-pencil opacity-0 group-hover:opacity-100"
              aria-label="Change ticket"
            >
              <EditOutlined style={{ fontSize: 10 }} />
            </button>
          )}
        </div>
      </Tooltip>
    );
  }

  if (!record.ticketId && !isEditing) {
    return (
      <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined style={{ fontSize: '10px' }} />}
          className="dh-inline-add-btn text-slate-400 hover:text-blue-500 flex items-center gap-1 p-0 px-2 h-7 rounded-md"
          style={{ fontSize: '11px', fontWeight: 500 }}
          disabled={!isOwner}
        >
          Add Ticket
        </Button>
      </div>
    );
  }

  const ddOptions = (() => {
    const sorted = [...(rowTickets || [])].sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const limited = sorted.slice(0, 50);
    if (record.ticketId && !limited.find((t: any) => t.id === record.ticketId)) {
      const current = sorted.find((t: any) => t.id === record.ticketId);
      if (current) limited.push(current);
    }
    return limited.map((t: any) => ({
      value: t.id,
      label: t.ticketNumber,
      description: t.title,
    }));
  })();

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <SearchableDropdown
        value={record.ticketId || undefined}
        disabled={!isOwner}
        loading={rowTicketsLoading}
        placeholder="Search ticket…"
        searchPlaceholder="Search by number or title"
        itemNoun="tickets"
        defaultOpen
        onOpenChange={(open) => { if (!open) setIsEditing(false); }}
        onChange={(value) => {
          updateHub(record.id, { ticketId: value, name: record.name });
          setIsEditing(false);
        }}
        options={ddOptions}
        width={300}
        style={{ minWidth: 0, width: '100%', height: 28, padding: '0 8px' }}
      />
    </div>
  );
};

const InlineProjectSelector = ({ record, projects, projectsLoading, updateHub, user }: any) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const { canUpdateDocument } = usePermission();
  const isOwner = user?.id === record.createdById && canUpdateDocument;

  if (record.projectId && !isEditing) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        className="dh-inline-cell flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors group"
        style={{ width: 'fit-content', maxWidth: '100%' }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 999, background: '#3b82f6', flex: 'none' }} />
        <span className="font-semibold text-[#3250ce] group-hover:text-[#3250ce] dark:text-sky-600 dark:hover:text-sky-700 truncate" style={{ fontSize: '12px', lineHeight: '1.2', maxWidth: '100%' }}>
          {record.project?.name}
        </span>
      </div>
    );
  }

  if (!record.projectId && !isEditing) {
    return (
      <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined style={{ fontSize: '10px' }} />}
          className="dh-inline-add-btn text-slate-400 hover:text-blue-500 flex items-center gap-1 p-0 px-2 h-7 rounded-md"
          style={{ fontSize: '11px', fontWeight: 500 }}
          disabled={!isOwner}
        >
          Add Project
        </Button>
      </div>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <SearchableDropdown
        value={record.projectId || undefined}
        disabled={!isOwner}
        loading={projectsLoading}
        placeholder="Search project…"
        searchPlaceholder="Search by name or code"
        itemNoun="projects"
        defaultOpen
        onOpenChange={(open) => { if (!open) setIsEditing(false); }}
        onChange={(value) => {
          updateHub(record.id, { projectId: value, name: record.name });
          setIsEditing(false);
        }}
        options={(projects || []).map((p: any) => ({
          value: p.value,
          label: p.label,
          description: p.code,
        }))}
        width={280}
        style={{ minWidth: 0, width: '100%', height: 28, padding: '0 8px' }}
      />
    </div>
  );
};

// Custom <th> cell with a draggable right-edge handle for column resizing (#H).
// Width comes from parent state; drag updates state via onResize.
const ResizableHeaderCell: React.FC<any> = ({ width, onResize, style, children, ...rest }) => {
  const startX = useRef(0);
  const startW = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startX.current = e.clientX;
    startW.current = width || 100;
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(60, Math.min(640, startW.current + (ev.clientX - startX.current)));
      onResize?.(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <th {...rest} style={{ ...style, position: 'relative' }}>
      {children}
      {onResize && (
        <span
          aria-hidden
          className="dh-resize-handle"
          onMouseDown={handleMouseDown}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </th>
  );
};

// Tiny title atom: icon + text + sort indicator chevrons. Used for column titles.
const ColumnTitle: React.FC<{
  icon?: React.ReactNode;
  label: string;
  sortKey?: string;
  sortedKey?: string | null;
  sortedDir?: 'ascend' | 'descend' | null;
}> = ({ icon, label, sortKey, sortedKey, sortedDir }) => {
  const isActive = sortKey && sortedKey === sortKey;
  return (
    <span className="inline-flex items-center gap-1.5 select-none">
      {icon && (
        <span className="dh-col-icon" aria-hidden>
          {icon}
        </span>
      )}
      <span>{label}</span>
      {sortKey && (
        <span className="dh-sort-arrows" aria-hidden>
          <CaretUpFilled
            style={{ fontSize: 8, color: isActive && sortedDir === 'ascend' ? '#3b82f6' : 'var(--text-slate-300)' }}
          />
          <CaretDownFilled
            style={{ fontSize: 8, color: isActive && sortedDir === 'descend' ? '#3b82f6' : 'var(--text-slate-300)' }}
          />
        </span>
      )}
    </span>
  );
};

// Inline preview shown when a row is expanded. Lists top-level tree nodes (#B).
const HubInlinePreview: React.FC<{ hub: DocumentHub; onOpen: (id: string, nodeId?: string) => void }> = ({ hub, onOpen }) => {
  const tops = (hub.treeNodes || [])
    .filter((n) => !n.parentId)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const visible = tops.slice(0, 8);
  const remaining = Math.max(0, tops.length - visible.length);
  const accent = accentForId(hub.id);

  return (
    <div
      className="dh-row-preview"
      style={{
        padding: '12px 16px 14px 56px',
        background: 'var(--bg-secondary)',
        borderTop: '1px dashed var(--border-slate-200)',
      }}
    >
      {tops.length === 0 ? (
        <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-slate-500)' }}>
          <FileTextOutlined style={{ fontSize: 12 }} />
          <span>This hub is empty.</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(hub.id); }}
            className="ml-1 font-semibold"
            style={{ color: accent.from, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Add the first document →
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ color: 'var(--text-slate-400)' }}
            >
              In this hub
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-[1px] rounded-full"
              style={{ background: 'var(--bg-pure-white)', color: 'var(--text-slate-500)', border: '1px solid var(--border-slate-200)' }}
            >
              {tops.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visible.map((node) => {
              const isFolder = node.type !== 'file';
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpen(hub.id, node.id); }}
                  className="dh-preview-chip inline-flex items-center gap-1.5"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border-slate-200)',
                    background: 'var(--bg-pure-white)',
                    fontSize: 11.5,
                    color: 'var(--text-slate-700)',
                    cursor: 'pointer',
                    maxWidth: 220,
                  }}
                >
                  <span style={{ color: isFolder ? accent.from : 'var(--text-slate-400)', fontSize: 11 }}>
                    {isFolder ? <FolderOpenOutlined /> : <FileOutlined />}
                  </span>
                  {node.title ? (
                    <span className="truncate" style={{ maxWidth: 180 }}>{node.title}</span>
                  ) : (
                    <span
                      className="truncate italic"
                      style={{ maxWidth: 180, color: 'var(--text-slate-400)' }}
                    >
                      Untitled {isFolder ? 'folder' : 'document'}
                    </span>
                  )}
                </button>
              );
            })}
            {remaining > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpen(hub.id); }}
                className="inline-flex items-center gap-1"
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: `1px dashed ${accent.from}40`,
                  background: accent.tint,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: accent.from,
                  cursor: 'pointer',
                }}
              >
                +{remaining} more <RightOutlined style={{ fontSize: 9 }} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Compact card used in the Pinned & Recent rail and Grid view.
const HubCard: React.FC<{
  hub: DocumentHub;
  starred: boolean;
  onOpen: (id: string) => void;
  onToggleStar: (e: React.MouseEvent, hub: DocumentHub) => void;
  onShare: (e: React.MouseEvent, hub: DocumentHub) => void;
  onDelete: (id: string) => void;
  variant?: 'rail' | 'grid';
}> = ({ hub, starred, onOpen, onToggleStar, onShare, onDelete, variant = 'rail' }) => {
  const { canDeleteDocument } = usePermission();
  const accent = { from: '#7E6CE8', to: '#443199', tint: 'rgba(68, 49, 153, 0.10)' };
  const docCount = hub.treeNodes?.filter((n) => n.type === 'file').length || 0;
  const isRail = variant === 'rail';
  const updatedRel = formatDistanceToNow(new Date(hub.updatedAt), { addSuffix: true });

  const isPublic = hub.visibility === 'public';

  return (
    <div
      role="button"
      onClick={() => onOpen(hub.id)}
      className={`dh-card ${isRail ? 'dh-card-rail' : ''} group cursor-pointer transition-all flex flex-col relative`}
      style={{
        width: isRail ? undefined : '100%',
        minHeight: isRail ? 110 : 134,
        borderRadius: 12,
        border: '1px solid var(--border-slate-200)',
        background: 'var(--bg-pure-white)',
      }}
    >
      {/* Corner ribbon — Public/Private */}
      <span
        className={`dh-ribbon ${isPublic ? 'dh-ribbon-public' : 'dh-ribbon-private'}`}
        aria-label={isPublic ? 'Public' : 'Private'}
      >
        {isPublic ? (
          <GlobalOutlined style={{ fontSize: 9 }} />
        ) : (
          <LockOutlined style={{ fontSize: 9 }} />
        )}
        {isPublic ? 'Public' : 'Private'}
      </span>

      {/* Body */}
      <div className="flex-1 flex flex-col p-3 min-w-0">
        <div className="flex items-start gap-2 min-w-0 pr-[68px]">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: accent.tint,
              color: accent.from,
            }}
          >
            <FolderOutlined style={{ fontSize: 14 }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className="m-0 font-semibold text-[13px] leading-tight truncate"
              style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}
              title={hub.name}
            >
              {hub.name}
            </h4>
            {hub.project?.name && (
              <Tooltip title={hub.project.name}>
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded text-[10px] font-medium truncate mt-1"
                  style={{ background: accent.tint, color: accent.from, maxWidth: 140 }}
                >
                  <ProjectOutlined style={{ fontSize: 9 }} />
                  <span className="truncate">{hub.project.name}</span>
                </span>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar
              size={18}
              src={hub.createdBy?.avatarUrl}
              style={{ background: accent.tint, color: accent.from, fontSize: 9, fontWeight: 700 }}
            >
              {hub.createdBy?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <span
              className="text-[10.5px] truncate"
              style={{ color: 'var(--text-slate-400)' }}
              title={`Updated ${updatedRel}`}
            >
              {docCount} {docCount === 1 ? 'doc' : 'docs'} · {updatedRel}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Tooltip title={starred ? 'Unstar' : 'Star'}>
              <button
                type="button"
                onClick={(e) => onToggleStar(e, hub)}
                aria-label={starred ? 'Unstar' : 'Star'}
                className="dh-card-action-btn"
                style={{ color: starred ? '#f59e0b' : undefined }}
              >
                {starred ? <StarFilled style={{ fontSize: 11 }} /> : <StarOutlined style={{ fontSize: 11 }} />}
              </button>
            </Tooltip>
            <Tooltip title="Share">
              <button
                type="button"
                onClick={(e) => onShare(e, hub)}
                className="dh-card-action-btn"
                aria-label="Share"
              >
                <ShareAltOutlined style={{ fontSize: 11 }} />
              </button>
            </Tooltip>
            {canDeleteDocument && (
              <ConfirmDialog
                tone="danger"
                icon={<Trash2 size={15} />}
                title="Delete Document Hub"
                description={`Are you sure you want to delete "${hub.name}"? This will move it to trash.`}
                confirmText="Delete"
                cancelText="Cancel"
                placement="topRight"
                onConfirm={() => onDelete(hub.id)}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Move to trash">
                    <button
                      type="button"
                      className="dh-card-action-btn dh-card-action-danger"
                      aria-label="Delete"
                    >
                      <DeleteOutlined style={{ fontSize: 11 }} />
                    </button>
                  </Tooltip>
                </div>
              </ConfirmDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentHubPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const {
    canCreateDocument,
    canReadDocument,
    canUpdateDocument,
    canDeleteDocument,
  } = usePermission();
  useActivitySource({ section: "WORK", module: "DocumentHub", page: "DocumentHubList" });
  // Ant breakpoints — used to scale card counts, button labels, and a few
  // layout decisions for narrower viewports.
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;       // < 768px
  const isTablet = screens.md && !screens.lg; // 768–991px

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadDocument) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadDocument, router]);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>("");
  const [filterProjectId, setFilterProjectId] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [filterTicketId, setFilterTicketId] = useState<string | undefined>(undefined);
  const [optimisticStarred, setOptimisticStarred] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [trashVisible, setTrashVisible] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  // View / saved-view state — persisted to localStorage so it survives reloads.
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [savedView, setSavedView] = useState<SavedView>('all');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [tourOpen, setTourOpen] = useState(false);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);

  // Table-level state (#A–#H).
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [density, setDensity] = useState<Density>('comfortable');
  const [hiddenCols, setHiddenCols] = useState<Record<string, boolean>>({});
  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_COL_WIDTHS);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [bulkProjectModalOpen, setBulkProjectModalOpen] = useState(false);
  const [bulkProjectId, setBulkProjectId] = useState<string | undefined>(undefined);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [sortedInfo, setSortedInfo] = useState<{ key: string | null; dir: 'ascend' | 'descend' | null }>(
    { key: 'updatedAt', dir: 'descend' },
  );
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [railVisibility, setRailVisibility] = useState<RailVisibility>(DEFAULT_RAILS);
  // Used by the "NEW" badge to re-render every minute so the pulse fades on schedule.
  const [, setTickNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTickNow((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // --- Persistence Logic ---
  // Restore filters from sessionStorage on mount
  useEffect(() => {
    const savedSearch = sessionStorage.getItem("documenthub_search");
    const savedProject = sessionStorage.getItem("documenthub_filterProjectId");
    const savedTicket = sessionStorage.getItem("documenthub_filterTicketId");
    const savedUser = sessionStorage.getItem("documenthub_selectedUser");

    if (savedSearch) setSearchText(savedSearch);
    if (savedProject && savedProject !== "undefined") setFilterProjectId(savedProject);
    if (savedTicket && savedTicket !== "undefined") setFilterTicketId(savedTicket);
    if (savedUser && savedUser !== "undefined") setSelectedUser(savedUser);
  }, []);

  // Persist filters to sessionStorage when they change
  useEffect(() => {
    sessionStorage.setItem("documenthub_search", searchText);
  }, [searchText]);

  useEffect(() => {
    if (filterProjectId !== undefined) {
      sessionStorage.setItem("documenthub_filterProjectId", filterProjectId);
    } else {
      sessionStorage.removeItem("documenthub_filterProjectId");
    }
  }, [filterProjectId]);

  useEffect(() => {
    if (filterTicketId !== undefined) {
      sessionStorage.setItem("documenthub_filterTicketId", filterTicketId);
    } else {
      sessionStorage.removeItem("documenthub_filterTicketId");
    }
  }, [filterTicketId]);

  useEffect(() => {
    if (selectedUser !== undefined) {
      sessionStorage.setItem("documenthub_selectedUser", selectedUser);
    } else {
      sessionStorage.removeItem("documenthub_selectedUser");
    }
  }, [selectedUser]);

  // -------------------------

  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedHubForShare, setSelectedHubForShare] = useState<{
    id: string;
    title: string;
    visibility: string;
    shareToken: string | null;
  } | null>(null);

  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();
  const { data: tickets = [], isLoading: ticketsLoading } = useUserTicketsByProjects(selectedProjectId);
  const { data: filterTickets = [], isLoading: filterTicketsLoading } = useUserTicketsByProjects(filterProjectId);
  const { data: members = [], isLoading: membersLoading } = useMembers();

  const queryClient = useQueryClient();

  const {
    data: documentHubs = [],
    isLoading: hubsLoading,
    isFetching: hubsFetching,
    refetch,
  } = useQuery({
    queryKey: ["documentHubs"],
    queryFn: DocumentHubService.getAllDocumentHubs,
  });

  // Hydrate persisted UI prefs.
  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY) as ViewMode | null;
      if (v && ['cards', 'table'].includes(v)) setViewMode(v);
      const s = localStorage.getItem(SAVED_VIEW_KEY) as SavedView | null;
      if (s && ['all', 'mine', 'shared', 'public', 'starred'].includes(s)) setSavedView(s);
      const r = localStorage.getItem(RECENT_KEY);
      if (r) setRecentIds(JSON.parse(r));
      const d = localStorage.getItem(DENSITY_KEY) as Density | null;
      if (d && ['compact', 'comfortable', 'spacious'].includes(d)) setDensity(d);
      const cols = localStorage.getItem(COLS_KEY);
      if (cols) setHiddenCols(JSON.parse(cols));
      const widths = localStorage.getItem(COL_WIDTHS_KEY);
      if (widths) setColWidths({ ...DEFAULT_COL_WIDTHS, ...JSON.parse(widths) });
      const rails = localStorage.getItem(RAILS_KEY);
      if (rails) setRailVisibility({ ...DEFAULT_RAILS, ...JSON.parse(rails) });
    } catch { /* ignore */ }
  }, []);

  // Show welcome tour only once to newly created users (created within the last 7 days)
  useEffect(() => {
    if (authLoading || !user) return;
    try {
      const userTourKey = `${TOUR_KEY}_${user.id}`;
      const seen = localStorage.getItem(userTourKey);
      if (!seen) {
        const createdAtTime = user.createdAt ? new Date(user.createdAt).getTime() : 0;
        if (createdAtTime) {
          const isNewUser = (Date.now() - createdAtTime) < 7 * 24 * 60 * 60 * 1000;
          if (isNewUser) {
            setTourOpen(true);
          }
        }
      }
    } catch { /* ignore */ }
  }, [user, authLoading]);

  useEffect(() => {
    try { localStorage.setItem(VIEW_KEY, viewMode); } catch { /* ignore */ }
  }, [viewMode]);
  useEffect(() => {
    try { localStorage.setItem(SAVED_VIEW_KEY, savedView); } catch { /* ignore */ }
  }, [savedView]);
  useEffect(() => {
    try { localStorage.setItem(DENSITY_KEY, density); } catch { /* ignore */ }
  }, [density]);
  useEffect(() => {
    try { localStorage.setItem(COLS_KEY, JSON.stringify(hiddenCols)); } catch { /* ignore */ }
  }, [hiddenCols]);
  useEffect(() => {
    try { localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(colWidths)); } catch { /* ignore */ }
  }, [colWidths]);
  useEffect(() => {
    try { localStorage.setItem(RAILS_KEY, JSON.stringify(railVisibility)); } catch { /* ignore */ }
  }, [railVisibility]);

  const trackRecent = (id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const openHub = (id: string, nodeId?: string) => {
    trackRecent(id);
    if (nodeId) {
      router.push(`/documenthub/${id}?nodeId=${nodeId}`);
    } else {
      router.push(`/documenthub/${id}`);
    }
  };

  const updateHub = async (id: string, data: any) => {
    try {
      const prevHub = (documentHubs as any[])?.find((h) => h.id === id);
      const prevTicketId = prevHub?.ticketId || prevHub?.ticket?.id;
      await DocumentHubService.updateDocumentHub(id, data);
      messageApi.success("Hub updated successfully");
      const ticketIdsToRefresh = new Set<string>();
      if (data?.ticketId) ticketIdsToRefresh.add(data.ticketId);
      if (prevTicketId) ticketIdsToRefresh.add(prevTicketId);
      ticketIdsToRefresh.forEach((tid) => {
        queryClient.invalidateQueries({ queryKey: ["ticket", tid, "documentHubs"] });
      });
      refetch();
    } catch (error) {
      console.error(error);
      messageApi.error("Update failed");
    }
  };

  const handleAddDocument = async (values: any) => {
    try {
      setIsCreating(true);
      const documentDetails = {
        ...values,
        visibility: 'public',
      };

      const data = await DocumentHubService.createDocumentHub(documentDetails);
      await queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
      setModalVisible(false);
      form.resetFields();
      router.push(`/documenthub/${data?.id}`);
    } catch (error: any) {
      console.error("Failed to create document hub", error);
      messageApi.error(error?.message || "This hub name already exists.");
    } finally {
      setIsCreating(false);
    }
  };

  const executeDeleteHub = async (id: string) => {
    try {
      await DocumentHubService.deleteDocumentHub(id);
      messageApi.success("Document Hub moved to trash");
      queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
    } catch (error) {
      console.error(error);
      messageApi.error("Failed to delete Document Hub");
    }
  };

  const handleShareHub = (e: React.MouseEvent, hub: any) => {
    e.stopPropagation();
    setSelectedHubForShare({
      id: hub.id,
      title: hub.name,
      visibility: hub.visibility || 'private',
      shareToken: hub.shareToken || null
    });
    setShareModalOpen(true);
  };

  const isHubStarred = (hub: DocumentHub) => {
    if (Object.prototype.hasOwnProperty.call(optimisticStarred, hub.id)) {
      return optimisticStarred[hub.id];
    }
    return !!(hub as any).isStarred;
  };

  const handleToggleStar = async (e: React.MouseEvent, hub: DocumentHub) => {
    e.stopPropagation();
    const currentlyStarred = isHubStarred(hub);
    setOptimisticStarred((prev) => ({ ...prev, [hub.id]: !currentlyStarred }));
    try {
      if (currentlyStarred) {
        await DocumentHubService.unstarDocumentHub(hub.id);
      } else {
        await DocumentHubService.starDocumentHub(hub.id);
      }
      messageApi.success(currentlyStarred ? "Removed from starred" : "Starred");
      queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
    } catch (err) {
      console.error("Failed to toggle star", err);
      messageApi.error("Failed to update star");
      setOptimisticStarred((prev) => {
        const next = { ...prev };
        delete next[hub.id];
        return next;
      });
    }
  };

  const dismissTour = () => {
    setTourOpen(false);
    if (user?.id) {
      try {
        localStorage.setItem(`${TOUR_KEY}_${user.id}`, '1');
      } catch { /* ignore */ }
    }
  };

  // === Bulk action handlers (#A) ===
  // Each runs the per-hub op with Promise.allSettled so partial failures still
  // refresh the list and report a useful summary message.
  const ownedSelectedHubs = useMemo(
    () => documentHubs.filter((h) => selectedKeys.includes(h.id) && h.createdById === user?.id),
    [documentHubs, selectedKeys, user?.id],
  );
  const selectedCount = selectedKeys.length;
  const ownedSelectedCount = ownedSelectedHubs.length;

  const runBulk = async (label: string, op: (hub: DocumentHub) => Promise<unknown>) => {
    if (!ownedSelectedHubs.length) {
      messageApi.warning("You can only bulk-edit hubs you own.");
      return;
    }
    setBulkBusy(true);
    const results = await Promise.allSettled(ownedSelectedHubs.map((h) => op(h)));
    setBulkBusy(false);
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ok;
    if (failed === 0) {
      messageApi.success(`${label}: ${ok} hub${ok === 1 ? '' : 's'}.`);
    } else if (ok === 0) {
      messageApi.error(`${label} failed for all ${failed} hub${failed === 1 ? '' : 's'}.`);
    } else {
      messageApi.warning(`${label}: ${ok} succeeded, ${failed} failed.`);
    }
    queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
    setSelectedKeys([]);
  };

  const bulkSetVisibility = (visibility: 'public' | 'private') =>
    runBulk(visibility === 'public' ? 'Made public' : 'Made private', (h) =>
      visibility === 'public'
        ? DocumentHubService.shareDocumentHub(h.id, 'public')
        : DocumentHubService.revokeHubShare(h.id),
    );

  const bulkSetStar = (star: boolean) => {
    // Optimistic flip for snappy UI feedback before the API responds.
    setOptimisticStarred((prev) => {
      const next = { ...prev };
      ownedSelectedHubs.forEach((h) => { next[h.id] = star; });
      return next;
    });
    return runBulk(star ? 'Starred' : 'Unstarred', (h) =>
      star ? DocumentHubService.starDocumentHub(h.id) : DocumentHubService.unstarDocumentHub(h.id),
    );
  };

  const bulkDelete = () => {
    if (!ownedSelectedHubs.length) {
      messageApi.warning("You can only delete hubs you own.");
      return;
    }
    modal.confirm({
      title: `Delete ${ownedSelectedCount} hub${ownedSelectedCount === 1 ? '' : 's'}?`,
      content: `This moves ${ownedSelectedCount === 1 ? 'it' : 'them'} to trash. You can restore from there.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => runBulk('Moved to trash', (h) => DocumentHubService.deleteDocumentHub(h.id)),
    });
  };

  const bulkApplyProject = async () => {
    if (!ownedSelectedHubs.length) return;
    await runBulk(
      bulkProjectId ? 'Moved to project' : 'Removed from project',
      (h) => DocumentHubService.updateDocumentHub(h.id, { projectId: bulkProjectId, name: h.name } as any),
    );
    setBulkProjectModalOpen(false);
    setBulkProjectId(undefined);
  };

  // === Inline name edit (#D) ===
  const startNameEdit = (hub: DocumentHub) => {
    setEditingNameId(hub.id);
    setEditingNameValue(hub.name);
  };
  const cancelNameEdit = () => {
    setEditingNameId(null);
    setEditingNameValue('');
  };
  const saveNameEdit = async (hub: DocumentHub) => {
    const trimmed = editingNameValue.trim();
    if (!trimmed || trimmed === hub.name) {
      cancelNameEdit();
      return;
    }
    cancelNameEdit();
    await updateHub(hub.id, { name: trimmed });
  };

  const handleColumnResize = (key: string) => (next: number) => {
    setColWidths((prev) => ({ ...prev, [key]: next }));
  };

  // Apply saved-view scope first, then fine-grained filters.
  const scopedHubs = useMemo(() => {
    return documentHubs.filter((hub) => {
      switch (savedView) {
        case 'mine': return hub.createdById === user?.id;
        case 'shared': return hub.createdById !== user?.id;
        case 'public': return hub.visibility === 'public';
        case 'starred': return isHubStarred(hub);
        case 'all':
        default: return true;
      }
    });
    // isHubStarred reads optimisticStarred — re-run when that changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentHubs, savedView, user?.id, optimisticStarred]);

  const filteredHubs = useMemo(() => {
    return scopedHubs.filter((hub) => {
      const matchesSearch = hub.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesUser = selectedUser ? hub.createdById === selectedUser : true;
      const matchesProject = filterProjectId
        ? (hub.projectId === filterProjectId || hub.project?.id === filterProjectId)
        : true;
      const matchesTicket = filterTicketId
        ? (hub.ticketId === filterTicketId || hub.ticket?.id === filterTicketId)
        : true;
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const startDate = startOfDay(dateRange[0].toDate());
        const endDate = endOfDay(dateRange[1].toDate());
        const createdInRange = isWithinInterval(new Date(hub.createdAt), { start: startDate, end: endDate });
        const updatedInRange = isWithinInterval(new Date(hub.updatedAt), { start: startDate, end: endDate });
        matchesDate = createdInRange || updatedInRange;
      }
      return matchesSearch && matchesUser && matchesProject && matchesTicket && matchesDate;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedHubs, searchText, selectedUser, filterProjectId, filterTicketId, dateRange, optimisticStarred]);

  // Pinned (starred) and recently-opened, scoped to whatever is currently visible.
  const pinnedHubs = useMemo(
    () => documentHubs.filter((h) => isHubStarred(h)).slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documentHubs, optimisticStarred]
  );
  const recentHubs = useMemo(() => {
    if (!recentIds.length) {
      // Fallback: most recently updated, excluding pinned, top 6.
      const pinnedIds = new Set(pinnedHubs.map((p) => p.id));
      return [...documentHubs]
        .filter((h) => !pinnedIds.has(h.id))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6);
    }
    return recentIds
      .map((id) => documentHubs.find((h) => h.id === id))
      .filter(Boolean) as DocumentHub[];
  }, [recentIds, documentHubs, pinnedHubs]);

  // Footer-summary derived counts (#F). Defined above the early returns so the
  // hook order stays stable across renders where canReadDocument flips.
  const sharedWithMeCount = useMemo(
    () => filteredHubs.filter((h) => h.createdById !== user?.id).length,
    [filteredHubs, user?.id],
  );
  const starredVisibleCount = useMemo(
    () => filteredHubs.filter((h) => isHubStarred(h)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredHubs, optimisticStarred],
  );

  // Saved-view counts for pill badges.
  const viewCounts = useMemo(() => ({
    all: documentHubs.length,
    mine: documentHubs.filter((h) => h.createdById === user?.id).length,
    shared: documentHubs.filter((h) => h.createdById !== user?.id).length,
    public: documentHubs.filter((h) => h.visibility === 'public').length,
    starred: documentHubs.filter((h) => isHubStarred(h)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [documentHubs, user?.id, optimisticStarred]);

  // Keyboard navigation (j/k/enter) for the table view.
  useEffect(() => {
    if (viewMode !== 'table' && viewMode !== 'cards') return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (!filteredHubs.length) return;
      const idx = filteredHubs.findIndex((h) => h.id === focusedRowId);
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = idx < 0 ? 0 : Math.min(filteredHubs.length - 1, idx + 1);
        setFocusedRowId(filteredHubs[next].id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = idx <= 0 ? 0 : idx - 1;
        setFocusedRowId(filteredHubs[next].id);
      } else if (e.key === 'Enter' && focusedRowId) {
        e.preventDefault();
        openHub(focusedRowId);
      } else if (e.key === 'Escape' && selectedKeys.length) {
        e.preventDefault();
        setSelectedKeys([]);
      } else if (e.key === ' ' && focusedRowId) {
        // Space toggles inline preview expand for the focused row.
        e.preventDefault();
        setExpandedKeys((prev) =>
          prev.includes(focusedRowId)
            ? prev.filter((k) => k !== focusedRowId)
            : [...prev, focusedRowId],
        );
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredHubs, focusedRowId, viewMode, selectedKeys.length]);

  // Loading & permission check
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{
          margin: "0 -24px",
          padding: "24px 32px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 54px)",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <LoadingSpinner message="Orchestrating technical repository..." size="large" fullScreen={false} />
        </div>
      </MainLayout>
    );
  }

  if (!canReadDocument) return null;

  const totalDocCount = documentHubs.reduce(
    (acc, h) => acc + (h.treeNodes?.filter((n) => n.type === 'file').length || 0),
    0,
  );
  const lastUpdated = documentHubs.length
    ? formatDistanceToNow(
      documentHubs.reduce(
        (acc, h) => (new Date(h.updatedAt) > acc ? new Date(h.updatedAt) : acc),
        new Date(0),
      ),
      { addSuffix: true },
    )
    : null;

  const sortedKey = sortedInfo.key;
  const sortedDir = sortedInfo.dir;

  const allColumns: (ColumnsType<DocumentHub>[number] & { _key: string })[] = [
    {
      _key: 'name',
      title: (
        <span style={{ paddingLeft: 38, display: 'inline-flex' }}>
          <ColumnTitle icon={<FolderOutlined />} label="Name" sortKey="name" sortedKey={sortedKey} sortedDir={sortedDir} />
        </span>
      ),
      dataIndex: 'name',
      key: 'name',
      onHeaderCell: () => ({ style: { minWidth: 280 } }),
      onCell: () => ({ style: { minWidth: 280 } }),
      // fixed: 'left',
      render: (text, record) => {
        const docCount = (record as any).treeNodes?.filter((n: any) => n.type === 'file').length || 0;
        const updatedRel = formatDistanceToNow(new Date(record.updatedAt), { addSuffix: true });
        const isNew = Date.now() - new Date(record.createdAt).getTime() < NEW_BADGE_MS;
        const isEditingThis = editingNameId === record.id;
        const isOwner = user?.id === record.createdById;
        const starred = isHubStarred(record);

        return (
          <div className="flex items-center gap-2 w-full">
            <Tooltip title={starred ? 'Remove from starred' : 'Add to starred'}>
              <button
                type="button"
                onClick={(e) => handleToggleStar(e, record)}
                aria-label={starred ? 'Unstar' : 'Star'}
                aria-pressed={starred}
                className={`dh-name-star ${starred ? 'is-starred' : ''}`}
              >
                {starred ? (
                  <StarFilled style={{ fontSize: 14 }} />
                ) : (
                  <StarOutlined style={{ fontSize: 14 }} />
                )}
              </button>
            </Tooltip>
            <div
              className="flex items-center justify-center shrink-0 w-[30px] h-[30px] rounded-lg"
              style={{
                background: isDark ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-blue-50, #eff6ff)',
                border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.20)' : 'var(--border-blue-100, #dbeafe)'}`,
              }}
            >
              <FolderOutlined style={{ fontSize: 14, color: isDark ? '#60a5fa' : '#3b82f6' }} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              {isEditingThis ? (
                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                  <Input
                    autoFocus
                    size="small"
                    value={editingNameValue}
                    onChange={(e) => setEditingNameValue(e.target.value)}
                    onPressEnter={() => saveNameEdit(record)}
                    onKeyDown={(e) => { if (e.key === 'Escape') cancelNameEdit(); }}
                    onBlur={() => saveNameEdit(record)}
                    style={{ height: 26, fontSize: 13, fontWeight: 600, borderRadius: 6 }}
                  />
                  <button
                    type="button"
                    onClick={() => saveNameEdit(record)}
                    className="dh-name-edit-btn"
                    aria-label="Save"
                    style={{ color: '#10b981' }}
                  >
                    <CheckOutlined style={{ fontSize: 11 }} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelNameEdit}
                    className="dh-name-edit-btn"
                    aria-label="Cancel"
                  >
                    <CloseOutlined style={{ fontSize: 11 }} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0 group/name">
                  <span
                    className="font-semibold text-[13px] truncate"
                    style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}
                  >
                    {text}
                  </span>
                  {isNew && (
                    <Tooltip title="Created in the last few minutes">
                      <span className="dh-new-badge" aria-label="New">NEW</span>
                    </Tooltip>
                  )}
                  {isOwner && canUpdateDocument && (
                    <Tooltip title="Rename">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); startNameEdit(record); }}
                        className="dh-name-pencil opacity-0 group-hover/name:opacity-100"
                        aria-label="Rename"
                      >
                        <EditOutlined style={{ fontSize: 10 }} />
                      </button>
                    </Tooltip>
                  )}
                </div>
              )}
              <span className="text-[10.5px] truncate" style={{ color: 'var(--text-slate-400)' }}>
                {docCount} {docCount === 1 ? 'doc' : 'docs'} · Updated {updatedRel}
              </span>
            </div>
          </div>
        );
      },
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortOrder: sortedKey === 'name' ? sortedDir ?? undefined : undefined,
    },
    {
      _key: 'project',
      title: <ColumnTitle icon={<ProjectOutlined />} label="Project" />,
      dataIndex: ['project', 'name'],
      key: 'project',
      width: colWidths.project,
      render: (_text, record) => (
        <InlineProjectSelector
          record={record}
          projects={projects}
          projectsLoading={projectsLoading}
          updateHub={(id: string, updateData: any) => updateHub(id, updateData)}
          user={user}
        />
      ),
    },
    {
      _key: 'ticket',
      title: <ColumnTitle icon={<TagOutlined />} label="Ticket" />,
      dataIndex: ['ticket', 'ticketNumber'],
      key: 'ticket',
      width: colWidths.ticket,
      render: (_text, record) => (
        <InlineTicketSelector
          record={record}
          updateHub={(id: string, updateData: any) => updateHub(id, updateData)}
          user={user}
        />
      ),
    },
    {
      _key: 'createdBy',
      title: <ColumnTitle icon={<UserOutlined />} label="Created by" />,
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      width: colWidths.createdBy,
      render: (text, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar
            size={20}
            src={record.createdBy?.avatarUrl}
            style={!record.createdBy?.avatarUrl ? { backgroundColor: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 800 } : {}}
          >
            {!record.createdBy?.avatarUrl && (record.createdBy?.name || 'Unknown').charAt(0).toUpperCase()}
          </Avatar>
          <span className="text-[12.5px]" style={{ color: isDark ? '#e2e8f0' : 'var(--text-slate-700)', fontWeight: 500 }}>
            {record.createdBy?.name?.split(' ')[0] || 'Unknown'}
          </span>
        </div>
      ),
    },
    {
      _key: 'createdAt',
      title: <ColumnTitle icon={<CalendarOutlined />} label="Created" sortKey="createdAt" sortedKey={sortedKey} sortedDir={sortedDir} />,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: colWidths.createdAt,
      render: (date) => (
        <Tooltip
          title={format(new Date(date), "EEEE, MMM d, yyyy h:mm a")}
          overlayInnerStyle={{
            background: isDark ? 'rgba(15, 23, 42, 0.96)' : '#ffffff',
            color: isDark ? 'rgba(255,255,255,0.88)' : 'var(--text-slate-700, #334155)',
            fontSize: '11.5px',
            borderRadius: 8,
            padding: '6px 10px',
            boxShadow: isDark
              ? '0 6px 20px rgba(15,23,42,0.22), 0 0 0 1px rgba(255,255,255,0.06)'
              : '0 6px 20px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.06)',
          }}
        >
          <div className="flex flex-col">
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-slate-700)' }}>
              {format(new Date(date), "MMM d, yyyy")}
            </span>
            <span className="text-[10.5px]" style={{ color: 'var(--text-slate-400)' }}>
              {format(new Date(date), "h:mm a")}
            </span>
          </div>
        </Tooltip>
      ),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortOrder: sortedKey === 'createdAt' ? sortedDir ?? undefined : undefined,
    },
    // {
    //   _key: 'updatedAt',
    //   title: <ColumnTitle icon={<ClockCircleOutlined />} label="Updated" sortKey="updatedAt" sortedKey={sortedKey} sortedDir={sortedDir} />,
    //   dataIndex: 'updatedAt',
    //   key: 'updatedAt',
    //   width: colWidths.updatedAt,
    //   defaultSortOrder: 'descend' as const,
    //   render: (date) => (
    //     <Tooltip
    //       title={format(new Date(date), "EEEE, MMM d, yyyy h:mm a")}
    //       overlayInnerStyle={{
    //         background: isDark ? 'rgba(15, 23, 42, 0.96)' : '#ffffff',
    //         color: isDark ? 'rgba(255,255,255,0.88)' : 'var(--text-slate-700, #334155)',
    //         fontSize: '11.5px',
    //         borderRadius: 8,
    //         padding: '6px 10px',
    //         boxShadow: isDark
    //           ? '0 6px 20px rgba(15,23,42,0.22), 0 0 0 1px rgba(255,255,255,0.06)'
    //           : '0 6px 20px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.06)',
    //       }}
    //     >
    //       <div className="flex flex-col">
    //         <span className="text-[12px] font-medium" style={{ color: 'var(--text-slate-700)' }}>
    //           {format(new Date(date), "MMM d, yyyy")}
    //         </span>
    //         <span className="text-[10.5px]" style={{ color: 'var(--text-slate-400)' }}>
    //           {format(new Date(date), "h:mm a")}
    //         </span>
    //       </div>
    //     </Tooltip>
    //   ),
    //   sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    //   sortOrder: sortedKey === 'updatedAt' ? sortedDir ?? undefined : undefined,
    // },
    {
      _key: 'visibility',
      title: <ColumnTitle icon={<LockOutlined />} label="Visibility" />,
      dataIndex: 'visibility',
      key: 'visibility',
      width: colWidths.visibility,
      render: (_visibility, record) => renderVisibilityCell(record),
    },
    {
      _key: 'actions',
      title: (
        <span>
          Actions
        </span>
      ),
      key: 'actions',
      // width: colWidths.actions,
      width: 72,
      fixed: 'right',
      align: 'center' as const,
      render: (_text, record) => (
        <div className="dh-row-actions" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Share">
            <button
              type="button"
              onClick={(e) => handleShareHub(e, record)}
              className="dh-row-action-btn"
              aria-label="Share"
            >
              <ShareAltOutlined style={{ fontSize: 13 }} />
            </button>
          </Tooltip>
          {canDeleteDocument && (
            <ConfirmDialog
              tone="danger"
              icon={<Trash2 size={15} />}
              title="Delete Document Hub"
              description={`Are you sure you want to delete "${record.name}"? This will move it to trash.`}
              confirmText="Delete"
              cancelText="Cancel"
              placement="topRight"
              onConfirm={() => executeDeleteHub(record.id)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Move to trash">
                  <button
                    type="button"
                    className="dh-row-action-btn dh-row-action-danger"
                    aria-label="Delete"
                  >
                    <DeleteOutlined style={{ fontSize: 13 }} />
                  </button>
                </Tooltip>
              </div>
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  // Apply column-visibility filter (#C). Star/name/actions are never hidden.
  const visibleColumns: ColumnsType<DocumentHub> = allColumns
    .filter((c) => !hiddenCols[c._key])
    .map(({ _key, ...rest }) => {
      // Wire resize handler so the custom <th> cell can drag and persist width.
      const onHeaderCell = (): any => ({
        width: rest.width as number,
        onResize: handleColumnResize(_key),
      });
      return { ...rest, onHeaderCell };
    });

  const handleReload = async () => {
    setSearchText("");
    setFilterProjectId(undefined);
    setFilterTicketId(undefined);
    setSelectedUser(undefined);
    setDateRange(null);
    try {
      await refetch();
      messageApi.success("Hubs refreshed successfully");
    } catch {
      messageApi.error("Failed to refresh hubs");
    }
  };

  const savedViews: { key: SavedView; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'all', label: 'All hubs', icon: <FolderOutlined />, color: '#3B82F6' },
    { key: 'mine', label: 'My hubs', icon: <UserOutlined />, color: '#3B82F6' },
    // { key: 'shared', label: 'Shared with me', icon: <TeamOutlined />, color: '#10B981' },
    { key: 'public', label: 'Public', icon: <GlobalOutlined />, color: '#3B82F6' },
    { key: 'starred', label: 'Starred', icon: <StarFilled />, color: '#3B82F6' },
  ];

  const renderEmpty = () => {
    const hasAnyHubs = documentHubs.length > 0;
    return (
      <div
        className="flex flex-col items-center justify-center text-center px-6 py-16 rounded-2xl"
        style={{
          border: '1px dashed var(--border-slate-200)',
          background: 'var(--bg-pure-white)',
        }}
      >
        <div
          className="flex items-center justify-center mb-5 text-white relative"
          style={{
            width: 76, height: 76, borderRadius: 22,
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
            boxShadow: '0 12px 32px rgba(99, 102, 241, 0.30), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <FileZipOutlined style={{ fontSize: 32 }} />
          <div
            aria-hidden
            className="absolute -inset-3 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.10))',
              filter: 'blur(20px)',
              zIndex: -1,
            }}
          />
        </div>
        <h3 className="m-0 text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}>
          {hasAnyHubs ? 'No hubs match these filters' : 'Your knowledge base starts here'}
        </h3>
        <p className="m-0 mt-1.5 text-[13px] max-w-md" style={{ color: 'var(--text-slate-500)' }}>
          {hasAnyHubs
            ? 'Try clearing filters or switching saved views to see more hubs.'
            : 'Create a Document Hub to organize specs, runbooks, and wiki pages alongside the work they belong to.'}
        </p>
        <div className="flex items-center gap-2 mt-5">
          {hasAnyHubs ? (
            <Button onClick={handleReload} icon={<ReloadOutlined />} style={{ borderRadius: 10, height: 38, fontWeight: 500 }}>
              Reset filters
            </Button>
          ) : (
            canCreateDocument && (
              <>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                  style={{
                    height: 40, borderRadius: 10, paddingInline: 18, fontWeight: 600,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
                  }}
                >
                  Create your first hub
                </Button>
                <Button
                  onClick={() => setAiModalVisible(true)}
                  icon={<span style={{ fontSize: 13 }}>✨</span>}
                  style={{
                    height: 40, borderRadius: 10, paddingInline: 14, fontWeight: 600,
                    background: 'var(--bg-pure-white)',
                    border: '1px solid var(--border-slate-200)',
                    color: 'var(--text-slate-700)',
                  }}
                >
                  Generate with Zai
                </Button>
              </>
            )
          )}
        </div>
      </div>
    );
  };

  const renderRail = () => {
    if (hubsLoading || !documentHubs.length) return null;
    const showPinned = railVisibility.pinned && pinnedHubs.length > 0;
    const showRecent = railVisibility.recent && recentHubs.length > 0;
    if (!showPinned && !showRecent) return null;

    // Cap rail card counts to 5. We now use a responsive auto-fit grid so cards 
    // wrap gracefully on small screens without being hidden.
    const railCap = 5;
    const visiblePinned = pinnedHubs.slice(0, railCap);
    const visibleRecent = recentHubs.slice(0, railCap);

    return (
      <div className="flex flex-col gap-3 mb-3">
        {showPinned && (
          <RailSection
            label="Pinned"
            icon={<PushpinOutlined />}
            color="#F59E0B"
            count={pinnedHubs.length}
          >
            {visiblePinned.map((hub) => (
              <HubCard
                key={hub.id}
                hub={hub}
                starred={isHubStarred(hub)}
                onOpen={openHub}
                onToggleStar={handleToggleStar}
                onShare={handleShareHub}
                onDelete={executeDeleteHub}
                variant="rail"
              />
            ))}
          </RailSection>
        )}
        {showRecent && (
          <RailSection
            label={recentIds.length ? 'Recently opened' : 'Recently updated'}
            icon={<ClockCircleOutlined />}
            color="#3B82F6"
            count={recentHubs.length}
          >
            {visibleRecent.map((hub) => (
              <HubCard
                key={hub.id}
                hub={hub}
                starred={isHubStarred(hub)}
                onOpen={openHub}
                onToggleStar={handleToggleStar}
                onShare={handleShareHub}
                onDelete={executeDeleteHub}
                variant="rail"
              />
            ))}
          </RailSection>
        )}
      </div>
    );
  };

  const renderTable = () => {
    // Manual paging so the shared fixed footer (below the table) drives pagination.
    const total = filteredHubs.length;
    const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
    const curPage = Math.min(tablePage, pageCount);
    const pageStart = (curPage - 1) * tablePageSize;
    const pagedHubs = filteredHubs.slice(pageStart, pageStart + tablePageSize);
    return (
      <div
        className="dh-table-shell"
        data-density={density}
        style={{
          borderRadius: 0,
          background: 'var(--bg-pure-white)',
          border: 'none',
          position: 'relative'
        }}
      >
        {(hubsLoading || hubsFetching) && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <LoadingSpinner size="medium" fullScreen={false} />
          </div>
        )}
        <Table
          columns={visibleColumns}
          dataSource={pagedHubs}
          rowKey="id"
          loading={false}
          pagination={false}
          size="small"
          className="premium-table dh-table"
          tableLayout="fixed"
          sticky={{ offsetHeader: 0 }}
          scroll={{ x: 980 }}
          locale={{ emptyText: renderEmpty() }}
          components={{
            header: { cell: ResizableHeaderCell },
          }}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys(keys),
            columnWidth: 26,
          }}
          expandable={{
            columnWidth: 24,
            expandedRowKeys: expandedKeys,
            onExpand: (expanded, record) => {
              setExpandedKeys((prev) =>
                expanded ? [...prev, record.id] : prev.filter((k) => k !== record.id),
              );
            },
            expandedRowRender: (record) => (
              <HubInlinePreview hub={record} onOpen={openHub} />
            ),
            expandIcon: ({ expanded, onExpand, record }) => (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onExpand(record, e as any); }}
                className="dh-expand-btn"
                aria-label={expanded ? 'Collapse' : 'Expand preview'}
                aria-expanded={expanded}
                style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
              >
                {expanded ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
              </button>
            ),
            expandIconColumnIndex: 1,
            rowExpandable: () => true,
            expandedRowClassName: () => 'dh-expanded-row',
          }}
          onChange={(_pagination, _filters, sorter: any) => {
            if (sorter && !Array.isArray(sorter)) {
              setSortedInfo({
                key: sorter.order ? (sorter.columnKey as string) : null,
                dir: sorter.order ?? null,
              });
            }
          }}
          onRow={(record) => ({
            onClick: (e) => {
              // Skip navigation if click came from selection cell or interactive control.
              const target = e.target as HTMLElement;
              if (target.closest('.ant-checkbox-wrapper, .ant-table-selection-column, .dh-expand-btn, .dh-row-actions, button, input, .ant-select')) {
                return;
              }
              openHub(record.id);
            },
            onMouseEnter: () => setFocusedRowId(record.id),
            className: `cursor-pointer ${focusedRowId === record.id ? 'dh-row-focused' : ''}`,
          })}
        />
      </div>
    );
  };

  // Visibility status-pill shared by the table column and the row-card list.
  // Clean light-bordered pill with a green (public) / slate (private) dot and a
  // chevron; owners can click to switch via a small dropdown.
  const renderVisibilityCell = (record: DocumentHub) => {
    const isOwner = user?.id === record.createdById;
    const isPublic = ((record as any).visibility || 'private') === 'public';

    const setVisibility = async (value: 'public' | 'private') => {
      if ((isPublic ? 'public' : 'private') === value) return;
      try {
        if (value === 'public') {
          await DocumentHubService.shareDocumentHub(record.id, 'public');
        } else {
          await DocumentHubService.revokeHubShare(record.id);
        }
        messageApi.success(`Hub is now ${value}`);
        refetch();
      } catch (error) {
        console.error(error);
        messageApi.error("Failed to update visibility");
      }
    };

    const pill = (
      <span
        className={`dh-vis-pill ${isOwner ? 'is-clickable' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="dh-vis-dot" style={{ background: isPublic ? '#22c55e' : 'var(--text-slate-400)' }} />
        <span className="dh-vis-label">{isPublic ? 'Public' : 'Private'}</span>
        {isOwner && <DownOutlined className="dh-vis-chevron" style={{ fontSize: 9 }} />}
      </span>
    );

    if (!isOwner) return pill;

    return (
      <Dropdown
        trigger={['click']}
        placement="bottomLeft"
        menu={{
          selectedKeys: [isPublic ? 'public' : 'private'],
          items: [
            {
              key: 'public',
              label: (
                <span className="dh-vis-item">
                  <span className="dh-vis-dot" style={{ background: '#22c55e' }} /> Public
                </span>
              ),
              onClick: () => setVisibility('public'),
            },
            {
              key: 'private',
              label: (
                <span className="dh-vis-item">
                  <span className="dh-vis-dot" style={{ background: 'var(--text-slate-400)' }} /> Private
                </span>
              ),
              onClick: () => setVisibility('private'),
            },
          ],
        }}
      >
        {pill}
      </Dropdown>
    );
  };

  const renderRichMenuItem = (icon: React.ReactNode, iconBg: string, iconColor: string, title: string, subtitle: string, isDanger?: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 2px' }}>
      <div style={{ width: 36, height: 36, borderRadius: '0px', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: isDanger ? '#ef4444' : 'var(--text-slate-700)', lineHeight: '1.2' }}>{title}</span>
        <span style={{ fontSize: 12, color: 'var(--text-slate-400)', marginTop: 2 }}>{subtitle}</span>
      </div>
    </div>
  );

  // Render Cards (List view matching Proposals)
  const renderRowCards = () => {
    if (!filteredHubs.length) return renderEmpty();
    const allSelected = filteredHubs.every((h) => selectedKeys.includes(h.id));
    const someSelected = filteredHubs.some((h) => selectedKeys.includes(h.id));
    // Page the list — paging controls live in the fixed footer below.
    const pageCount = Math.max(1, Math.ceil(filteredHubs.length / tablePageSize));
    const curPage = Math.min(tablePage, pageCount);
    const pageStart = (curPage - 1) * tablePageSize;
    const pageHubs = filteredHubs.slice(pageStart, pageStart + tablePageSize);

    return (
      <div className="dh-rowcards-wrap" style={{ padding: '0px 0px', overflowY: 'auto' }}>
        <div className="dh-rowcards-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', paddingBottom: '24px' }}>
          {pageHubs.map((hub) => {
            const docCount = (hub as any).treeNodes?.filter((n: any) => n.type === 'file').length || 0;
            const updatedRel = formatDistanceToNow(new Date(hub.updatedAt), { addSuffix: true });
            const isNew = Date.now() - new Date(hub.createdAt).getTime() < NEW_BADGE_MS;
            const isEditingThis = editingNameId === hub.id;
            const isOwner = user?.id === hub.createdById;
            const starred = isHubStarred(hub);
            const selected = selectedKeys.includes(hub.id);
            const accent = accentForId(hub.id);

            return (
              <div
                key={hub.id}
                role="button"
                onMouseEnter={() => setFocusedRowId(hub.id)}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('.ant-checkbox-wrapper, .dh-row-actions, .dh-name-star, .dh-name-pencil, .dh-name-edit-btn, button, input, .ant-select, .dh-inline-cell, .dh-inline-add-btn')) {
                    return;
                  }
                  openHub(hub.id);
                }}
                className={`dh-new-rowcard ${selected ? 'is-selected' : ''}`}
                style={{
                  display: 'flex', flexDirection: 'column',
                  border: '1px solid var(--border-slate-200)',
                  borderRadius: '0px',
                  background: 'var(--bg-pure-white)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  ...(selected ? { borderColor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f6' } : {})
                }}
              >
                {/* Top Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', flex: 1 }}>
                  <div className="flex items-center gap-2">
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                      <Checkbox
                        checked={selected}
                        onChange={(e) =>
                          setSelectedKeys((prev) =>
                            e.target.checked ? [...prev, hub.id] : prev.filter((k) => k !== hub.id),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(e, hub)}
                        className={`dh-name-star ${starred ? 'is-starred' : ''}`}
                      >
                        {starred ? <StarFilled style={{ fontSize: 14 }} /> : <StarOutlined style={{ fontSize: 14 }} />}
                      </button>
                    </div>
                    <div
                      className="dh-avatar"
                      style={{
                        background: isDark ? 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' : accent.from
                      }}
                    >
                      {hub.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="dh-identity-body">
                      <div className="flex items-center gap-2 group/name">
                        <span className="dh-doccount-title">{hub.name}</span>
                        {isNew && <span className="dh-new-badge" aria-label="New">NEW</span>}
                      </div>
                      <span className="dh-doccount" >
                        <span className="dh-doccount-key"> {docCount}</span>
                        <span className="dh-doccount-key">{docCount === 1 ? 'doc' : 'docs'}</span>
                        <span className="dh-doccount-val"> · Updated {updatedRel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 dh-row-actions" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Share">
                      <button type="button" onClick={(e) => handleShareHub(e, hub)} className="dh-row-action-btn" aria-label="Share">
                        <ShareAltOutlined style={{ fontSize: 14 }} />
                      </button>
                    </Tooltip>
                    <Dropdown
                      overlayClassName="create-document-menu"
                      menu={{
                        items: [
                          ...(isOwner && canUpdateDocument ? [{
                            key: 'rename',
                            label: renderRichMenuItem(<EditOutlined />, 'var(--bg-slate-100)', 'var(--text-slate-600)', 'Rename', 'Change the name of this hub'),
                            onClick: () => startNameEdit(hub)
                          }] : []),
                          {
                            key: 'star',
                            label: renderRichMenuItem(
                              starred ? <StarFilled /> : <StarOutlined />,
                              starred ? '#FEF3C7' : 'var(--bg-blue-50)',
                              starred ? '#D97706' : '#3B82F6',
                              starred ? 'Unstar' : 'Star',
                              starred ? 'Remove from your starred list' : 'Add to your starred list'
                            ),
                            onClick: () => handleToggleStar({ stopPropagation: () => { } } as any, hub)
                          },
                          ...(canDeleteDocument ? [
                            { type: 'divider' as const },
                            {
                              key: 'delete',
                              danger: true,
                              label: (
                                <ConfirmDialog
                                  tone="danger"
                                  icon={<Trash2 size={15} />}
                                  title="Delete Document Hub"
                                  description={`Are you sure you want to delete "${hub.name}"? This will move it to trash.`}
                                  confirmText="Delete"
                                  cancelText="Cancel"
                                  placement="left"
                                  onConfirm={() => executeDeleteHub(hub.id)}
                                >
                                  <div
                                    style={{
                                      margin: '-5px -12px',
                                      padding: '5px 12px',
                                      width: 'calc(100% + 24px)',
                                      height: '100%'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    {renderRichMenuItem(<Trash2 size={16} strokeWidth={2} />, '#FEE2E2', '#EF4444', 'Delete', 'Move this hub to trash', true)}
                                  </div>
                                </ConfirmDialog>
                              )
                            }
                          ] : [])
                        ]
                      }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <button type="button" className="dh-row-action-btn" aria-label="More">
                        <MoreOutlined style={{ fontSize: 14 }} />
                      </button>
                    </Dropdown>
                  </div>
                </div>

                {/* Middle Section */}
                <div className='dh-foot'>
                  <div className="dh-foot-row">
                    <span className='dh-foot-item'>
                      <span className="dh-foot-key">Created by</span>
                      <Avatar size={18} src={hub.createdBy?.avatarUrl} style={{ backgroundColor: 'var(--bg-blue-50)', color: 'var(--text-blue-500)', fontSize: 10 }}>
                        {hub.createdBy?.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <span className="dh-foot-val">{hub.createdBy?.name?.split(' ')[0] || 'Unknown'}</span>
                    </span>
                    <span className="dh-foot-div" />
                    <span className="dh-foot-item">
                      <span className="dh-foot-key">Created</span>
                      <span className="dh-foot-val">{format(new Date(hub.createdAt), "MMM d, yyyy · h:mm a")}</span>
                    </span>
                    <span className="dh-foot-div" />
                    <span className="dh-foot-item">
                      <span className="dh-foot-key">Updated</span>
                      <span className="dh-foot-val">{format(new Date(hub.updatedAt), "MMM d, yyyy · h:mm a")}</span>
                    </span>
                  </div>

                  {/* Bottom Section */}
                  <div className='dh-foot-row'>
                    <span className="dh-foot-item">
                      <span className="dh-foot-key">Project:</span>
                      <div onClick={(e) => e.stopPropagation()} >
                        <InlineProjectSelector
                          record={hub}
                          projects={projects}
                          projectsLoading={projectsLoading}
                          updateHub={(id: string, updateData: any) => updateHub(id, updateData)}
                          user={user}
                        />
                      </div>
                    </span>
                    <span className='dh-foot-div' />
                    <span className="dh-foot-item">
                      <span className="dh-foot-key">Ticket:</span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <InlineTicketSelector
                          record={hub}
                          updateHub={(id: string, updateData: any) => updateHub(id, updateData)}
                          user={user}
                        />
                      </div>
                    </span>
                    <span className='dh-foot-div' />
                    <span className="dh-foot-item">
                      <span className="dh-foot-key">Visibility:</span>
                      <div onClick={(e) => e.stopPropagation()}>
                        {renderVisibilityCell(hub)}
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <MainLayout noPadding>
      {contextHolder}
      {modalContextHolder}
      <div className="dh-shell">
        {/* Mobile drawer backdrop */}
        <div
          className={`dh-sidebar-backdrop ${mobileSidebarOpen ? 'is-open' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
        {/* ===================== Left sidebar ===================== */}
        <aside className={`dh-sidebar ${mobileSidebarOpen ? 'is-mobile-open' : ''}`}>
          <div className="dh-sidebar-top">
            <div className="dh-sidebar-brand">
              <div className="dh-hero-icon-box">
                <FileTextOutlined style={{ fontSize: 24, color: 'var(--text-slate-900)' }} />
              </div>
              <div className="min-w-0">
                <h1 className="dh-sidebar-title">Document Hub</h1>
                <p className="dh-sidebar-subtitle">Wiki · specs · runbooks</p>
              </div>
            </div>

            {canCreateDocument && (
              <Dropdown
                trigger={['hover', 'click']}
                placement="bottomLeft"
                overlayClassName="create-document-menu"
                menu={{
                  items: [
                    {
                      key: 'manual',
                      label: (
                        <div className="flex items-start gap-3 py-1.5 pr-2" style={{ minWidth: 290 }}>
                          <div
                            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 text-white"
                            style={{
                              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)',
                            }}
                          >
                            <FileTextOutlined style={{ fontSize: 15 }} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-slate-900)' }}>
                              Manual creation
                            </span>
                            <span className="text-[11.5px] leading-snug mt-0.5" style={{ color: 'var(--text-slate-400)' }}>
                              Start from a blank document hub
                            </span>
                          </div>
                        </div>
                      ),
                      onClick: () => setModalVisible(true),
                    },
                    {
                      key: 'zai',
                      label: (
                        <div className="flex items-start gap-3 py-1.5 pr-2" style={{ minWidth: 290 }}>
                          <div
                            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 text-white relative"
                            style={{
                              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                              boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)',
                            }}
                          >
                            <span style={{ fontSize: 15, lineHeight: 1 }}>✨</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-slate-900)' }}>
                                Create with Zai
                              </span>
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded"
                                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', color: '#fff' }}
                              >
                                AI
                              </span>
                            </div>
                            <span className="text-[11.5px] leading-snug mt-0.5" style={{ color: 'var(--text-slate-400)' }}>
                              Generate a hub from a prompt
                            </span>
                          </div>
                        </div>
                      ),
                      onClick: () => setAiModalVisible(true),
                    },
                  ] as MenuProps['items'],
                }}
              >
                <Button type="primary" icon={<PlusOutlined />} className="dh-side-create" block>
                  Create Document
                </Button>
              </Dropdown>
            )}
          </div>

          <div className="dh-sidebar-scroll">
            {/* Saved views */}
            {documentHubs.length > 0 && (
              <div className="dh-side-group">
                <div className="dh-side-label">Views</div>
                <div className="flex flex-col gap-0.2" >
                  {savedViews.map((sv) => {
                    const active = savedView === sv.key;
                    return (
                      <button
                        key={sv.key}
                        type="button"
                        onClick={() => { setSavedView(sv.key); setMobileSidebarOpen(false); }}
                        className={`dh-side-view ${active ? 'active' : ''}`}
                        style={active ? ({ background: `${sv.color}14` } as any) : undefined}
                      >
                        <span className="dh-side-view-icon" style={{ color: active ? sv.color : 'var(--text-slate-400)' }}>
                          {sv.icon}
                        </span>
                        <span className="dh-side-view-label">{sv.label}</span>
                        <span
                          className="dh-side-view-count"
                          style={active ? { background: `${sv.color}30`, color: sv.color } : undefined}
                        >
                          {viewCounts[sv.key]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="dh-side-group">
              <div className="dh-side-label">Filters</div>
              <div className="dh-side-filters flex flex-col gap-2">
                <SearchableDropdown
                  value={filterProjectId}
                  onChange={(v) => setFilterProjectId(v)}
                  placeholder="Project"
                  searchPlaceholder="Search by name or code"
                  itemNoun="projects"
                  loading={projectsLoading}
                  width="100%"
                  style={{ width: '100%' }}
                  options={projects.map((p: any) => ({ value: p.value, label: p.label, description: p.code }))}
                />
                <SearchableDropdown
                  value={filterTicketId}
                  onChange={(v) => setFilterTicketId(v)}
                  placeholder="Ticket"
                  searchPlaceholder="Search by number or title"
                  itemNoun="tickets"
                  loading={filterTicketsLoading}
                  width="100%"
                  style={{ width: '100%' }}
                  options={(() => {
                    const source = filterProjectId
                      ? filterTickets
                      : Array.from(
                        new Map(
                          documentHubs
                            .filter((hub) => hub.ticket)
                            .map((hub) => [hub.ticket!.id, hub.ticket]),
                        ).values(),
                      );
                    return (source as any[]).map((t: any) => ({ value: t.id, label: t.ticketNumber, description: t.title }));
                  })()}
                />
                <SearchableDropdown
                  value={selectedUser}
                  onChange={(v) => setSelectedUser(v)}
                  placeholder="Created by"
                  searchPlaceholder="Search by name"
                  itemNoun="people"
                  loading={membersLoading}
                  width="100%"
                  style={{ width: '100%' }}
                  options={members.map((m: any) => ({
                    value: m.value,
                    label: m.label,
                    badge: (
                      <Avatar
                        src={m.avatarUrl || undefined}
                        size={20}
                        style={{
                          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                          fontSize: 9,
                          fontWeight: 800,
                        }}
                      >
                        {(m.label || "?").charAt(0).toUpperCase()}
                      </Avatar>
                    )
                  }))}
                />
                <RangePicker
                  className="premium-range-picker"
                  style={{ width: '100%', background: 'var(--bg-pure-white)', height: 32 }}
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as any)}
                />
                {(filterProjectId || filterTicketId || selectedUser || (dateRange && (dateRange[0] || dateRange[1])) || searchText) && (
                  <button
                    type="button"
                    className="dh-side-clear"
                    onClick={() => {
                      setSearchText('');
                      setFilterProjectId(undefined);
                      setFilterTicketId(undefined);
                      setSelectedUser(undefined);
                      setDateRange(null);
                    }}
                  >
                    <CloseCircleOutlined style={{ fontSize: 12 }} />
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Pinned */}
            {/* {pinnedHubs.length > 0 && (
              <div className="dh-side-group">
                <div className="dh-side-label">Pinned</div>
                <div className="flex flex-col gap-0.5">
                  {pinnedHubs.slice(0, 6).map((h) => {
                    const ac = accentForId(h.id);
                    return (
                      <button key={h.id} type="button" className="dh-side-hub" onClick={() => openHub(h.id)} title={h.name}>
                        <span className="dh-side-hub-dot" style={{ background: `linear-gradient(135deg, ${ac.from} 0%, ${ac.to} 100%)` }} />
                        <span className="dh-side-hub-name truncate">{h.name}</span>
                        <StarFilled style={{ fontSize: 10, color: '#f59e0b' }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )} */}

            {/* Recent */}
            {recentHubs.length > 0 && (
              <div className="dh-side-group">
                <div className="dh-side-label">{recentIds.length ? 'Recently opened' : 'Recently updated'}</div>
                <div className="flex flex-col gap-0.5">
                  {recentHubs.slice(0, 5).map((h) => {
                    const docCount = (h as any).treeNodes?.filter((n: any) => n.type === 'file').length || 0;
                    const updatedRel = formatDistanceToNow(new Date(h.updatedAt), { addSuffix: true });
                    return (
                      <button key={h.id} type="button" className="dh-recent-item" onClick={() => openHub(h.id)} title={h.name}>
                        <span className="dh-recent-icon">
                          <FileTextOutlined style={{ fontSize: 12 }} />
                        </span>
                        <span className="dh-recent-body">
                          <span className="dh-recent-name truncate">{h.name}</span>
                          <span className="dh-recent-meta truncate">
                            {docCount} {docCount === 1 ? 'doc' : 'docs'} · {updatedRel}
                          </span>
                        </span>
                        {isHubStarred(h) && <StarFilled style={{ fontSize: 10, color: '#f59e0b' }} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {canDeleteDocument && (
            <button type="button" className="dh-side-trash" onClick={() => setTrashVisible(true)}>
              <Trash2 size={16} strokeWidth={2} />
              <span>Trash</span>
            </button>
          )}
        </aside>

        {/* ===================== Main pane ===================== */}
        <main className="dh-main">
          {/* Top bar: search · live stats · view controls */}
          <div className="dh-main-topbar">
            <Tooltip title="Views & filters">
              <Button
                className="dh-mobile-menu-btn"
                icon={<MenuOutlined />}
                onClick={() => setMobileSidebarOpen((v) => !v)}
                aria-label="Open views and filters"
                style={{ height: 38, width: 38, borderRadius: 10 }}
              />
            </Tooltip>
            <div className="pp-search-wrap" style={{ maxWidth: 320, flex: 1 }}>
              <SearchOutlined className="pp-search-icon" />
              <input
                className="pp-search"
                placeholder="Search hubs, docs, tickets…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {/* {!searchText && <span className="pp-kbd">⌘K</span>} */}
            </div>

            <div className="dh-main-stats">
              <span className="inline-flex items-center gap-1.5">
                <span className="dh-pulse-dot" />
                <span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>{documentHubs.length}</span> hubs
              </span>
              <span style={{ color: 'var(--text-slate-300)' }}>·</span>
              <span><span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>{totalDocCount}</span> docs</span>
              {lastUpdated && (
                <>
                  <span style={{ color: 'var(--text-slate-300)' }} className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">Updated {lastUpdated}</span>
                </>
              )}
            </div>

            <div className="dh-main-controls">
              <div className="dh-segmented">
                <button type="button" className={viewMode === 'cards' ? 'is-active' : ''} onClick={() => setViewMode('cards')} aria-label="Cards view"><AppstoreOutlined /></button>
                <button type="button" className={viewMode === 'table' ? 'is-active' : ''} onClick={() => setViewMode('table')} aria-label="Table view"><UnorderedListOutlined /></button>
              </div>
              {viewMode === 'table' && (
                <Popover
                  trigger={['click']}
                  placement="bottomRight"
                  classNames={{ root: 'dh-table-settings-popover' }}
                  content={
                    <div style={{ width: 240 }}>
                      <div className="dh-popover-section-label">
                        <ColumnHeightOutlined style={{ fontSize: 11 }} />
                        <span>Density</span>
                      </div>
                      <Segmented
                        block
                        value={density}
                        onChange={(v) => setDensity(v as Density)}
                        options={[
                          { label: 'Compact', value: 'compact' },
                          { label: 'Cozy', value: 'comfortable' },
                          { label: 'Roomy', value: 'spacious' },
                        ]}
                      />
                      <div className="dh-popover-section-label" style={{ marginTop: 14 }}>
                        <UnorderedListOutlined style={{ fontSize: 11 }} />
                        <span>Columns</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {TOGGLEABLE_COLUMNS.map((c) => (
                          <label key={c.key} className="dh-col-toggle-row flex items-center justify-between gap-2">
                            <span className="text-[12.5px]" style={{ color: 'var(--text-slate-700)' }}>{c.label}</span>
                            <Switch
                              size="small"
                              checked={!hiddenCols[c.key]}
                              onChange={(checked) => setHiddenCols((prev) => ({ ...prev, [c.key]: !checked }))}
                            />
                          </label>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-slate-200)' }}>
                        <button
                          type="button"
                          onClick={() => { setColWidths(DEFAULT_COL_WIDTHS); setHiddenCols({}); setDensity('comfortable'); }}
                          className="text-[11.5px] font-semibold"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                        >
                          Reset to defaults
                        </button>
                        <span className="text-[10.5px]" style={{ color: 'var(--text-slate-400)' }}>Saved automatically</span>
                      </div>
                    </div>
                  }
                >
                  <Tooltip title="Table settings">
                    <button type="button" className="pp-ghost-btn">
                      <SettingOutlined />
                    </button>
                  </Tooltip>
                </Popover>
              )}
              <Tooltip title="Refresh hubs">
                <button type="button" className="pp-ghost-btn" onClick={handleReload}>
                  <ReloadOutlined spin={hubsFetching} />
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Compact stats strip */}
            <div className="dh-stats-wrap">
              <DocumentHubDashboard
                documentHubs={documentHubs}
                isLoading={hubsLoading || hubsFetching}
                onHubClick={openHub}
                onShareHub={handleShareHub}
              />
            </div>

            {/* View body */}
            <div className="dh-main-body">
              {hubsLoading && !documentHubs.length ? (
                <div className="flex items-center justify-center py-16">
                  <LoadingSpinner fullScreen={false} />
                </div>
              ) : viewMode === 'cards' ? renderRowCards()
                : renderTable()}
            </div>
          </div>

          {/* Fixed pagination footer (Cards & Table views) */}
          {!(hubsLoading && !documentHubs.length) && filteredHubs.length > 0 && (() => {
            const total = filteredHubs.length;
            const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
            const curPage = Math.min(tablePage, pageCount);
            const start = (curPage - 1) * tablePageSize + 1;
            const end = Math.min(curPage * tablePageSize, total);
            return (
              <div className="dh-main-footer">
                <div className="dh-footer-summary">
                  Showing <span className="dh-footer-strong">{start}–{end}</span> of{' '}
                  <span className="dh-footer-strong">{total}</span> hub{total === 1 ? '' : 's'}
                  {starredVisibleCount > 0 && (
                    <>
                      <span style={{ display: 'inline-block', width: 1, height: 14, backgroundColor: '#cbd5e1', margin: '0 10px', verticalAlign: 'middle' }} />
                      <span className="inline-flex items-center gap-1" style={{ color: '#b45309' }}>
                        <StarFilled style={{ fontSize: 10 }} /> {starredVisibleCount} starred
                      </span>
                    </>
                  )}
                  {sharedWithMeCount > 0 && (
                    <>
                      <span style={{ display: 'inline-block', width: 1, height: 14, backgroundColor: '#cbd5e1', margin: '0 10px', verticalAlign: 'middle' }} />
                      <span style={{ color: 'var(--text-slate-600)' }}>{sharedWithMeCount} shared with you</span>
                    </>
                  )}
                </div>
                <Pagination
                  current={curPage}
                  pageSize={tablePageSize}
                  total={total}
                  showSizeChanger
                  pageSizeOptions={[10, 20, 25, 50, 100]}
                  onChange={(p, size) => { setTablePage(p); setTablePageSize(size); }}
                />
              </div>
            );
          })()}
        </main>
      </div>

      {/* === Modals (unchanged structure) === */}
      <Modal
        open={modalVisible}
        onCancel={() => {
          if (isCreating) return;
          setModalVisible(false);
          setSelectedProjectId(undefined);
          form.resetFields();
        }}
        title={null}
        footer={null}
        closable={false}
        width={520}
        centered
        styles={{
          mask: { backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.45)' },
          content: { borderRadius: 18, padding: 0, overflow: 'hidden' },
          body: { padding: 0 },
        }}
      >
        <div
          className="px-6 pt-5 pb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(99, 102, 241, 0.04) 100%)',
            borderBottom: '1px solid var(--border-slate-200)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center shrink-0 text-white"
              style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              <FileZipOutlined style={{ fontSize: 18 }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-bold tracking-tight m-0" style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}>
                Create new document hub
              </h2>
              <p className="m-0 mt-0.5 text-[12.5px]" style={{ color: 'var(--text-slate-400)' }}>
                A hub is a workspace for grouping related documents — wiki, specs, runbooks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isCreating) return;
                setModalVisible(false);
                setSelectedProjectId(undefined);
                form.resetFields();
              }}
              disabled={isCreating}
              className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
              style={{
                width: 30, height: 30,
                color: 'var(--text-slate-400)',
                background: 'transparent',
                border: 'none',
                cursor: isCreating ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (isCreating) return;
                e.currentTarget.style.background = 'var(--bg-slate-100)';
                e.currentTarget.style.color = 'var(--text-slate-700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-slate-400)';
              }}
              aria-label="Close"
            >
              <PlusOutlined style={{ fontSize: 13, transform: 'rotate(45deg)' }} />
            </button>
          </div>
        </div>

        <div className="px-6 pt-5 pb-2">
          <Form form={form} layout="vertical" onFinish={handleAddDocument} autoComplete="off">
            <Form.Item
              name="name"
              label={
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--text-slate-400)' }}>
                  Hub name
                </span>
              }
              rules={[
                { required: true, message: 'Please enter a hub name' },
                { min: 2, message: 'Name must be at least 2 characters' },
                { max: 80, message: 'Up to 80 characters' },
              ]}
              className="mb-4"
            >
              <Input
                size="large"
                autoFocus
                autoComplete="off"
                placeholder="e.g., Payments API documentation"
                prefix={<FileTextOutlined style={{ color: 'var(--text-slate-400)', fontSize: 13 }} />}
                style={{
                  borderRadius: 10, fontSize: 13.5, height: 42,
                  background: 'var(--bg-pure-white)',
                  borderColor: 'var(--border-slate-200)',
                  color: 'var(--text-slate-900)',
                }}
              />
            </Form.Item>

            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-2 mt-2" style={{ color: 'var(--text-slate-400)' }}>
              Link to work <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· optional</span>
            </div>

            <Row gutter={[12, 0]}>
              <Col span={24}>
                <Form.Item name="projectId" className="mb-3">
                  <SearchableDropdown
                    placeholder="Select a project"
                    searchPlaceholder="Search by name or code"
                    itemNoun="projects"
                    loading={projectsLoading}
                    onChange={(value) => {
                      setSelectedProjectId(value);
                      form.setFieldsValue({ projectId: value, ticketId: undefined });
                    }}
                    options={projects.map((project) => ({
                      value: project.value,
                      label: project.label,
                      description: project.code,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="ticketId" className="mb-2">
                  <SearchableDropdown
                    placeholder={
                      selectedProjectId ? 'Select a ticket' : 'Pick a project first to link a ticket'
                    }
                    searchPlaceholder="Search by number or title"
                    itemNoun="tickets"
                    loading={ticketsLoading}
                    disabled={!selectedProjectId}
                    options={tickets.map((ticket: any) => ({
                      value: ticket.id,
                      label: ticket.ticketNumber,
                      description: ticket.title,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div
              className="flex items-start gap-2 px-3 py-2 rounded-lg mt-3"
              style={{ background: 'var(--bg-blue-50)', border: '1px solid var(--border-blue-200)' }}
            >
              <ProjectOutlined style={{ color: 'var(--text-blue-700)', fontSize: 12, marginTop: 3 }} />
              <span className="text-[11.5px] leading-snug" style={{ color: 'var(--text-slate-600)' }}>
                Linking a project or ticket attaches this hub's docs to that work item, so
                they show up alongside it everywhere else in Zukvo.
              </span>
            </div>
          </Form>
        </div>

        <div
          className="flex items-center justify-end gap-2 px-6 py-3 mt-2"
          style={{ borderTop: '1px solid var(--border-slate-200)', background: 'var(--bg-secondary)' }}
        >
          <Button
            onClick={() => {
              if (isCreating) return;
              setModalVisible(false);
              setSelectedProjectId(undefined);
              form.resetFields();
            }}
            disabled={isCreating}
            style={{ borderRadius: 9, height: 36, fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={isCreating}
            icon={!isCreating ? <PlusOutlined /> : undefined}
            style={{
              borderRadius: 9, height: 36, paddingInline: 18, fontWeight: 600,
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            Create hub
          </Button>
        </div>
      </Modal>

      {selectedHubForShare && (
        <ShareModal
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedHubForShare(null);
            refetch();
          }}
          entityId={selectedHubForShare.id}
          entityTitle={selectedHubForShare.title}
          entityType="hub"
          currentVisibility={selectedHubForShare.visibility}
          currentShareToken={selectedHubForShare.shareToken}
        />
      )}

      <TrashDrawer open={trashVisible} onClose={() => setTrashVisible(false)} />

      <AiCreateHubModal
        open={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        onCreated={(hubId) => {
          setAiModalVisible(false);
          queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
          router.push(`/documenthub/${hubId}`);
        }}
      />

      {/* === #A Floating bulk actions bar === */}
      <div
        className={`dh-bulk-bar ${selectedCount > 0 ? 'dh-bulk-bar-visible' : ''}`}
        role="toolbar"
        aria-label="Bulk hub actions"
        aria-hidden={selectedCount === 0}
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center text-white font-bold"
            style={{
              minWidth: 28, height: 28, padding: '0 8px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
              fontSize: 12,
            }}
          >
            {selectedCount}
          </span>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-slate-900)' }}>
            {selectedCount === 1 ? '1 hub selected' : `${selectedCount} hubs selected`}
          </span>
          {ownedSelectedCount < selectedCount && (
            <Tooltip title="You can only edit hubs you own — non-owned hubs in your selection will be skipped.">
              <span
                className="text-[10.5px] font-semibold px-1.5 py-[2px] rounded-full"
                style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309' }}
              >
                {ownedSelectedCount} editable
              </span>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-1">
          {canUpdateDocument && (
            <>
              <Tooltip title="Make public">
                <Button
                  size="small"
                  icon={<GlobalOutlined />}
                  onClick={() => bulkSetVisibility('public')}
                  loading={bulkBusy}
                  className="dh-bulk-btn"
                >
                  Public
                </Button>
              </Tooltip>
              <Tooltip title="Make private">
                <Button
                  size="small"
                  icon={<LockOutlined />}
                  onClick={() => bulkSetVisibility('private')}
                  loading={bulkBusy}
                  className="dh-bulk-btn"
                >
                  Private
                </Button>
              </Tooltip>
              <Tooltip title="Move to project">
                <Button
                  size="small"
                  icon={<ProjectOutlined />}
                  onClick={() => setBulkProjectModalOpen(true)}
                  className="dh-bulk-btn"
                >
                  Project
                </Button>
              </Tooltip>
            </>
          )}
          <Tooltip title="Add to starred">
            <Button
              size="small"
              icon={<StarFilled style={{ color: '#f59e0b' }} />}
              onClick={() => bulkSetStar(true)}
              loading={bulkBusy}
              className="dh-bulk-btn"
            >
              Star
            </Button>
          </Tooltip>
          <Tooltip title="Remove star">
            <Button
              size="small"
              icon={<StarOutlined />}
              onClick={() => bulkSetStar(false)}
              loading={bulkBusy}
              className="dh-bulk-btn"
            >
              Unstar
            </Button>
          </Tooltip>
          {canDeleteDocument && (
            <>
              <div className="dh-bulk-divider" aria-hidden />
              <Tooltip title="Move to trash">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={bulkDelete}
                  loading={bulkBusy}
                  className="dh-bulk-btn dh-bulk-btn-danger"
                >
                  Delete
                </Button>
              </Tooltip>
            </>
          )}
          <div className="dh-bulk-divider" aria-hidden />
          <Tooltip title="Clear selection (Esc)">
            <button
              type="button"
              onClick={() => setSelectedKeys([])}
              className="dh-bulk-clear"
              aria-label="Clear selection"
            >
              <CloseOutlined style={{ fontSize: 12 }} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* === #A Bulk move-to-project modal === */}
      <Modal
        open={bulkProjectModalOpen}
        onCancel={() => { if (!bulkBusy) { setBulkProjectModalOpen(false); setBulkProjectId(undefined); } }}
        title={null}
        footer={null}
        closable={false}
        width={440}
        centered
        styles={{
          mask: { backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.45)' },
          content: { borderRadius: 16, padding: 0, overflow: 'hidden' },
          body: { padding: 0 },
        }}
      >
        <div
          className="px-5 pt-5 pb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(168, 85, 247, 0.04) 100%)',
            borderBottom: '1px solid var(--border-slate-200)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center shrink-0 text-white"
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.30)',
              }}
            >
              <ProjectFilled style={{ fontSize: 16 }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="m-0 text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-slate-900)' }}>
                Move {ownedSelectedCount} hub{ownedSelectedCount === 1 ? '' : 's'} to a project
              </h2>
              <p className="m-0 mt-0.5 text-[12px]" style={{ color: 'var(--text-slate-500)' }}>
                Pick a project — or clear to unassign.
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 pt-4 pb-5">
          <SearchableDropdown
            placeholder="Select a project (or leave empty to unassign)"
            searchPlaceholder="Search by name or code"
            itemNoun="projects"
            value={bulkProjectId}
            onChange={(v) => setBulkProjectId(v)}
            loading={projectsLoading}
            options={projects.map((p: any) => ({
              value: p.value,
              label: p.label,
              description: p.code,
            }))}
          />
        </div>
        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: '1px solid var(--border-slate-200)', background: 'var(--bg-secondary)' }}
        >
          <Button
            onClick={() => { setBulkProjectModalOpen(false); setBulkProjectId(undefined); }}
            disabled={bulkBusy}
            style={{ borderRadius: 9, height: 34, fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            loading={bulkBusy}
            onClick={bulkApplyProject}
            style={{
              borderRadius: 9, height: 34, paddingInline: 16, fontWeight: 600,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.30)',
            }}
          >
            Apply
          </Button>
        </div>
      </Modal>

      {/* === #7 First-run feature tour === */}
      <Modal
        open={tourOpen && !authLoading && canReadDocument}
        onCancel={dismissTour}
        title={null}
        footer={null}
        closable={false}
        width={620}
        centered
        styles={{
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.55)' },
          content: { borderRadius: 22, padding: 0, overflow: 'hidden' },
          body: { padding: 0 },
        }}
      >
        <div
          className="relative px-7 pt-7 pb-5"
          style={{
            background:
              'linear-gradient(135deg, rgba(59, 130, 246, 0.10) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(236, 72, 153, 0.06) 100%)',
            borderBottom: '1px solid var(--border-slate-200)',
          }}
        >
          <div
            aria-hidden
            className="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }}
          />
          <div className="flex items-start gap-3 relative">
            <div
              className="flex items-center justify-center shrink-0 text-white"
              style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <FileZipOutlined style={{ fontSize: 22 }} />
            </div>
            <div className="flex-1 min-w-0">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.12em] inline-block px-2 py-[2px] rounded-md mb-1"
                style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' }}
              >
                Welcome
              </span>
              <h2 className="m-0 text-[20px] font-extrabold tracking-tight" style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}>
                The Document Hub, in 30 seconds
              </h2>
              <p className="m-0 mt-1 text-[13px]" style={{ color: 'var(--text-slate-600)' }}>
                Your team's knowledge base — wiki, specs, runbooks — wired directly to the work it documents.
              </p>
            </div>
          </div>
        </div>

        <div className="px-7 py-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: <FolderOutlined />, color: '#3B82F6', tint: 'rgba(59,130,246,0.10)',
              title: 'Hubs group your docs',
              body: 'A hub is a workspace — think one per service, project, or team area.'
            },
            {
              icon: <ThunderboltOutlined />, color: '#10B981', tint: 'rgba(16,185,129,0.10)',
              title: 'Linked to projects & tickets',
              body: 'Attach a hub to a project or ticket and it shows up alongside the work everywhere.'
            },
            {
              icon: <RobotOutlined />, color: '#8B5CF6', tint: 'rgba(139,92,246,0.10)',
              title: 'Generate with Zai',
              body: 'Skip the blank page — describe what you need and Zai drafts the structure for you.'
            },
          ].map((step, i) => (
            <div
              key={i}
              className="rounded-2xl p-3.5 flex flex-col gap-2"
              style={{ border: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)' }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: 34, height: 34, borderRadius: 10, background: step.tint, color: step.color }}
              >
                {step.icon}
              </div>
              <div className="text-[12.5px] font-bold leading-tight" style={{ color: 'var(--text-slate-900)' }}>
                {step.title}
              </div>
              <div className="text-[11.5px] leading-snug" style={{ color: 'var(--text-slate-500)' }}>
                {step.body}
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between gap-2 px-7 py-3.5"
          style={{ borderTop: '1px solid var(--border-slate-200)', background: 'var(--bg-secondary)' }}
        >
          <span className="text-[11.5px]" style={{ color: 'var(--text-slate-500)' }}>
            Tip: press <kbd className="dh-kbd">j</kbd> / <kbd className="dh-kbd">k</kbd> to move and <kbd className="dh-kbd">Enter</kbd> to open a hub.
          </span>
          <Space>
            <Button onClick={dismissTour} style={{ borderRadius: 9, height: 36, fontWeight: 500 }}>
              Skip
            </Button>
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={() => { dismissTour(); setModalVisible(true); }}
              style={{
                borderRadius: 9, height: 36, paddingInline: 16, fontWeight: 600,
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              Create my first hub
            </Button>
          </Space>
        </div>
      </Modal>

      <style jsx global>{`
        /* ===================== Side-layout shell ===================== */
        .dh-shell {
          margin: 0;
          display: flex;
          align-items: stretch;
          min-height: calc(100vh - 54px);
          background: var(--bg-pure-white);
        }

        /* ----------------------- Sidebar ----------------------- */
        .dh-sidebar {
          position: sticky;
          top: 0;
          align-self: flex-start;
          height: calc(100vh - 54px);
          width: 240px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-slate-200);
        }
        .dh-sidebar-top {
          padding: 14px 12px 12px 12px;
        }
        .dh-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 14px;
          margin-bottom: 10px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .dh-sidebar-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--text-slate-900);
        }
        .dh-sidebar-subtitle {
          font-size: 10.5px;
          color: var(--text-slate-400);
          font-weight: 700;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .dh-side-create {
          height: 36px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          background: linear-gradient(135deg, #3B82F6 0%, #3B82F6 100%) !important;
          border: none !important;
          // box-shadow: 0 4px 12px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.18) !important;
        }
        /* removed dh-side-create dark override */
        .dh-sidebar-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 10px 10px 6px 12px;
          scrollbar-width: none;        /* Firefox */
          -ms-overflow-style: none;     /* IE/Edge legacy */
        }
        .dh-sidebar-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
        .dh-side-filters .sd-trigger {
          height: 32px !important;
          min-height: 32px !important;
          font-size: 13px;
        }
        .premium-range-picker {
          border-radius: 6px !important;
          border: 1px dashed var(--border-slate-200) !important;
        }
        .dh-side-group { margin-bottom: 13px; }
        .dh-side-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 8px;
          margin-bottom: 8px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-slate-400);
        }
        /* Saved-view rows */
        .dh-side-view {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 7px 10px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-slate-600);
          transition: background 0.15s, color 0.15s;
        }
        .dh-side-view:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .dh-side-view.active {
          color: var(--text-slate-900);
          font-weight: 600;
        }
        .dh-side-view-icon { display: inline-flex; font-size: 14px; width: 18px; justify-content: center; }
        .dh-side-view-label { flex: 1; text-align: left; }
        .dh-side-view-count {
          font-size: 12px;
          font-weight: 600;
          padding: 1px 8px;
          border-radius: 6px;
          background: transparent;
          color: var(--text-slate-400);
        }
        .dh-side-clear {
          display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
          background: none; border: none; cursor: pointer; padding: 3px;
          font-size: 12px; font-weight: 600; color: #ef4444; margin-top: 6px;
        }
        .dh-side-clear:hover { opacity: 0.8; }
        /* Pinned / recent hub items */
        .dh-side-hub {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          height: 29px;
          padding: 0 10px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dh-side-hub:hover { background: var(--bg-slate-100); }
        .dh-side-hub-dot { width: 8px; height: 8px; border-radius: 3px; flex-shrink: 0; }
        .dh-side-hub-name {
          flex: 1;
          text-align: left;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text-slate-700);
        }
        /* Recently-opened items (icon + name + meta) */
        .dh-recent-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 5px 8px;
          border: none;
          background: transparent;
          border-radius: 9px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .dh-recent-item:hover { background: var(--bg-slate-100); }
        .dh-recent-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: rgba(59, 130, 246, 0.10);
          color: #3B82F6;
          flex-shrink: 0;
        }
        .dh-recent-body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .dh-recent-name {
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.25;
          color: var(--text-slate-800, #1e293b);
        }
        .dh-recent-meta {
          font-size: 10px;
          line-height: 1.25;
          color: var(--text-slate-400);
        }
        .dh-side-trash {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0 0px 0px 0px;
          padding: 26px 22px;
          height: 38px;
          border-top: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          color: var(--text-slate-600);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .dh-side-trash:hover { color: #ef4444; border-color: #fecaca; }

        /* ----------------------- Main pane ----------------------- */
        .dh-main {
          flex: 1;
          min-width: 0;
          height: calc(100vh - 54px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .dh-main-topbar {
          flex-shrink: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 4px 20px;
          min-height: 50px;
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
        }
        .dh-main-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }
        .dh-main-footer {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 24px;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.04);
        }
        .dh-footer-summary {
          font-size: 13px;
          color: var(--text-slate-500);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          flex-shrink: 1;
        }
        .dh-footer-strong { font-weight: 700; color: var(--text-slate-700); }
        
        /* Custom Pagination Styles */
        .dh-main-footer .ant-pagination {
          display: flex;
          align-items: center;
          flex-wrap: nowrap !important;
          flex-shrink: 0;
        }
        .dh-main-footer .ant-pagination-item,
        .dh-main-footer .ant-pagination-prev .ant-pagination-item-link,
        .dh-main-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500) !important;
        }
        .dh-main-footer .ant-pagination-item-active {
          background: #3b82f6 !important; /* using standard blue accent */
          border-color: #3b82f6 !important;
        }
        .dh-main-footer .ant-pagination-item-active a {
          color: #fff !important;
        }
        .dh-main-footer .ant-select-selector {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          color: var(--text-slate-500) !important;
        }
        
        .dh-main-search { width: 320px; max-width: 42%; flex-shrink: 0; }
        .premium-search-input {
          border-radius: 6px;
        }
        .dh-search-kbd {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          padding: 2px 6px;
          border-radius: 6px;
          color: var(--text-slate-400);
          background: var(--bg-slate-100);
          border: 1px solid var(--border-slate-200);
        }
        .dh-main-stats {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-slate-500);
          white-space: nowrap;
          overflow: hidden;
        }
        .dh-main-controls {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .dh-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .dh-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .dh-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
        .pp-search-wrap {
          position: relative; flex: 1; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900); min-width: 0;
        }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-kbd {
          font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          border-radius: 5px; padding: 1px 6px;
        }
        .pp-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }
        .dh-stats-wrap { padding: 12px 20px 0 20px; }
        .dh-main-body { padding: 0px 20px 14px 20px; }

        /* ----------------------- Row-cards view ----------------------- */
        .dh-rowcards-wrap { width: 100%; overflow-x: auto; }
        .dh-new-rowcard:hover {
          border-color: var(--border-slate-300, #cbd5e1) !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05) !important;
        }
        [data-theme='dark'] .dh-new-rowcard {
          background: var(--bg-slate-50) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        [data-theme='dark'] .dh-new-rowcard:hover {
          border-color: rgba(255, 255, 255, 0.16) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        }

        /* Mobile drawer pieces (inert on desktop) */
        .dh-mobile-menu-btn { display: none !important; }
        .dh-sidebar-backdrop { display: none; }

        /* ---------- Responsive ---------- */
        @media (max-width: 1280px) {
          .dh-sidebar { width: 244px; }
          .dh-main-search { width: 280px; }
        }
        @media (max-width: 1100px) {
          .dh-sidebar { width: 228px; }
          .dh-main-search { width: 230px; max-width: 40%; }
          .dh-main-stats { display: none; }
        }
        @media (max-width: 860px) {
          .dh-shell {
            display: block;
            margin: 0;
            padding-left: 0;
            gap: 0;
          }
          /* Sidebar becomes a slide-in drawer */
          .dh-sidebar {
            position: fixed;
            top: 54px; left: 0; bottom: 0;
            height: auto;
            width: 286px;
            max-width: 86vw;
            margin: 0;
            border-radius: 0 18px 18px 0;
            border-left: none;
            transform: translateX(-103%);
            transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1200;
          }
          .dh-sidebar.is-mobile-open {
            transform: translateX(0);
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
          }
          .dh-sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 54px 0 0 0;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(2px);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.26s ease;
            z-index: 1150;
          }
          .dh-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }
          .dh-main-topbar { flex-wrap: wrap; padding: 8px 14px; min-height: 0; }
          .dh-mobile-menu-btn {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-200);
            color: var(--text-slate-700);
            order: 0;
          }
          .dh-main-search { width: 100%; max-width: none; order: 5; flex: 1 1 100%; }
          .dh-main-controls { order: 2; margin-left: auto; }
        }
        @media (max-width: 900px) {
          .dh-main-footer { padding: 10px 14px; gap: 8px; }
          .dh-footer-summary { font-size: 12px; }
          .dh-main-footer .ant-pagination { flex-wrap: nowrap !important; }
        }
        @media (max-width: 640px) {
          .dh-main-body { padding: 8px 12px 14px 12px; }
          .dh-stats-wrap { padding: 10px 12px 0 12px; }
          .dh-main-footer { flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; }
          .dh-footer-summary { text-align: center; white-space: normal; overflow: visible; }
          .dh-main-footer .ant-pagination { display: flex; justify-content: center; flex-wrap: wrap !important; gap: 6px; }
        }

        /* Dark-mode surfaces */
        [data-theme="dark"] .dh-shell,
        [data-theme="dark"] .dh-main { background: #0B0F1A !important; }
        [data-theme="dark"] .dh-sidebar {
          background: #0B0F1A !important;
          border-right-color: #374151 !important;
        }
        [data-theme="dark"] .dh-sidebar-brand {
          border-bottom-color: #374151 !important;
        }
        [data-theme="dark"] .dh-side-trash {
          background: #0B0F1A !important;
          border-top-color: #374151 !important;
          color: #94a3b8 !important;
        }
        [data-theme="dark"] .dh-side-trash:hover {
          color: #ef4444 !important;
          border-color: #ef4444 !important;
        }
        [data-theme="dark"] .dh-side-view {
          color: #94a3b8 !important;
        }
        [data-theme="dark"] .dh-side-view:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
        }
        [data-theme="dark"] .dh-side-view.active {
          background: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
        }
        [data-theme="dark"] .dh-side-hub-name {
          color: #94a3b8 !important;
        }
        [data-theme="dark"] .dh-side-hub:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        [data-theme="dark"] .dh-main-topbar {
          background: #0B0F1A !important;
          border-bottom-color: #374151 !important;
        }
        [data-theme="dark"] .dh-main-footer {
          background: #0B0F1A !important;
          border-top-color: #374151 !important;
          box-shadow: none !important;
        }
        [data-theme="dark"] .dh-footer-strong {
          color: #F1F5F9 !important;
        }
        [data-theme="dark"] .dh-footer-summary {
          color: #94a3b8 !important;
        }
        [data-theme="dark"] .dh-recent-item:hover { background: rgba(255, 255, 255, 0.05); }
        [data-theme="dark"] .dh-recent-icon { background: rgba(96, 165, 250, 0.18); color: #93C5FD; }
        [data-theme="dark"] .dh-recent-name { color: rgba(255, 255, 255, 0.92); }
        [data-theme="dark"] .dh-recent-meta { color: rgba(255, 255, 255, 0.5); }
        /* removed dh-mobile-menu-btn dark override */

        .premium-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
            font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
            text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
            white-space: nowrap !important;
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th {
          background: #161B22 !important;
          color: #94A3B8 !important;
          border-bottom-color: #374151 !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          padding: 8px 16px !important;
          background: var(--bg-pure-white) !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td {
          border-bottom-color: #1F2937 !important;
          background: #0B0F1A !important;
          color: #F1F5F9 !important;
        }
        .premium-table .ant-table-row:hover > td,
        .premium-table .dh-row-focused > td {
          background: #fdfdfd !important;
        }
        [data-theme='dark'] .premium-table .ant-table-row:hover > td,
        [data-theme='dark'] .premium-table .dh-row-focused > td {
          background: #161B22 !important;
        }
        .visibility-select .ant-select-selection-item {
          display: flex;
          align-items: center;
        }
        .premium-inline-select .ant-select-selector {
          padding: 0 !important;
          font-size: 11px !important;
          font-weight: 500 !important;
        }
        .premium-inline-select .ant-select-selection-placeholder {
          font-size: 11px !important;
          font-style: italic;
        }
        .premium-inline-select:hover .ant-select-selector {
          background: rgba(22, 119, 255, 0.05) !important;
          border-radius: 4px;
        }
        .create-document-menu .ant-dropdown-menu {
          padding: 4px 6px !important;
          border-radius: 0px !important;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06) !important;
          min-width: 150px !important;
        }
        .create-document-menu .ant-dropdown-menu-item {
          border-radius: 0px !important;
          padding: 4px 6px !important;
          margin-bottom: 2px !important;
        }
        .create-document-menu .ant-dropdown-menu-item:last-child {
          margin-bottom: 0 !important;
        }
        .create-document-menu .ant-dropdown-menu-item:hover {
          background: var(--bg-slate-50) !important;
        }

        /* Hero icon box (Team-View pattern) */
        .dh-hero-icon-box {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: none;
          flex-shrink: 0;
        }
        /* removed dark override */
        .dh-pulse-dot {
          width: 6px; height: 6px; border-radius: 9999px;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55);
          animation: dh-pulse 2s infinite;
          display: inline-block;
        }
        @keyframes dh-pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        /* Pills */
        .dh-pills-row::-webkit-scrollbar { height: 0; display: none; }
        .dh-hero, .dh-toolbar-wrapper, .dh-sticky-gap {
          background: var(--bg-pure-white) !important;
        }
        .dh-toolbar-wrapper { border-bottom: none !important; }
        [data-theme='dark'] .dh-hero, [data-theme='dark'] .dh-toolbar-wrapper, [data-theme='dark'] .dh-sticky-gap {
          background: #0B0F1A !important;
        }

        /* Filter bar */
        .dh-filter-divider {
          flex-shrink: 0;
          width: 1px;
          height: 22px;
          background: var(--border-slate-200);
          margin: 0 2px;
        }
        [data-theme='dark'] .dh-filter-divider {
          background: rgba(255,255,255,0.08);
        }
        .dh-filter-group .sd-trigger {
          height: 36px !important;
          min-width: 0;
        }
        .dh-filter-clear {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 36px;
          padding: 0 10px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          background: transparent;
          border: 1px dashed var(--border-slate-200);
          border-radius: 8px;
          cursor: pointer;
          transition: color .15s ease, border-color .15s ease, background .15s ease;
          white-space: nowrap;
        }
        .dh-filter-clear:hover {
          color: #b91c1c;
          border-color: rgba(185, 28, 28, 0.35);
          border-style: solid;
          background: rgba(239, 68, 68, 0.06);
        }
        [data-theme='dark'] .dh-filter-clear {
          color: #94a3b8;
          border-color: rgba(255,255,255,0.10);
        }
        [data-theme='dark'] .dh-filter-clear:hover {
          color: #fca5a5;
          border-color: rgba(252, 165, 165, 0.4);
          background: rgba(239, 68, 68, 0.10);
        }

        .dh-table-shell {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0 !important; overflow: hidden;
        }

        /* Visibility status pill (table + row-card cells) */
        .dh-vis-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 3px 9px;
          border-radius: 8px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          font-size: 12.5px;
          line-height: 1.2;
          color: var(--text-slate-700);
          width: fit-content;
          max-width: 100%;
          transition: border-color .15s ease, background .15s ease;
        }
        .dh-vis-pill.is-clickable { cursor: pointer; }
        .dh-vis-pill.is-clickable:hover {
          border-color: var(--text-slate-400);
          background: var(--bg-slate-50, #f8fafc);
        }
        .dh-vis-dot { width: 7px; height: 7px; border-radius: 999px; flex: none; }
        .dh-vis-label { white-space: nowrap; }
        .dh-vis-chevron { color: var(--text-slate-400); margin-left: 1px; }
        .dh-vis-item { display: inline-flex; align-items: center; gap: 8px; }
        
        .premium-table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
        }

        /* Top border and corners (sticky) */



        /* Add border to the table container instead */
        .premium-table .ant-table-container {
          border: 1px solid var(--border-slate-200) !important;
        }
        .premium-table,
        .premium-table.ant-table-wrapper,
        .premium-table .ant-table,
        .premium-table .ant-table-wrapper,
        .premium-table .ant-table-container,
        .premium-table .ant-table-content,
        .premium-table .ant-table-header,
        .premium-table .ant-table-body {
          border-radius: 0px !important;
        }

        [data-theme='dark'] .premium-table .ant-table-container {
          border-color: #374151 !important;
        }

        .premium-table .ant-table-thead > tr > th, .premium-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em !important;
          text-transform: uppercase !important; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
        }

        .premium-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .premium-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .premium-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
        .premium-table .ant-table-tbody > tr.pp-row { cursor: pointer; }
        .premium-table .ant-table-selection-column { padding-inline: 6px !important; }
         .premium-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
         
          .premium-name-icon {
            width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center; color: #3B82F6;
            background: var(--bg-blue-50);
          }
          .premium-name-icon .anticon { font-size: 12px !important; }
          .premium-name-title { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .premium-table .ant-table-thead > tr > th:first-child {
          border-left: none !important;
        }
        .premium-table .ant-table-thead > tr > th:last-child {
          border-right: none !important;
        }

        [data-theme='dark'] .premium-table .ant-table-thead > tr > th,
        [data-theme='dark'] .premium-table .ant-table-thead > tr > td {
          background: #161B22 !important;
          border-top-color: #374151 !important;
          border-bottom-color: #374151 !important;
          color: #94A3B8 !important;
        }
        
        .premium-table .ant-table-thead > tr > th:first-child {
          border-left: none !important;
          border-top-left-radius: 0px !important;
          border-start-start-radius: 0px !important;
        }
        .premium-table .ant-table-thead > tr > th:last-child {
          border-right: none !important;
          border-top-right-radius: 0px !important;
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th:first-child,
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th:last-child {
          border-left-color: #374151 !important;
          border-right-color: #374151 !important;
        }

        /* Side borders for body rows */
        .premium-table .ant-table-tbody > tr > td:first-child {
          border-left: none !important;
        }
        .premium-table .ant-table-tbody > tr > td:last-child {
          border-right: none !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td:first-child,
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td:last-child {
          border-left-color: #1F2937 !important;
          border-right-color: #1F2937 !important;
        }

        /* Bottom border and corners for the last row */
        .premium-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .premium-table .ant-table-tbody > tr:last-child > td:first-child {
          border-bottom-left-radius: 0px !important;
        }
        .premium-table .ant-table-tbody > tr:last-child > td:last-child {
          border-bottom-right-radius: 0px !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr:last-child > td {
          border-bottom-color: transparent !important;
        }

        .dh-hero {
          transform: translateY(0);
          transition: all 0.3s ease;
        }

        @media (max-width: 1064px) {
          .dh-hero {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 16px 32px !important;
            height: auto !important;
          }
          .dh-hero-section-title,
          .dh-hero-section-stats, 
          .dh-hero-section-actions {
            width: 100%;
          }
          .dh-hero-section-stats {
            margin-top: -4px !important;
            padding-left: 51px; /* Align with title text (38px icon + 13px gap) */
          }
          .dh-hero-section-actions {
            padding-left: 51px;
            margin-top: 4px;
            justify-content: flex-start !important;
          }
        }

        @media (max-width: 810px) {
          .dh-hero-title-content {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 4px !important;
          }
          .dh-hero-divider {
            display: none !important;
          }
          .dh-hero-description {
            display: block !important;
            margin-top: -2px !important;
          }
        }

        .dh-pill:hover {
          transform: translateY(-1px);
        }

        /* Cards */
        .dh-card:hover {
          transform: translateY(-2px);
          border-color: transparent;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04);
        }
        /* Rail cards stretch to fill the available track width — the parent
         * grid (.dh-rail-track) controls how many fit per row. */
        .dh-card-rail { width: 100%; min-width: 0; }
        [data-theme='dark'] .dh-card:hover {
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
        }
        /* Inline editable cells (Project/Ticket) — theme-aware hover bg.
         * Light: light-sky tint. Dark: subtle sky-tinted overlay. */
        .dh-inline-cell {
          background: #eff6ff;  /* always-on background */
        }
        [data-theme='dark'] .dh-inline-cell { background: rgba(56, 189, 248, 0.10); }
        .dh-inline-cell:hover { background: rgba(14, 165, 233, 0.08); }
        [data-theme='dark'] .dh-inline-cell:hover { background: rgba(56, 189, 248, 0.10); }
        /* "Add Project" / "Add Ticket" empty-state buttons. */
        .dh-inline-add-btn:hover:not(:disabled) { background: rgba(59, 130, 246, 0.08) !important; }
        [data-theme='dark'] .dh-inline-add-btn:hover:not(:disabled) { background: rgba(96, 165, 250, 0.12) !important; }
        /* Corner ribbon on hub cards — flag-style tag pinned to top-right.
         * Two variants: public (sky) and private (slate). Sits flush to the
         * card edge with a small triangular notch on the left for the "flag"
         * silhouette. */
        .dh-ribbon {
          position: absolute;
          top: 10px;
          right: -4px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 18px;
          padding: 0 8px 0 10px;
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #fff;
          z-index: 1;
          clip-path: polygon(6px 0, 100% 0, 100% 100%, 6px 100%, 0 50%);
        }
        .dh-ribbon::after {
          content: '';
          position: absolute;
          right: 0;
          bottom: -4px;
          border-style: solid;
          border-width: 4px 4px 0 0;
          border-color: transparent;
        }
        .dh-ribbon-public {
          background: #0EA5E9;
        }
        .dh-ribbon-public::after {
          border-top-color: #075985;
        }
        .dh-ribbon-private {
          background: #64748B;
        }
        .dh-ribbon-private::after {
          border-top-color: #334155;
        }
        .dh-card-action-btn {
          width: 24px; height: 24px;
          display: inline-flex; align-items: center; justify-content: center;
          border: none; background: transparent;
          border-radius: 7px; cursor: pointer;
          color: var(--text-slate-400);
          transition: all 0.15s;
        }
        .dh-card-action-btn:hover {
          background: var(--bg-slate-100);
          color: var(--text-slate-700);
        }
        .dh-card-action-danger:hover {
          background: rgba(239, 68, 68, 0.10);
          color: #ef4444;
        }

        /* Kanban scroll */
        .dh-kanban-scroll::-webkit-scrollbar { height: 8px; }
        .dh-kanban-scroll::-webkit-scrollbar-track { background: transparent; }
        .dh-kanban-scroll::-webkit-scrollbar-thumb {
          background: var(--border-slate-200);
          border-radius: 4px;
        }
        .dh-kanban-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-slate-400);
        }

        /* View switcher */
        .dh-view-segmented .ant-segmented-item {
          font-size: 13px;
        }
        .dh-view-segmented .ant-segmented-item-selected {
          font-weight: 600;
        }

        /* Rail section: cards stretch to fill the available width.
         * auto-fit keeps each card ≥ 180px and divides the row into as many
         * equal columns as fit. We slice the data to a viewport-aware cap
         * upstream, so the column count and visible items normally match. */
        .dh-rail-section { width: 100%; }
        /* Column count is fixed per breakpoint (matching the upstream
         * railCap of 5/4/3). With a real grid track count, 5 cards fill
         * the full row but 2 cards stay 1/5 width and leave empty cells
         * to the right instead of stretching. */
        .dh-rail-track {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(5, 1fr);
          padding-bottom: 4px;
        }
        @media (max-width: 1200px) {
          .dh-rail-track { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 900px) {
          .dh-rail-track { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .dh-rail-track { grid-template-columns: repeat(1, 1fr); }
        }

        /* Keyboard shortcut chip */
        .dh-kbd {
          display: inline-block;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 10.5px;
          font-weight: 700;
          padding: 1px 6px;
          margin: 0 2px;
          border-radius: 5px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          color: var(--text-slate-700);
          box-shadow: 0 1px 0 var(--border-slate-200);
        }

        /* === Table-only enhancements (#A–#H) === */

        /* Header column-title icon chip */
        .dh-col-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 16px; height: 16px;
          border-radius: 4px;
          background: var(--bg-slate-100, #f1f5f9);
          color: var(--text-slate-500);
          font-size: 9px;
        }
        [data-theme='dark'] .dh-col-icon {
          background: rgba(148, 163, 184, 0.12);
          color: #cbd5e1;
        }
        .dh-sort-arrows {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
          margin-left: 1px;
          gap: 1px;
        }
        /* Hide Ant's default sort arrows in favour of our compact CaretUp/Down. */
        .premium-table .ant-table-column-sorter { display: none !important; }
        .premium-table .ant-table-column-sorters {
          justify-content: flex-start;
          gap: 0;
        }

        /* Resize handle (#H) */
        .dh-resize-handle {
          position: absolute;
          right: -4px; top: 0;
          width: 8px; height: 100%;
          cursor: col-resize;
          z-index: 2;
          touch-action: none;
        }
        .dh-resize-handle::after {
          content: '';
          position: absolute;
          right: 4px; top: 25%;
          width: 2px; height: 50%;
          background: transparent;
          border-radius: 1px;
          transition: background 0.12s;
        }
        .dh-resize-handle:hover::after,
        .dh-resize-handle:active::after {
          background: #3b82f6;
        }

        /* Density (#C) — tunes per-row vertical padding */
        .dh-table-shell[data-density='compact'] .ant-table-tbody > tr > td { padding: 4px 10px !important; }
        .dh-table-shell[data-density='comfortable'] .ant-table-tbody > tr > td { padding: 6px 10px !important; }
        .dh-table-shell[data-density='spacious'] .ant-table-tbody > tr > td { padding: 10px 14px !important; }

        /* Pinned row actions — always visible in the fixed Actions column (#D) */
        .dh-row-actions {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          opacity: 1;
          transition: opacity 0.15s;
        }
        .premium-table .ant-table-row:hover .dh-row-actions,
        .premium-table .dh-row-focused .dh-row-actions {
          opacity: 1;
        }
        .dh-row-action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          color: var(--text-slate-400);
          transition: all 0.12s;
        }
        .dh-row-action-btn:hover {
          background: var(--bg-blue-50);
          color: #3b82f6;
        }
        .dh-row-action-danger:hover {
          background: rgba(239, 68, 68, 0.10);
          color: #ef4444;
        }
        /* Inline star button before the Doc Name (always visible). */
        .dh-name-star {
         background: none; border: none; cursor: pointer; padding: 0; color: var(--text-slate-300); line-height: 0; flex-shrink: 0;
        }
        .dh-name-star:hover {
          color: #3B82F6;
        }
        .dh-name-star.is-starred {
          color: #3B82F6;
        }
        .dh-name-star.is-starred:hover {
          color: #3B82F6;
        }

        /* Inline name edit pencil (#D) */
        .dh-name-pencil {
          display: inline-flex; align-items: center; justify-content: center;
          width: 18px; height: 18px;
          border: none;
          background: var(--bg-slate-100);
          color: var(--text-slate-500);
          border-radius: 5px;
          cursor: pointer;
          transition: opacity 0.12s, background 0.12s, color 0.12s;
          flex-shrink: 0;
        }
        .dh-name-pencil:hover {
          background: var(--bg-blue-50);
          color: #3b82f6;
        }
        .dh-name-edit-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px;
          border: none;
          background: var(--bg-slate-100);
          color: var(--text-slate-600);
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.12s;
          flex-shrink: 0;
        }
        .dh-name-edit-btn:hover { background: var(--bg-slate-200, #e2e8f0); }

        /* "NEW" badge (#G) */
        .dh-new-badge {
          display: inline-flex;
          align-items: center;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 1px 5px;
          border-radius: 4px;
          color: #fff;
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55);
          animation: dh-new-pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        .dh-avatar {
            width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-weight: 800; font-size: 12px;
          }
          .dh-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }

          .dh-doccount { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
          .dh-doccount-key { color: var(--text-slate-400); font-weight: 600 !important; flex-shrink: 0; }
          .dh-doccount-val { color: var(--text-slate-700) !important; font-weight: 600 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .dh-doccount-title {
            font-size: 13px; font-weight: 700 !important; color: var(--text-slate-900) !important; letter-spacing: -0.01em; line-height: 1.3;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          }

         .dh-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
         .dh-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
         .dh-foot-row + .dh-foot-row { border-top: 1px solid var(--border-slate-200); }
         .dh-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
         .dh-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
         .dh-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
         @keyframes dh-new-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
          50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        }

        /* Expand chevron (#B) */
        .premium-table .ant-table-row-expand-icon-cell { padding: 0 4px !important; }
        .dh-expand-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-slate-400);
          transition: transform 0.18s ease, background 0.12s, color 0.12s;
        }
        .dh-expand-btn:hover {
          background: var(--bg-slate-100);
          color: #3b82f6;
        }
        /* Hide Ant's default +/− expand button — we render our own chevron. */
        .premium-table .ant-table-row-expand-icon { display: none !important; }
        /* Expanded row body */
        .premium-table .dh-expanded-row > td {
          padding: 0 !important;
          background: transparent !important;
        }
        .dh-preview-chip:hover {
          border-color: #3b82f680 !important;
          background: var(--bg-blue-50) !important;
          color: #3b82f6 !important;
        }

        /* Sticky-left shadow when horizontally scrolled */
        .premium-table .ant-table-cell-fix-left-last::after {
          box-shadow: inset -10px 0 8px -8px rgba(15, 23, 42, 0.06) !important;
        }
        .premium-table .ant-table-cell-fix-right-first::after {
          box-shadow: none !important;
        }
        [data-theme='dark'] .premium-table .ant-table-cell-fix-left-last::after {
          box-shadow: inset -10px 0 8px -8px rgba(0, 0, 0, 0.45) !important;
        }
        [data-theme='dark'] .premium-table .ant-table-cell-fix-right-first::after {
          box-shadow: none !important;
        }

        /* Selection column polish */
        .premium-table .ant-table-selection-column { padding: 0 8px !important; }
        .premium-table .ant-checkbox-wrapper { transform: scale(0.95); }
        .premium-table .ant-checkbox-inner,
        .dh-new-rowcard .ant-checkbox-inner {
          border-color: var(--border-slate-300, #cbd5e1) !important;
        }
        [data-theme='dark'] .premium-table .ant-checkbox-inner,
        [data-theme='dark'] .dh-new-rowcard .ant-checkbox-inner {
          border-color: #475569 !important;
        }
        .premium-table .ant-checkbox-checked .ant-checkbox-inner,
        .dh-new-rowcard .ant-checkbox-checked .ant-checkbox-inner {
          border-color: #3b82f6 !important;
          background-color: #3b82f6 !important;
        }

        /* Footer area */
        .premium-table .ant-table-footer {
          background: var(--bg-secondary) !important;
          border-top: 1px solid var(--border-slate-200);
          padding: 10px 16px !important;
        }
        [data-theme='dark'] .premium-table .ant-table-footer {
          background: #0B0F1A !important;
          border-top-color: #374151 !important;
        }

        /* Table settings popover (#C) */
        .dh-table-settings-popover .ant-popover-inner {
          padding: 14px !important;
          border-radius: 14px !important;
          border: 1px solid var(--border-slate-200) !important;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06) !important;
        }
        .dh-popover-section-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-slate-400);
          margin-bottom: 8px;
        }
        .dh-col-toggle-row {
          padding: 4px 6px;
          border-radius: 6px;
          transition: background 0.12s;
        }
        .dh-col-toggle-row:hover { background: var(--bg-slate-50); }
        [data-theme='dark'] .dh-col-toggle-row:hover { background: rgba(255,255,255,0.03); }

        /* Single-row toolbar: thin scrollbar when overflowing horizontally. */
        .dh-toolbar { scrollbar-width: thin; }
        .dh-toolbar::-webkit-scrollbar { height: 6px; }
        .dh-toolbar::-webkit-scrollbar-track { background: transparent; }
        .dh-toolbar::-webkit-scrollbar-thumb {
          background: var(--border-slate-200);
          border-radius: 4px;
        }
        .dh-toolbar::-webkit-scrollbar-thumb:hover { background: var(--text-slate-400); }

        /* Header overflow icon button (dot-dot-dot before Trash). */
        .dh-header-icon-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          transition: all 0.12s !important;
        }
        .dh-header-icon-btn:hover {
          color: #3b82f6 !important;
          border-color: rgba(59, 130, 246, 0.30) !important;
          background: var(--bg-blue-50) !important;
        }

        /* Rails popover (Pinned / Recently opened toggles) */
        .dh-rails-popover .ant-popover-inner {
          padding: 14px !important;
          border-radius: 14px !important;
          border: 1px solid var(--border-slate-200) !important;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06) !important;
        }
        .dh-rail-toggle-row {
          padding: 8px;
          border-radius: 10px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: background 0.12s;
        }
        .dh-rail-toggle-row:last-of-type { margin-bottom: 0; }
        .dh-rail-toggle-row:hover { background: var(--bg-slate-50); }
        [data-theme='dark'] .dh-rail-toggle-row:hover { background: rgba(255,255,255,0.03); }

        /* === Floating bulk actions bar (#A) === */
        .dh-bulk-bar {
          position: fixed;
          left: 50%;
          bottom: 24px;
          transform: translate(-50%, 24px);
          opacity: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 16px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.06);
          backdrop-filter: blur(10px);
          z-index: 1100;
          transition: transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.18s;
          max-width: calc(100vw - 48px);
          flex-wrap: wrap;
        }
        .dh-bulk-bar-visible {
          transform: translate(-50%, 0);
          opacity: 1;
          pointer-events: auto;
        }
        [data-theme='dark'] .dh-bulk-bar {
          background: #0B0F1A !important;
          border-color: #374151 !important;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45) !important;
        }
        .dh-bulk-btn {
          height: 30px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          border-color: var(--border-slate-200) !important;
        }
        .dh-bulk-btn:hover {
          border-color: #3b82f6 !important;
          color: #3b82f6 !important;
        }
        .dh-bulk-btn-danger:hover {
          border-color: #ef4444 !important;
        }
        .dh-bulk-divider {
          width: 1px; height: 18px;
          background: var(--border-slate-200);
          margin: 0 4px;
        }
        .dh-bulk-clear {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          border: none;
          background: var(--bg-slate-100);
          color: var(--text-slate-500);
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
        }
        .dh-bulk-clear:hover {
          background: rgba(239, 68, 68, 0.10);
          color: #ef4444;
        }

        /* Create Document Dropdown (#1) */
        .create-document-menu .ant-dropdown-menu {
          padding: 4px 6px !important;
          border-radius: 0px !important;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06) !important;
          min-width: 150px !important;
        }
        .create-document-menu .ant-dropdown-menu-item {
          border-radius: 0px !important;
          padding: 4px 6px !important;
          margin-bottom: 2px !important;
        }
        .create-document-menu .ant-dropdown-menu-item:last-child {
          margin-bottom: 0 !important;
        }
        .create-document-menu .ant-dropdown-menu-item:hover {
          background: var(--bg-slate-50) !important;
        }
      `}</style>
    </MainLayout>
  );
};

// Horizontal scrollable rail used for Pinned + Recent.
const RailSection: React.FC<{
  label: string;
  icon: React.ReactNode;
  color: string;
  count: number;
  children: React.ReactNode;
}> = ({ label, icon, color, count, children }) => (
  <div className="dh-rail-section">
    <div className="flex items-center gap-2 mb-2">
      <span
        className="inline-flex items-center justify-center"
        style={{ width: 22, height: 22, borderRadius: 7, background: `${color}1a`, color }}
      >
        {icon}
      </span>
      <span className="text-[11.5px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-slate-700)' }}>
        {label}
      </span>
      <span
        className="text-[10px] font-bold px-1.5 py-[1px] rounded-full"
        style={{ background: 'var(--bg-slate-100)', color: 'var(--text-slate-500)' }}
      >
        {count}
      </span>
    </div>
    <div className="dh-rail-track">{children}</div>
  </div>
);

const ExportedDocumentHubPage = () => {
  console.log("Forcing HMR reload for DocumentHubPage 3");
  return <DocumentHubPage />;
}
export default ExportedDocumentHubPage;
