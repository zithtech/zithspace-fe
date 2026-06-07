import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Ticket } from '@/services/ticketService';
import { KanbanCard } from './KanbanCard';
import { Dropdown, type MenuProps } from 'antd';
import {
  InboxOutlined,
  FilterOutlined,
  MoreOutlined,
  PlusOutlined,
  SortAscendingOutlined,
  ShrinkOutlined,
  ArrowsAltOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { getStatusColor } from '@/utils/ticketUtils';

type ColumnSortKey = 'priority' | 'date' | 'title';

interface KanbanColumnProps {
  id: string;
  title: string;
  tickets: Ticket[];
  projects: Array<{ value: string; label: string; code: string }>;
  members: Array<{ value: string; label: string; position: string; avatarUrl?: string | null }>;
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket> & { assigneeId?: string }) => void;
  activeSprint?: any;
  kanbanScope?: 'active' | 'backlog';
  onSprintAssignment?: (ticketId: string, action: 'add' | 'remove') => void;
  onTicketClick?: (ticketId: string) => void;
  /** Optional WIP limit — when set, renders a "MAX: N" indicator on the column header. */
  maxItems?: number;
  /** Column-local state — sort, collapse, and clear-state — provided by TicketKanban. */
  sortKey?: ColumnSortKey;
  onSortChange?: (key: ColumnSortKey | undefined) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onClearColumnState?: () => void;
  /** "+" — open create flow scoped to this column's status. */
  onAddTicket?: () => void;
  /** Selection wiring for the column checkbox + cards. */
  selectionAllChecked?: boolean;
  selectionPartial?: boolean;
  onToggleSelectAll?: () => void;
  selectedTicketIds?: Set<string>;
  onToggleTicketSelected?: (ticketId: string) => void;
  hasAnySelection?: boolean;
  permissions?: {
    canUpdateTicket: boolean;
    canDeleteTicket: boolean;
    canAssignTicket: boolean;
    canManageTickets: boolean;
  };
}

const STATUS_ACCENT: Record<string, string> = {
  not_started: 'var(--kb-st-not-started)',
  in_progress: 'var(--kb-st-in-progress)',
  dev_complete: 'var(--kb-st-dev-complete)',
  dev_testing: 'var(--kb-st-dev-testing)',
  in_review: 'var(--kb-st-in-review)',
  live: 'var(--kb-st-live)',
  live_testing: 'var(--kb-st-live-testing)',
  completed: 'var(--kb-st-completed)',
  pause: 'var(--kb-st-pause)',
};

