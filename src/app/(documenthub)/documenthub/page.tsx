"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
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
} from "@ant-design/icons";
import ShareModal from "@/components/documenthub/ShareModal";
import {
  Button,
  Col,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Table,
  Tooltip,
  DatePicker,
  Space,
  message,
  Spin,
  Divider,
  Avatar,
  Segmented,
  Popover,
  Switch,
  Grid,
} from "antd";
import type { MenuProps } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnsType } from "antd/es/table";
import { format, isWithinInterval, startOfDay, endOfDay, formatDistanceToNow } from "date-fns";
import dayjs from "dayjs";
import TrashDrawer from "@/components/documenthub/TrashDrawer";
import DocumentHubDashboard from "@/components/documenthub/DocumentHubDashboard";
import AiCreateHubModal from "@/components/documenthub/AiCreateHubModal";
import { useTicketDrawer } from "@/context/TicketDrawerContext";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Six brand-accent colors used to tag each hub by a deterministic id-hash.
// Gives the table/grid/kanban a Notion-style visual identity per hub.
const HUB_ACCENTS = [
  { from: '#3B82F6', to: '#6366F1', tint: 'rgba(59, 130, 246, 0.10)' },   // blue
  { from: '#10B981', to: '#14B8A6', tint: 'rgba(16, 185, 129, 0.10)' },   // emerald
  { from: '#8B5CF6', to: '#A855F7', tint: 'rgba(139, 92, 246, 0.10)' },   // violet
  { from: '#F97316', to: '#F59E0B', tint: 'rgba(249, 115, 22, 0.10)' },   // amber
  { from: '#EC4899', to: '#F43F5E', tint: 'rgba(236, 72, 153, 0.10)' },   // pink
  { from: '#06B6D4', to: '#0EA5E9', tint: 'rgba(6, 182, 212, 0.10)' },    // cyan
];

const accentForId = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HUB_ACCENTS[h % HUB_ACCENTS.length];
};

const RECENT_KEY = 'dh_recent_v1';
const VIEW_KEY = 'dh_view_v1';
const SAVED_VIEW_KEY = 'dh_savedview_v1';
const TOUR_KEY = 'dh_tour_seen_v1';
const DENSITY_KEY = 'dh_density_v1';
const COLS_KEY = 'dh_cols_v1';
const COL_WIDTHS_KEY = 'dh_col_widths_v1';
const RAILS_KEY = 'dh_rails_v1';

// Default rail visibility: only "Recently opened" is on by default; users opt
// into "Pinned" via the header overflow menu.
const DEFAULT_RAILS = { pinned: false, recent: true };
type RailVisibility = typeof DEFAULT_RAILS;

type ViewMode = 'table' | 'grid' | 'kanban';
type SavedView = 'all' | 'mine' | 'shared' | 'public' | 'starred';
type Density = 'compact' | 'comfortable' | 'spacious';

// Hubs created within this many ms get a "NEW" pulse badge.
const NEW_BADGE_MS = 5 * 60 * 1000;

// Default widths used when the user hasn't dragged a column yet.
const DEFAULT_COL_WIDTHS: Record<string, number> = {
  name: 320,
  project: 150,
  ticket: 160,
  createdBy: 160,
  createdAt: 140,
  updatedAt: 140,
  visibility: 120,
  actions: 140,
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
  const [searchValue, setSearchValue] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const { open: openTicketDrawer } = useTicketDrawer();
  const isOwner = user?.id === record.createdById;

  const { data: rowTickets = [], isLoading: rowTicketsLoading } =
    useUserTicketsByProjects(record.projectId);

  const getOptions = () => {
    const sortedTickets = [...(rowTickets || [])].sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    let filtered = sortedTickets;
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = sortedTickets.filter((t: any) =>
        t.ticketNumber?.toLowerCase().includes(search) ||
        t.title?.toLowerCase().includes(search)
      );
    }
    let limited = filtered.slice(0, 10);
    if (record.ticketId && !limited.find(t => t.id === record.ticketId)) {
      const currentTicket = sortedTickets.find(t => t.id === record.ticketId);
      if (currentTicket) limited.push(currentTicket);
    }
    return limited.map((t: any) => ({
      label: (
        <div className="flex flex-col py-1">
          <span className="font-semibold text-slate-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>{t.ticketNumber}</span>
          <span className="text-slate-400 truncate" style={{ fontSize: '9px', lineHeight: '1.2', maxWidth: '160px' }}>{t.title}</span>
        </div>
      ),
      value: t.id
    }));
  };

  if (record.ticketId && !isEditing) {
    const ticketTooltip = (
      <div style={{ maxWidth: 260, padding: '2px 0' }}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <span
            className="inline-flex items-center gap-1 font-semibold uppercase"
            style={{ fontSize: 9.5, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.62)' }}
          >
            <TagOutlined style={{ fontSize: 10 }} /> Ticket
          </span>
          {record.project?.name && (
            <span
              className="inline-flex items-center gap-1 font-bold px-1.5 py-[1px] rounded-full"
              style={{ fontSize: 9.5, background: 'rgba(139,92,246,0.22)', color: '#C4B5FD' }}
            >
              <ProjectOutlined style={{ fontSize: 8 }} />
              {record.project.name}
            </span>
          )}
        </div>
        <div
          className="font-bold tracking-tight mb-1"
          style={{ fontSize: 14, color: '#7DD3FC', letterSpacing: '-0.01em' }}
        >
          {record.ticket?.ticketNumber}
        </div>
        <div
          className="font-medium"
          style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.88)', lineHeight: 1.45 }}
        >
          {record.ticket?.title}
        </div>
        <div
          className="mt-2 pt-2 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.10)', fontSize: 10 }}
        >
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>Click number to open · title to change</span>
        </div>
      </div>
    );
    return (
      <Tooltip
        title={ticketTooltip}
        placement="topLeft"
        mouseEnterDelay={0.2}
        overlayInnerStyle={{
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(8px)',
          borderRadius: 10,
          padding: '10px 12px',
          boxShadow: '0 10px 32px rgba(15,23,42,0.28), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="dh-inline-cell flex flex-col py-0.5 px-2 rounded-md transition-colors group"
          style={{ width: 'fit-content', maxWidth: '100%' }}
        >
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); openTicketDrawer(record.ticketId); }}
            className="font-semibold text-sky-500 group-hover:text-sky-600 cursor-pointer"
            style={{ fontSize: '11px', lineHeight: '1.2' }}
          >
            {record.ticket?.ticketNumber}
          </span>
          <span
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="text-slate-400 truncate group-hover:text-slate-500 cursor-pointer"
            style={{ fontSize: '9px', lineHeight: '1.2', maxWidth: '160px' }}
          >
            {record.ticket?.title}
          </span>
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

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        placeholder={<span className="text-slate-400">Search...</span>}
        value={record.ticketId || undefined}
        disabled={!isOwner}
        loading={rowTicketsLoading}
        className="w-full premium-inline-select"
        variant="borderless"
        showSearch
        allowClear
        autoFocus
        defaultOpen
        onSearch={setSearchValue}
        searchValue={searchValue}
        onBlur={() => setIsEditing(false)}
        onChange={(value) => {
          updateHub(record.id, { ticketId: value, name: record.name });
          setSearchValue("");
          setIsEditing(false);
        }}
        options={getOptions()}
        filterOption={false}
        style={{ minWidth: 220 }}
      />
    </div>
  );
};