const getAccent = (statusId: string) => {
  if (STATUS_ACCENT[statusId]) return STATUS_ACCENT[statusId];
  // Fallback by ant color
  const c = getStatusColor(statusId);
  if (c === 'success') return 'var(--kb-st-completed)';
  if (c === 'processing') return 'var(--kb-st-in-progress)';
  if (c === 'warning') return 'var(--kb-st-dev-testing)';
  if (c === 'purple') return 'var(--kb-st-in-review)';
  if (c === 'cyan') return 'var(--kb-st-dev-complete)';
  if (c === 'geekblue') return 'var(--kb-st-live-testing)';
  if (c === 'orange') return 'var(--kb-st-pause)';
  if (c === 'blue') return 'var(--kb-st-live)';
  return 'var(--kb-st-not-started)';
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tickets,
  projects,
  members,
  onTicketUpdate,
  activeSprint,
  kanbanScope,
  onSprintAssignment,
  onTicketClick,
  maxItems,
  sortKey,
  onSortChange,
  collapsed = false,
  onToggleCollapsed,
  onClearColumnState,
  onAddTicket,
  selectionAllChecked = false,
  selectionPartial = false,
  onToggleSelectAll,
  selectedTicketIds,
  onToggleTicketSelected,
  hasAnySelection = false,
  permissions,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const accent = getAccent(id);
  const overLimit = typeof maxItems === 'number' && tickets.length > maxItems;

  const sortLabel: Record<ColumnSortKey, string> = {
    priority: 'Priority',
    date: 'Due date',
    title: 'Title',
  };

  const sortSubmenu: NonNullable<MenuProps['items']> = (['priority', 'date', 'title'] as ColumnSortKey[]).map((k) => ({
    key: `sort-${k}`,
    label: sortLabel[k],
    onClick: () => onSortChange?.(sortKey === k ? undefined : k),
    icon: sortKey === k ? <SortAscendingOutlined /> : <span style={{ display: 'inline-block', width: 14 }} />,
  }));

  const menuItems: NonNullable<MenuProps['items']> = [
    {
      key: 'sort',
      label: sortKey ? `Sort: ${sortLabel[sortKey]}` : 'Sort tickets',
      icon: <SortAscendingOutlined />,
      children: sortSubmenu,
    },
    {
      key: 'collapse',
      label: collapsed ? 'Expand column' : 'Collapse column',
      icon: collapsed ? <ArrowsAltOutlined /> : <ShrinkOutlined />,
      onClick: () => onToggleCollapsed?.(),
    },
    { type: 'divider' as const },
    {
      key: 'clear',
      label: 'Clear column state',
      icon: <ClearOutlined />,
      disabled: !sortKey && !collapsed,
      onClick: () => onClearColumnState?.(),
    },
  ];

  if (collapsed) {
    return (
      <div
        className="kb-column kb-column-collapsed"
        style={{ ['--kb-st-accent' as any]: accent }}
        onClick={() => onToggleCollapsed?.()}
        title={`Expand ${title}`}
        role="button"
      >
        <div className="kb-col-collapsed-inner">
          <span className="kb-col-collapsed-title">{title}</span>
          <span className="kb-col-collapsed-count">{tickets.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`kb-column ${isOver ? 'kb-col-over' : ''}`}
      style={{ ['--kb-st-accent' as any]: accent }}
    >
      <div className="kb-column-header">
        <div className="kb-col-header-row">
          <span className="kb-col-title">{title}</span>
          {typeof maxItems === 'number' && (
            <span className={`kb-col-max ${overLimit ? 'is-over' : ''}`}>MAX: {maxItems}</span>
          )}
        </div>
        <div className="kb-col-toolbar">
          <span className="kb-col-toolbar-count">
            <FilterOutlined />
            {tickets.length}
          </span>
          <div className="kb-col-toolbar-actions">
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
              <button type="button" className="kb-col-icon-btn" aria-label="More" title="More options">
                <MoreOutlined />
              </button>
            </Dropdown>
            <button
              type="button"
              className="kb-col-icon-btn"
              aria-label="Add ticket"
              title="Add ticket to this column"
              onClick={onAddTicket}
              disabled={!onAddTicket}
            >
              <PlusOutlined />
            </button>
            <button
              type="button"
              className={`kb-col-checkbox ${selectionAllChecked ? 'is-checked' : ''} ${selectionPartial ? 'is-partial' : ''}`}
              aria-label={selectionAllChecked ? 'Deselect all' : 'Select all'}
              title={selectionAllChecked ? 'Deselect all in column' : 'Select all in column'}
              onClick={onToggleSelectAll}
              disabled={tickets.length === 0}
            />
          </div>
        </div>
      </div>

      <div ref={setNodeRef} className="kb-col-body custom-scrollbar">
        <SortableContext id={id} items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.length === 0 ? (
            <div className="kb-col-empty">
              <InboxOutlined style={{ fontSize: 22, opacity: 0.6 }} />
              <span>No tickets in {title.toLowerCase()}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>Drop a card here</span>
            </div>
          ) : (
            tickets.map((ticket) => (
              <KanbanCard
                key={ticket.id}
                ticket={ticket}
                projects={projects}
                members={members}
                onUpdate={onTicketUpdate}
                activeSprint={activeSprint}
                kanbanScope={kanbanScope}
                onSprintAssignment={onSprintAssignment}
                onClick={onTicketClick ? () => onTicketClick(ticket.id) : undefined}
                permissions={permissions}
                selected={selectedTicketIds?.has(ticket.id) ?? false}
                onToggleSelected={onToggleTicketSelected ? () => onToggleTicketSelected(ticket.id) : undefined}
                showSelectionAffordance={hasAnySelection}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