const InlineProjectSelector = ({ record, projects, projectsLoading, updateHub, user }: any) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const isOwner = user?.id === record.createdById;

  const getOptions = () => {
    return (projects || []).map((p: any) => ({
      label: (
        <div className="flex flex-col py-1">
          <span className="font-semibold text-slate-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>{p.label}</span>
          {p.code && (
            <span className="text-slate-400" style={{ fontSize: '9px', lineHeight: '1.2' }}>{p.code}</span>
          )}
        </div>
      ),
      value: p.value
    }));
  };

  if (record.projectId && !isEditing) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        className="dh-inline-cell flex flex-col py-0.5 px-2 rounded-md cursor-pointer transition-colors group"
        style={{ width: 'fit-content', maxWidth: '100%' }}
      >
        <span className="font-semibold text-sky-600 group-hover:text-sky-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>
          {record.project?.name}
        </span>
        {record.project?.code && (
          <span className="text-slate-400 group-hover:text-slate-500 truncate" style={{ fontSize: '9px', lineHeight: '1.2', maxWidth: '130px' }}>
            {record.project.code}
          </span>
        )}
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
      <Select
        placeholder={<span className="text-slate-400">Search project...</span>}
        value={record.projectId || undefined}
        disabled={!isOwner}
        loading={projectsLoading}
        className="w-full premium-inline-select"
        variant="borderless"
        showSearch
        autoFocus
        defaultOpen
        onBlur={() => setIsEditing(false)}
        onChange={(value) => {
          updateHub(record.id, { projectId: value, name: record.name });
          setIsEditing(false);
        }}
        options={getOptions()}
        style={{ minWidth: 220 }}
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
const HubInlinePreview: React.FC<{ hub: DocumentHub; onOpen: (id: string) => void }> = ({ hub, onOpen }) => {
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
                  onClick={(e) => { e.stopPropagation(); onOpen(hub.id); }}
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
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
  variant?: 'rail' | 'grid';
}> = ({ hub, starred, onOpen, onToggleStar, onShare, onDelete, variant = 'rail' }) => {
  const accent = HUB_ACCENTS[0];
  const docCount = hub.treeNodes?.filter((n) => n.type === 'file').length || 0;
  const isRail = variant === 'rail';
  const updatedRel = formatDistanceToNow(new Date(hub.updatedAt), { addSuffix: true });

  return (
    <div
      role="button"
      onClick={() => onOpen(hub.id)}
      className={`dh-card ${isRail ? 'dh-card-rail' : ''} group cursor-pointer transition-all overflow-hidden flex flex-col`}
      style={{
        width: isRail ? undefined : '100%',
        minHeight: isRail ? 132 : 168,
        borderRadius: 14,
        border: '1px solid var(--border-slate-200)',
        background: 'var(--bg-pure-white)',
      }}
    >
      {/* Cover */}
      <div
        className="relative"
        style={{
          height: isRail ? 42 : 56,
          background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), transparent 60%)',
          }}
        />
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full font-semibold"
            style={{
              height: 18,
              padding: '0 7px',
              fontSize: 9.5,
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.22)',
              letterSpacing: '0.02em',
            }}
          >
            {hub.visibility === 'public' ? (
              <GlobalOutlined style={{ fontSize: 9 }} />
            ) : (
              <LockOutlined style={{ fontSize: 9 }} />
            )}
            {hub.visibility === 'public' ? 'Public' : 'Private'}
          </span>
          <button
            type="button"
            onClick={(e) => onToggleStar(e, hub)}
            aria-label={starred ? 'Unstar' : 'Star'}
            className="dh-card-icon-btn"
            style={{ color: starred ? '#fbbf24' : 'rgba(255,255,255,0.85)' }}
          >
            {starred ? <StarFilled style={{ fontSize: 12 }} /> : <StarOutlined style={{ fontSize: 12 }} />}
          </button>
        </div>
        <div
          className="absolute -bottom-4 left-3 flex items-center justify-center text-white shadow-md"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
            border: '2px solid var(--bg-pure-white)',
          }}
        >
          <FolderOutlined style={{ fontSize: 13 }} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-3 pt-5 min-w-0">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <h4
            className="m-0 font-semibold text-[13px] leading-tight truncate flex-1"
            style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}
            title={hub.name}
          >
            {hub.name}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
          {hub.project?.name && (
            <Tooltip title={hub.project.name}>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded text-[10px] font-medium truncate"
                style={{ background: accent.tint, color: accent.from, maxWidth: 120 }}
              >
                <ProjectOutlined style={{ fontSize: 9 }} />
                <span className="truncate">{hub.project.name}</span>
              </span>
            </Tooltip>
          )}
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
          <div
            className={`flex items-center gap-0.5 transition-opacity ${
              isRail ? '' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
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
            <Tooltip title="Move to trash">
              <button
                type="button"
                onClick={(e) => onDelete(e, hub.id, hub.name)}
                className="dh-card-action-btn dh-card-action-danger"
                aria-label="Delete"
              >
                <DeleteOutlined style={{ fontSize: 11 }} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentHubPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { canReadDocument } = usePermission();
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
  const [tablePageSize, setTablePageSize] = useState(15);
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
      if (v && ['table', 'grid', 'kanban'].includes(v)) setViewMode(v);
      const s = localStorage.getItem(SAVED_VIEW_KEY) as SavedView | null;
      if (s && ['all', 'mine', 'shared', 'public', 'starred'].includes(s)) setSavedView(s);
      const r = localStorage.getItem(RECENT_KEY);
      if (r) setRecentIds(JSON.parse(r));
      const seen = localStorage.getItem(TOUR_KEY);
      if (!seen) setTourOpen(true);
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

  const openHub = (id: string) => {
    trackRecent(id);
    router.push(`/documenthub/${id}`);
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
    } catch (error) {
      console.error("Failed to create document hub", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteHub = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    modal.confirm({
      title: "Delete Document Hub",
      content: `Are you sure you want to delete "${name}"? This will move it to trash.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DocumentHubService.deleteDocumentHub(id);
          messageApi.success("Document Hub moved to trash");
          queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
        } catch (error) {
          console.error(error);
          messageApi.error("Failed to delete Document Hub");
        }
      },
    });
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
    try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* ignore */ }
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
    if (viewMode !== 'table') return;
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
          minHeight: "calc(100vh - 64px)",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin size="large" tip="Orchestrating technical repository..." />
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
          <ColumnTitle icon={<FolderOutlined />} label="Doc Name" sortKey="name" sortedKey={sortedKey} sortedDir={sortedDir} />
        </span>
      ),
      dataIndex: 'name',
      key: 'name',
      width: colWidths.name,
      // fixed: 'left',
      render: (text, record) => {
        const accent = accentForId(record.id);
        const docCount = (record as any).treeNodes?.filter((n: any) => n.type === 'file').length || 0;
        const updatedRel = formatDistanceToNow(new Date(record.updatedAt), { addSuffix: true });
        const isNew = Date.now() - new Date(record.createdAt).getTime() < NEW_BADGE_MS;
        const isEditingThis = editingNameId === record.id;
        const isOwner = user?.id === record.createdById;
        const starred = isHubStarred(record);

        return (
          <div className="flex items-center gap-2">
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
              className="flex items-center justify-center shrink-0 text-white"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
                boxShadow: `0 2px 6px ${accent.tint}`,
              }}
            >
              <FolderOutlined style={{ fontSize: 13 }} />
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
                  {isOwner && (
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
      render: (text, record) => (
        <Space>
          <Avatar
            size={24}
            src={record.createdBy?.avatarUrl}
            style={{ backgroundColor: 'var(--bg-blue-50)', color: 'var(--text-blue-500)', fontSize: '10px' }}
          >
            {text?.charAt(0).toUpperCase()}
          </Avatar>
          <span style={{ color: 'var(--text-slate-700)' }}>{text}</span>
        </Space>
      ),
    },
    {
      _key: 'createdAt',
      title: <ColumnTitle icon={<CalendarOutlined />} label="Created" sortKey="createdAt" sortedKey={sortedKey} sortedDir={sortedDir} />,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: colWidths.createdAt,
      render: (date) => (
        <Tooltip title={format(new Date(date), "EEEE, MMM d, yyyy h:mm a")}>
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
    {
      _key: 'updatedAt',
      title: <ColumnTitle icon={<ClockCircleOutlined />} label="Updated" sortKey="updatedAt" sortedKey={sortedKey} sortedDir={sortedDir} />,
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: colWidths.updatedAt,
      defaultSortOrder: 'descend' as const,
      render: (date) => (
        <Tooltip title={format(new Date(date), "EEEE, MMM d, yyyy h:mm a")}>
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
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      sortOrder: sortedKey === 'updatedAt' ? sortedDir ?? undefined : undefined,
    },
    {
      _key: 'visibility',
      title: <ColumnTitle icon={<LockOutlined />} label="Visibility" />,
      dataIndex: 'visibility',
      key: 'visibility',
      width: colWidths.visibility,
      render: (visibility, record) => {
        const isOwner = user?.id === record.createdById;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              size="small"
              value={visibility || 'private'}
              disabled={!isOwner}
              style={{ width: 100 }}
              variant="borderless"
              className="visibility-select font-medium"
              suffixIcon={null}
              onChange={async (value) => {
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
              }}
              options={[
                { value: 'private', label: <Space size={6} style={{ color: 'var(--text-slate-500)' }}><LockOutlined style={{ fontSize: 10 }} /> <span style={{ fontSize: 11 }}>Private</span></Space> },
                { value: 'public', label: <Space size={6} style={{ color: 'var(--text-blue-500)' }}><GlobalOutlined style={{ fontSize: 10 }} /> <span style={{ fontSize: 11 }}>Public</span></Space> },
              ]}
            />
          </div>
        );
      },
    },
    {
      _key: 'actions',
      title: '',
      key: 'actions',
      width: colWidths.actions,
      // fixed: 'right',
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
          <Tooltip title="Move to trash">
            <button
              type="button"
              onClick={(e) => handleDeleteHub(e, record.id, record.name)}
              className="dh-row-action-btn dh-row-action-danger"
              aria-label="Delete"
            >
              <DeleteOutlined style={{ fontSize: 13 }} />
            </button>
          </Tooltip>
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

  const handleReload = () => {
    setSearchText("");
    setFilterProjectId(undefined);
    setFilterTicketId(undefined);
    setSelectedUser(undefined);
    setDateRange(null);
    refetch();
  };

  const savedViews: { key: SavedView; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'all', label: 'All hubs', icon: <FolderOutlined />, color: '#3B82F6' },
    { key: 'mine', label: 'My hubs', icon: <UserOutlined />, color: '#8B5CF6' },
    // { key: 'shared', label: 'Shared with me', icon: <TeamOutlined />, color: '#10B981' },
    { key: 'public', label: 'Public', icon: <GlobalOutlined />, color: '#0EA5E9' },
    { key: 'starred', label: 'Starred', icon: <StarFilled />, color: '#F59E0B' },
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

    // Cap rail card counts based on viewport so the rails don't become long
    // horizontal scrolls on small screens. Desktop 5, tablet 4, mobile 3.
    const railCap = isMobile ? 3 : isTablet ? 4 : 5;
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
                onDelete={handleDeleteHub}
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
                onDelete={handleDeleteHub}
                variant="rail"
              />
            ))}
          </RailSection>
        )}
      </div>
    );
  };

  const renderGrid = () => {
    if (!filteredHubs.length) return renderEmpty();
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredHubs.map((hub) => (
          <HubCard
            key={hub.id}
            hub={hub}
            starred={isHubStarred(hub)}
            onOpen={openHub}
            onToggleStar={handleToggleStar}
            onShare={handleShareHub}
            onDelete={handleDeleteHub}
            variant="grid"
          />
        ))}
      </div>
    );
  };

  const renderKanban = () => {
    if (!filteredHubs.length) return renderEmpty();
    // Group by project; "Unassigned" column for hubs without a project.
    const groups = new Map<string, { name: string; code?: string; hubs: DocumentHub[] }>();
    filteredHubs.forEach((hub) => {
      const key = hub.project?.id || '__none__';
      const name = hub.project?.name || 'Unassigned';
      const code = hub.project?.code;
      if (!groups.has(key)) groups.set(key, { name, code, hubs: [] });
      groups.get(key)!.hubs.push(hub);
    });
    const cols = Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === '__none__') return 1;
      if (b[0] === '__none__') return -1;
      return a[1].name.localeCompare(b[1].name);
    });
    return (
      <div
        className="flex gap-3 overflow-x-auto pb-2 dh-kanban-scroll"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {cols.map(([key, col]) => (
          <div
            key={key}
            className="flex flex-col rounded-2xl shrink-0"
            style={{
              width: 304,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-slate-200)',
              scrollSnapAlign: 'start',
              maxHeight: 'calc(100vh - 360px)',
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-2.5 border-b"
              style={{ borderColor: 'var(--border-slate-200)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-flex items-center justify-center rounded-md shrink-0"
                  style={{
                    width: 22, height: 22,
                    background: key === '__none__' ? 'var(--bg-slate-100)' : 'rgba(139, 92, 246, 0.10)',
                    color: key === '__none__' ? 'var(--text-slate-500)' : '#8B5CF6',
                  }}
                >
                  {key === '__none__' ? <FolderOutlined style={{ fontSize: 11 }} /> : <ProjectFilled style={{ fontSize: 11 }} />}
                </span>
                <span className="text-[12px] font-bold tracking-tight truncate" style={{ color: 'var(--text-slate-900)' }}>
                  {col.name}
                </span>
                {col.code && (
                  <span className="text-[10px] font-medium px-1.5 py-[1px] rounded" style={{ background: 'var(--bg-slate-100)', color: 'var(--text-slate-500)' }}>
                    {col.code}
                  </span>
                )}
              </div>
              <span
                className="text-[10.5px] font-bold px-1.5 py-[2px] rounded-full"
                style={{ background: 'var(--bg-pure-white)', color: 'var(--text-slate-500)', border: '1px solid var(--border-slate-200)' }}
              >
                {col.hubs.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-2 overflow-y-auto">
              {col.hubs.map((hub) => (
                <HubCard
                  key={hub.id}
                  hub={hub}
                  starred={isHubStarred(hub)}
                  onOpen={openHub}
                  onToggleStar={handleToggleStar}
                  onShare={handleShareHub}
                  onDelete={handleDeleteHub}
                  variant="grid"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTableFooter = () => {
    const total = filteredHubs.length;
    if (!total) return null;
    const start = (tablePage - 1) * tablePageSize + 1;
    const end = Math.min(tablePage * tablePageSize, total);
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-0.5">
        <div className="text-[12px]" style={{ color: 'var(--text-slate-500)' }}>
          Showing <span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>{start}–{end}</span> of{' '}
          <span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>{total}</span> hub{total === 1 ? '' : 's'}
          {starredVisibleCount > 0 && (
            <>
              {' · '}
              <span className="inline-flex items-center gap-1" style={{ color: '#b45309' }}>
                <StarFilled style={{ fontSize: 10 }} /> {starredVisibleCount} starred
              </span>
            </>
          )}
          {sharedWithMeCount > 0 && (
            <>
              {' · '}
              <span style={{ color: 'var(--text-slate-600)' }}>
                {sharedWithMeCount} shared with you
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderTable = () => (
    <div
      className="overflow-hidden dh-table-shell"
      data-density={density}
      style={{
        borderRadius: 16,
        border: '1px solid var(--border-slate-200)',
        background: 'var(--bg-pure-white)',
      }}
    >
      <Table
        columns={visibleColumns}
        dataSource={filteredHubs}
        rowKey="id"
        loading={hubsLoading || hubsFetching}
        pagination={{
          pageSize: tablePageSize,
          current: tablePage,
          showSizeChanger: true,
          pageSizeOptions: [10, 15, 25, 50, 100],
          onChange: (p, size) => {
            setTablePage(p);
            setTablePageSize(size);
          },
          showTotal: () => null,
        }}
        size="small"
        className="premium-table dh-table"
        scroll={{ x: 1300 }}
        sticky={{ offsetHeader: 0 }}
        locale={{ emptyText: renderEmpty() }}
        components={{
          header: { cell: ResizableHeaderCell },
        }}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys),
          columnWidth: 36,
          fixed: true,
        }}
        expandable={{
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
              <RightOutlined style={{ fontSize: 10 }} />
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
        footer={renderTableFooter}
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

  return (
    <MainLayout>
      {contextHolder}
      {modalContextHolder}
      <div style={{
        margin: "0 -16px",
        padding: "0 24px 24px 24px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* === #1 Hero Header (Team-View pattern + live pulse) === */}
        <div
          className="dh-hero flex flex-wrap justify-between items-center gap-4 flex-shrink-0"
          style={{
            margin: '0 -24px 16px -24px',
            padding: '10px 32px',
            background: 'var(--bg-pure-white)',
            borderBottom: '1px solid var(--border-slate-200)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="dh-hero-icon-box">
              <FileZipOutlined style={{ fontSize: 18, color: '#3B82F6' }} />
            </div>
            <div className="flex flex-row min-w-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <h1
                  className="text-[18px] font-extrabold m-0 tracking-tight leading-tight"
                  style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}
                >
                  Document Hub
                </h1>
                <Divider type="vertical" className="hidden sm:block" style={{ height: 18, margin: 0, backgroundColor: 'var(--border-slate-200)' }} />
                <p className="m-0 text-[12.5px] hidden sm:block font-medium" style={{ color: 'var(--text-slate-600)' }}>
                  Wiki, specs, runbooks — all linked to the work they belong to
                </p>
              </div>
              {/* Live pulse line */}
              <div className="flex items-center gap-2 mt-1 text-[11px]">
                <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--text-slate-500)' }}>
                  <span className="dh-pulse-dot" />
                  <span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>{documentHubs.length}</span> hubs
                </span>
                <span style={{ color: 'var(--text-slate-300)' }}>·</span>
                <span style={{ color: 'var(--text-slate-500)' }}>
                  <span className="font-semibold" style={{ color: 'var(--text-slate-700)' }}>{totalDocCount}</span> docs
                </span>
                {lastUpdated && (
                  <>
                    <span style={{ color: 'var(--text-slate-300)' }}>·</span>
                    <span style={{ color: 'var(--text-slate-500)' }}>Updated {lastUpdated}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Popover
              trigger={['click']}
              placement="bottomRight"
              classNames={{ root: 'dh-rails-popover' }}
              content={
                <div style={{ width: 268 }}>
                  <div className="dh-popover-section-label">
                    <AppstoreOutlined style={{ fontSize: 11 }} />
                    <span>Show on this page</span>
                  </div>
                  <label className="dh-rail-toggle-row flex items-start gap-2.5">
                    <span
                      className="inline-flex items-center justify-center shrink-0"
                      style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'rgba(245, 158, 11, 0.10)',
                        color: '#F59E0B',
                      }}
                    >
                      <PushpinOutlined style={{ fontSize: 13 }} />
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[12.5px] font-semibold"
                          style={{ color: 'var(--text-slate-900)' }}
                        >
                          Pinned
                        </span>
                        <Switch
                          size="small"
                          checked={railVisibility.pinned}
                          onChange={(checked) =>
                            setRailVisibility((p) => ({ ...p, pinned: checked }))
                          }
                        />
                      </div>
                      <span
                        className="text-[10.5px] leading-snug mt-0.5"
                        style={{ color: 'var(--text-slate-500)' }}
                      >
                        {pinnedHubs.length
                          ? `${pinnedHubs.length} starred ${pinnedHubs.length === 1 ? 'hub' : 'hubs'}`
                          : 'Star a hub to pin it here'}
                      </span>
                    </div>
                  </label>
                  <label className="dh-rail-toggle-row flex items-start gap-2.5">
                    <span
                      className="inline-flex items-center justify-center shrink-0"
                      style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'rgba(59, 130, 246, 0.10)',
                        color: '#3B82F6',
                      }}
                    >
                      <ClockCircleOutlined style={{ fontSize: 13 }} />
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[12.5px] font-semibold"
                          style={{ color: 'var(--text-slate-900)' }}
                        >
                          Recently opened
                        </span>
                        <Switch
                          size="small"
                          checked={railVisibility.recent}
                          onChange={(checked) =>
                            setRailVisibility((p) => ({ ...p, recent: checked }))
                          }
                        />
                      </div>
                      <span
                        className="text-[10.5px] leading-snug mt-0.5"
                        style={{ color: 'var(--text-slate-500)' }}
                      >
                        Last hubs you visited!
                      </span>
                    </div>
                  </label>
                  <div
                    className="flex items-center justify-between gap-2 mt-3 pt-3"
                    style={{ borderTop: '1px solid var(--border-slate-200)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setRailVisibility(DEFAULT_RAILS)}
                      className="text-[11.5px] font-semibold"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                    >
                      Reset to default
                    </button>
                    <span className="text-[10.5px]" style={{ color: 'var(--text-slate-400)' }}>
                      Saved automatically
                    </span>
                  </div>
                </div>
              }
            >
              <Tooltip title="Page sections">
                <Button
                  icon={<MoreOutlined style={{ fontSize: 18 }} />}
                  className="dh-header-icon-btn"
                  aria-label="Page sections"
                  style={{
                    height: 38, width: 38,
                    borderRadius: 10,
                    background: 'var(--bg-slate-50)',
                    border: '1px solid var(--border-slate-200)',
                    color: 'var(--text-slate-700)',
                  }}
                />
              </Tooltip>
            </Popover>
            <Tooltip title={isMobile ? 'Trash' : ''}>
              <Button
                icon={<RestOutlined />}
                onClick={() => setTrashVisible(true)}
                className="trash-action-btn"
                aria-label="Trash"
                style={{
                  height: 38,
                  ...(isMobile ? { width: 38, padding: 0 } : {}),
                  borderRadius: 10,
                  fontWeight: 500,
                  background: 'var(--bg-slate-50)',
                  border: '1px solid var(--border-slate-200)',
                  color: 'var(--text-slate-700)',
                }}
              >
                {!isMobile && 'Trash'}
              </Button>
            </Tooltip>
            <Dropdown
              trigger={['hover', 'click']}
              placement="bottomRight"
              overlayClassName="create-document-menu"
              menu={{
                items: [
                  {
                    key: 'manual',
                    label: (
                      <div className="flex items-start gap-3 py-1.5 pr-2" style={{ minWidth: 260 }}>
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
                      <div className="flex items-start gap-3 py-1.5 pr-2" style={{ minWidth: 260 }}>
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="create-document-btn"
                style={{
                  height: 38,
                  borderRadius: 10,
                  fontWeight: 600,
                  paddingInline: isMobile ? 12 : 16,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
              >
                {isMobile ? 'Create' : 'Create Document'}
              </Button>
            </Dropdown>
          </div>
        </div>

        <div>
          {/* === #2 Compact stats strip === */}
          <DocumentHubDashboard
            documentHubs={documentHubs}
            isLoading={hubsLoading || hubsFetching}
            onHubClick={openHub}
            onShareHub={handleShareHub}
          />

          {/* === #3 Pinned & Recent rail === */}
          {renderRail()}

          {/* === #6 Saved-views pills === */}
          {documentHubs.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto dh-pills-row">
              {savedViews.map((sv) => {
                const active = savedView === sv.key;
                return (
                  <button
                    key={sv.key}
                    type="button"
                    onClick={() => setSavedView(sv.key)}
                    className="dh-pill flex items-center gap-1.5 transition-all shrink-0"
                    style={{
                      height: 32,
                      padding: '0 12px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: active ? `${sv.color}15` : 'var(--bg-pure-white)',
                      border: `1px solid ${active ? sv.color + '60' : 'var(--border-slate-200)'}`,
                      color: active ? sv.color : 'var(--text-slate-600)',
                    }}
                  >
                    <span style={{ fontSize: 11 }}>{sv.icon}</span>
                    {sv.label}
                    <span
                      className="px-1.5 py-[1px] rounded-full text-[10px] font-bold"
                      style={{
                        background: active ? sv.color : 'var(--bg-slate-100)',
                        color: active ? '#fff' : 'var(--text-slate-500)',
                        marginLeft: 2,
                      }}
                    >
                      {viewCounts[sv.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* === #6 Filter bar — single row: search · filters · views · settings · refresh === */}
          <div className="sticky top-0 z-20" style={{ background: 'var(--bg-pure-white)', zIndex: 100 }}>
            <div
              className="dh-toolbar flex items-center gap-2 rounded-2xl"
              style={{
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-slate-200)',
                marginBottom: 12,
                overflowX: 'auto',
              }}
            >
              <div className="relative shrink-0" style={{ width: isMobile ? 180 : 240 }}>
                <Input
                  placeholder={isMobile ? 'Search...' : 'Search hubs...'}
                  prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
                  className="premium-search-input rounded-xl transition-all"
                  style={{ background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)', height: 36 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </div>
              <div className="h-5 w-[1px] shrink-0 hidden md:block" style={{ background: 'var(--border-slate-200)' }} />
              <Select
                placeholder={<Space size={4}><ProjectOutlined style={{ fontSize: 10 }} /> <span style={{ fontSize: 11 }}>Project</span></Space>}
                className="premium-select shrink-0"
                style={{ height: 36, width: 150 }}
                allowClear
                showSearch
                value={filterProjectId}
                onChange={setFilterProjectId}
                loading={projectsLoading}
                filterOption={(input, option: any) => {
                  const project = projects.find(p => p.value === option.value);
                  if (!project) return false;
                  return (
                    project.label?.toLowerCase().includes(input.toLowerCase()) ||
                    project.code?.toLowerCase().includes(input.toLowerCase())
                  );
                }}
                options={projects.map((p: any) => ({
                  label: (
                    <div className="flex flex-col py-1">
                      <span className="font-semibold text-slate-700" style={{ fontSize: 11, lineHeight: '1.2' }}>{p.label}</span>
                      {p.code && <span className="text-slate-400" style={{ fontSize: 9, lineHeight: '1.2' }}>{p.code}</span>}
                    </div>
                  ),
                  value: p.value
                }))}
              />
              <Select
                placeholder={<Space size={4}><TagOutlined style={{ fontSize: 10 }} /> <span style={{ fontSize: 11 }}>Ticket</span></Space>}
                className="premium-select shrink-0"
                style={{ height: 36, width: 180 }}
                allowClear
                showSearch
                value={filterTicketId}
                onChange={setFilterTicketId}
                loading={filterTicketsLoading}
                filterOption={(input, option: any) => {
                  const options = filterProjectId ? filterTickets : Array.from(new Map(documentHubs.filter(h => h.ticket).map(h => [h.ticket!.id, h.ticket])).values());
                  const ticket: any = options.find((t: any) => t.id === option.value);
                  if (!ticket) return false;
                  return (
                    ticket.ticketNumber?.toLowerCase().includes(input.toLowerCase()) ||
                    ticket.title?.toLowerCase().includes(input.toLowerCase())
                  );
                }}
                options={(() => {
                  if (filterProjectId) {
                    return filterTickets.map((t: any) => ({
                      label: (
                        <div className="flex flex-col py-1">
                          <span className="font-semibold text-slate-700" style={{ fontSize: 11, lineHeight: '1.2' }}>{t.ticketNumber}</span>
                          <span className="text-slate-400 truncate" style={{ fontSize: 9, lineHeight: '1.2', maxWidth: 180 }}>{t.title}</span>
                        </div>
                      ),
                      value: t.id
                    }));
                  }
                  const uniqueTickets = Array.from(
                    new Map(
                      documentHubs.filter(hub => hub.ticket).map(hub => [hub.ticket!.id, hub.ticket])
                    ).values()
                  );
                  return uniqueTickets.map((t: any) => ({
                    label: (
                      <div className="flex flex-col py-1">
                        <span className="font-semibold text-slate-700" style={{ fontSize: 11, lineHeight: '1.2' }}>{t.ticketNumber}</span>
                        <span className="text-slate-400 truncate" style={{ fontSize: 9, lineHeight: '1.2', maxWidth: 180 }}>{t.title}</span>
                      </div>
                    ),
                    value: t.id
                  }));
                })()}
              />
              <Select
                placeholder={<Space size={4}><UserOutlined style={{ fontSize: 10 }} /> <span style={{ fontSize: 11 }}>Created By</span></Space>}
                className="premium-select shrink-0"
                style={{ height: 36, width: 150 }}
                showSearch
                allowClear
                optionFilterProp="label"
                value={selectedUser}
                onChange={setSelectedUser}
                loading={membersLoading}
                options={members.map((m: any) => ({ label: m.label, value: m.value }))}
              />
              <RangePicker
                className="premium-range-picker rounded-xl shrink-0"
                style={{ width: 220, background: 'var(--bg-pure-white)', height: 36 }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as any)}
              />

              {/* Spacer pushes the right-side controls to the end of the row. */}
              <div className="flex-1 min-w-[8px]" aria-hidden />

              <div className="flex items-center gap-2 shrink-0">
                <Segmented
                  value={viewMode}
                  onChange={(v) => setViewMode(v as ViewMode)}
                  size="middle"
                  className="dh-view-segmented"
                  options={[
                    { label: <Tooltip title="Table"><UnorderedListOutlined /></Tooltip>, value: 'table' },
                    { label: <Tooltip title="Grid"><AppstoreOutlined /></Tooltip>, value: 'grid' },
                    { label: <Tooltip title="Kanban by project"><ProjectOutlined /></Tooltip>, value: 'kanban' },
                  ]}
                />
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
                            <label
                              key={c.key}
                              className="dh-col-toggle-row flex items-center justify-between gap-2"
                            >
                              <span className="text-[12.5px]" style={{ color: 'var(--text-slate-700)' }}>
                                {c.label}
                              </span>
                              <Switch
                                size="small"
                                checked={!hiddenCols[c.key]}
                                onChange={(checked) =>
                                  setHiddenCols((prev) => ({ ...prev, [c.key]: !checked }))
                                }
                              />
                            </label>
                          ))}
                        </div>
                        <div
                          className="flex items-center justify-between gap-2 mt-3 pt-3"
                          style={{ borderTop: '1px solid var(--border-slate-200)' }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setColWidths(DEFAULT_COL_WIDTHS);
                              setHiddenCols({});
                              setDensity('comfortable');
                            }}
                            className="text-[11.5px] font-semibold"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                          >
                            Reset to defaults
                          </button>
                          <span className="text-[10.5px]" style={{ color: 'var(--text-slate-400)' }}>
                            Saved automatically
                          </span>
                        </div>
                      </div>
                    }
                  >
                    <Tooltip title="Table settings">
                      <Button
                        icon={<SettingOutlined />}
                        className="flex items-center justify-center rounded-xl border-slate-200 text-slate-500 hover:text-blue-500 hover:border-blue-200"
                        style={{ height: 36, width: 36 }}
                      />
                    </Tooltip>
                  </Popover>
                )}
                <Tooltip title="Reload Docs">
                  <Button
                    icon={<ReloadOutlined spin={hubsFetching} />}
                    onClick={handleReload}
                    className="flex items-center justify-center rounded-xl border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200"
                    style={{ height: 36, width: 36 }}
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* === #5 View body === */}
          {hubsLoading && !documentHubs.length ? (
            <div className="flex items-center justify-center py-16">
              <Spin />
            </div>
          ) : viewMode === 'table' ? renderTable()
            : viewMode === 'grid' ? renderGrid()
            : renderKanban()}
        </div>
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
          <Form form={form} layout="vertical" onFinish={handleAddDocument}>
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
                  <Select
                    size="large"
                    placeholder={
                      <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--text-slate-400)' }}>
                        <ProjectOutlined style={{ fontSize: 12 }} /> Select a project
                      </span>
                    }
                    loading={projectsLoading}
                    suffixIcon={<ProjectOutlined style={{ color: 'var(--text-slate-400)', fontSize: 11 }} />}
                    onChange={(value) => {
                      setSelectedProjectId(value);
                      form.setFieldsValue({ projectId: value, ticketId: undefined });
                    }}
                    allowClear
                    style={{ borderRadius: 10 }}
                  >
                    {projects.map((project) => (
                      <Option key={project.value} value={project.value}>
                        {project.label} ({project.code})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="ticketId" className="mb-2">
                  <Select
                    size="large"
                    showSearch
                    placeholder={
                      <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--text-slate-400)' }}>
                        <TagOutlined style={{ fontSize: 12 }} />
                        {selectedProjectId ? 'Select a ticket' : 'Pick a project first to link a ticket'}
                      </span>
                    }
                    loading={ticketsLoading}
                    suffixIcon={<TagOutlined style={{ color: 'var(--text-slate-400)', fontSize: 11 }} />}
                    allowClear
                    disabled={!selectedProjectId}
                    optionFilterProp="label"
                    options={tickets.map((ticket: any) => ({
                      value: ticket.id,
                      label: `${ticket.ticketNumber} (${ticket.title})`,
                    }))}
                    filterOption={(input, option) =>
                      String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ borderRadius: 10 }}
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
                they show up alongside it everywhere else in ZithSpace.
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
          <Select
            size="large"
            placeholder="Select a project (or leave empty to unassign)"
            value={bulkProjectId}
            onChange={setBulkProjectId}
            loading={projectsLoading}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: '100%', borderRadius: 10 }}
            options={projects.map((p: any) => ({
              label: `${p.label}${p.code ? ` (${p.code})` : ''}`,
              value: p.value,
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
        .premium-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #f1f5f9 !important;
          padding-top: 14px !important;
          padding-bottom: 14px !important;
          line-height: 1.2 !important;
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th {
          background: #161b22 !important;
          color: #94a3b8 !important;
          border-bottom-color: #1f2937 !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          padding: 8px 16px !important;
          background: var(--bg-pure-white) !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td {
          border-bottom-color: #1f2937 !important;
          background: #161b22 !important;
        }
        .premium-table .ant-table-row:hover > td,
        .premium-table .dh-row-focused > td {
          background: #fdfdfd !important;
        }
        [data-theme='dark'] .premium-table .ant-table-row:hover > td,
        [data-theme='dark'] .premium-table .dh-row-focused > td {
          background: #1f2937 !important;
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
          padding: 6px !important;
          border-radius: 14px !important;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06) !important;
          min-width: 290px !important;
        }
        .create-document-menu .ant-dropdown-menu-item {
          border-radius: 10px !important;
          padding: 8px 10px !important;
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
          width: 38px; height: 38px;
          background: rgba(59, 130, 246, 0.10);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(59, 130, 246, 0.18);
          flex-shrink: 0;
        }
        [data-theme='dark'] .dh-hero-icon-box {
          background: rgba(59, 130, 246, 0.16);
          border-color: rgba(59, 130, 246, 0.28);
        }
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
        .dh-inline-cell:hover { background: rgba(14, 165, 233, 0.08); }
        [data-theme='dark'] .dh-inline-cell:hover { background: rgba(56, 189, 248, 0.10); }
        /* "Add Project" / "Add Ticket" empty-state buttons. */
        .dh-inline-add-btn:hover:not(:disabled) { background: rgba(59, 130, 246, 0.08) !important; }
        [data-theme='dark'] .dh-inline-add-btn:hover:not(:disabled) { background: rgba(96, 165, 250, 0.12) !important; }
        .dh-card-icon-btn {
          width: 22px; height: 22px;
          display: inline-flex; align-items: center; justify-content: center;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(4px);
          transition: background 0.15s;
        }
        .dh-card-icon-btn:hover {
          background: rgba(255, 255, 255, 0.30);
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
          grid-template-columns: repeat(5, minmax(0, 1fr));
          padding-bottom: 4px;
        }
        @media (max-width: 991px) {
          .dh-rail-track { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        @media (max-width: 767px) {
          .dh-rail-track { grid-template-columns: repeat(3, minmax(0, 1fr)); }
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
        .dh-table-shell[data-density='compact'] .ant-table-tbody > tr > td { padding: 5px 12px !important; }
        .dh-table-shell[data-density='comfortable'] .ant-table-tbody > tr > td { padding: 9px 16px !important; }
        .dh-table-shell[data-density='spacious'] .ant-table-tbody > tr > td { padding: 14px 20px !important; }

        /* Hover-only row actions (#D) */
        .dh-row-actions {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          opacity: 0;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: none;
          background: transparent;
          border-radius: 7px;
          cursor: pointer;
          color: var(--text-slate-300);
          transition: background 0.12s, color 0.12s, transform 0.12s;
          flex-shrink: 0;
        }
        .dh-name-star:hover {
          background: rgba(245, 158, 11, 0.10);
          color: #f59e0b;
          transform: scale(1.06);
        }
        .dh-name-star.is-starred {
          color: #f59e0b;
        }
        .dh-name-star.is-starred:hover {
          background: rgba(245, 158, 11, 0.16);
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
        .premium-table .ant-table-cell-fix-left-last::after,
        .premium-table .ant-table-cell-fix-right-first::after {
          box-shadow: inset 10px 0 8px -8px rgba(15, 23, 42, 0.06) !important;
        }
        [data-theme='dark'] .premium-table .ant-table-cell-fix-left-last::after,
        [data-theme='dark'] .premium-table .ant-table-cell-fix-right-first::after {
          box-shadow: inset 10px 0 8px -8px rgba(0, 0, 0, 0.45) !important;
        }

        /* Selection column polish */
        .premium-table .ant-table-selection-column { padding: 0 8px !important; }
        .premium-table .ant-checkbox-wrapper { transform: scale(0.95); }

        /* Footer area */
        .premium-table .ant-table-footer {
          background: var(--bg-secondary) !important;
          border-top: 1px solid var(--border-slate-200);
          padding: 10px 16px !important;
        }
        [data-theme='dark'] .premium-table .ant-table-footer {
          background: #0f172a !important;
          border-top-color: #1f2937 !important;
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
          background: #0f172a;
          border-color: #1f2937;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
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

export default DocumentHubPage;
