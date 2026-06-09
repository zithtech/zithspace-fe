import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  MeasuringStrategy,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  CollisionDetection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button, Empty, Dropdown, type MenuProps } from 'antd';
import {
  CheckCircleOutlined,
  RocketOutlined,
  TeamOutlined,
  CloseOutlined,
  FolderAddOutlined,
  DeleteOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Ticket } from '@/services/ticketService';
import { STATUS_OPTIONS } from '@/utils/ticketUtils';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

type ColumnSortKey = 'priority' | 'date' | 'title';

interface TicketKanbanProps {
  tickets: Ticket[];
  projects: Array<{ value: string; label: string; code: string }>;
  members: Array<{ value: string; label: string; position: string; avatarUrl?: string | null }>;
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket> & { assigneeId?: string }) => void;
  activeSprint?: any;
  kanbanScope?: 'active' | 'backlog';
  onScopeChange?: (scope: 'active' | 'backlog') => void;
  onSprintAssignment?: (ticketId: string, action: 'add' | 'remove') => void;
  onCompleteSprint?: () => void;
  filters?: any;
  onFilterChange?: (key: string, value: any) => void;
  onTicketClick?: (ticketId: string) => void;
  /** Column "+" button — opens create flow with this status preset. */
  onAddTicketToColumn?: (statusId: string) => void;
  /** Bulk action handlers used by the selection bar. */
  onBulkArchive?: (ticketIds: string[]) => void;
  onBulkDelete?: (ticketIds: string[]) => void;
  /**
   * When true, the toolbar omits the sprint name chip, ticket-count chip,
   * and Complete Sprint button — used when an external Sprint header above
   * the kanban already renders that info.
   */
  hideSprintMeta?: boolean;
  permissions?: {
    canUpdateTicket: boolean;
    canDeleteTicket: boolean;
    canAssignTicket: boolean;
    canManageTickets: boolean;
  };
}

// Priority ordering for local column sort (lower = higher rank).
const PRIORITY_RANK: Record<string, number> = { P1: 0, P2: 1, P3: 2 };
const compareTickets = (sortKey: ColumnSortKey, a: Ticket, b: Ticket): number => {
  if (sortKey === 'priority') {
    const ra = PRIORITY_RANK[(a.priority || '').toUpperCase()] ?? 99;
    const rb = PRIORITY_RANK[(b.priority || '').toUpperCase()] ?? 99;
    return ra - rb;
  }
  if (sortKey === 'date') {
    const da = a.endDate ? new Date(a.endDate).getTime() : Infinity;
    const db = b.endDate ? new Date(b.endDate).getTime() : Infinity;
    return da - db;
  }
  return (a.title || '').localeCompare(b.title || '');
};

const COLUMNS = STATUS_OPTIONS.map((status) => ({
  id: status.value,
  title: status.label,
}));

export const TicketKanban: React.FC<TicketKanbanProps> = ({
  tickets,
  projects,
  members,
  onTicketUpdate,
  activeSprint,
  kanbanScope,
  onScopeChange,
  onSprintAssignment,
  onCompleteSprint,
  filters,
  onFilterChange,
  onTicketClick,
  onAddTicketToColumn,
  onBulkArchive,
  onBulkDelete,
  hideSprintMeta = false,
  permissions,
}) => {
  const { canUpdateTicket, canDeleteTicket, canAssignTicket, canManageTickets } = permissions || {
    canUpdateTicket: true,
    canDeleteTicket: true,
    canAssignTicket: true,
    canManageTickets: true,
  };

  const [activeId, setActiveId] = useState<string | null>(null);
  // Column-local sort: undefined = use upstream order (no sort applied).
  const [columnSort, setColumnSort] = useState<Record<string, ColumnSortKey | undefined>>({});
  // Columns the user has collapsed to a thin vertical strip.
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(() => new Set());
  // Card selection across all columns (board-wide multi-select).
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(() => new Set());

  const toggleColumnCollapsed = (statusId: string) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  };

  const setColumnSortKey = (statusId: string, key: ColumnSortKey | undefined) => {
    setColumnSort((prev) => ({ ...prev, [statusId]: key }));
  };

  const clearColumnState = (statusId: string) => {
    // "Clear filters scoped to this column" → drop column-local sort and
    // expand it if collapsed. Global filters are out of scope here.
    setColumnSort((prev) => ({ ...prev, [statusId]: undefined }));
    setCollapsedColumns((prev) => {
      if (!prev.has(statusId)) return prev;
      const next = new Set(prev);
      next.delete(statusId);
      return next;
    });
  };

  const toggleTicketSelected = (ticketId: string) => {
    setSelectedTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  };

  const toggleColumnSelectAll = (statusId: string, columnTickets: Ticket[]) => {
    const columnIds = columnTickets.map((t) => t.id);
    const allSelected = columnIds.length > 0 && columnIds.every((id) => selectedTicketIds.has(id));
    setSelectedTicketIds((prev) => {
      const next = new Set(prev);
      if (allSelected) columnIds.forEach((id) => next.delete(id));
      else columnIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedTicketIds(new Set());

  // Mouse uses a small distance threshold so clicks vs. drags don't fight.
  // 3px feels snappier than 5px without false-positives on intentional clicks.
  // Touch uses a hold-delay so users can scroll columns without picking up a card.
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 3 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 160, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Hybrid collision detection: prefer the pointer position, fall back to
  // rect intersection when the pointer is outside any droppable. This feels
  // much more precise than `closestCorners` for tall kanban columns.
  // Exclude the actively dragged card from results so `over` never resolves
  // to the dragging item itself (which would suppress status updates).
  const collisionDetection: CollisionDetection = (args) => {
    const activeKey = args.active.id;
    const exclude = (collisions: ReturnType<typeof pointerWithin>) =>
      collisions.filter((c) => c.id !== activeKey);

    const pointerCollisions = exclude(pointerWithin(args));
    if (pointerCollisions.length > 0) return pointerCollisions;
    return exclude(rectIntersection(args));
  };

  const columns = useMemo(() => {
    const grouped: Record<string, Ticket[]> = {};
    STATUS_OPTIONS.forEach((option) => {
      grouped[option.value] = [];
    });
    tickets.forEach((ticket) => {
      const normalizedStatus = (ticket.status || 'not_started').toLowerCase().replace(/ /g, '_');
      if (grouped[normalizedStatus]) {
        grouped[normalizedStatus].push(ticket);
      }
    });
    // Apply any column-local sort. Stable copy so dnd ordering reflects sort.
    Object.keys(grouped).forEach((statusId) => {
      const key = columnSort[statusId];
      if (key) {
        grouped[statusId] = [...grouped[statusId]].sort((a, b) => compareTickets(key, a, b));
      }
    });
    return grouped;
  }, [tickets, columnSort]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    const overId = over?.id;

    if (!overId) {
      setActiveId(null);
      return;
    }

    const activeTicket = tickets.find((t) => t.id === activeId);
    let newStatus = overId as string;

    const isOverColumn = COLUMNS.some((col) => col.id === newStatus);

    if (!isOverColumn) {
      const overTicket = tickets.find((t) => t.id === overId);
      if (overTicket) {
        newStatus = overTicket.status;
      } else {
        setActiveId(null);
        return;
      }
    }

    if (activeTicket && activeTicket.status !== newStatus) {
      onTicketUpdate(activeId, { status: newStatus as any });
    }

    setActiveId(null);
  };

  const activeTicket = activeId ? tickets.find((t) => t.id === activeId) : null;

  // Assignee filter + Sprint/Backlog scope toggle now live elsewhere in the
  // page chrome. The toolbar is only worth rendering when it has the sprint
  // meta chip + Complete Sprint button to show.
  const showToolbar = !hideSprintMeta && !!activeSprint;
  const totalTickets = tickets.length;

  return (
    <div
      className="kanban-board-premium"
      style={{
        height: 'calc(100dvh - 180px)',
        maxHeight: 'calc(100dvh - 180px)',
        minHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {showToolbar && (
        <div className="kb-toolbar">
          <div className="kb-toolbar-left">
            {kanbanScope === 'active' && activeSprint && (
              <span className="kb-toolbar-meta">
                <RocketOutlined />
                {activeSprint?.name || 'Active Sprint'}
              </span>
            )}
            <span className="kb-toolbar-meta" style={{ background: 'rgba(100, 116, 139, 0.1)', color: 'var(--kb-text-muted)' }}>
              <TeamOutlined />
              {totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>

          {kanbanScope === 'active' && activeSprint && onCompleteSprint && canManageTickets && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={onCompleteSprint}
                className="kb-complete-btn"
              >
                Complete Sprint
              </Button>
            </div>
          )}
        </div>
      )}

      {selectedTicketIds.size > 0 && (
        <div className="kb-bulk-bar">
          <span className="kb-bulk-count">
            <b>{selectedTicketIds.size}</b> selected
          </span>
          <Dropdown
            trigger={['click']}
            placement="bottomLeft"
            menu={{
              items: STATUS_OPTIONS.map((s): NonNullable<MenuProps['items']>[number] => ({
                key: s.value,
                label: s.label,
                onClick: () => {
                  Array.from(selectedTicketIds).forEach((id) => onTicketUpdate(id, { status: s.value as any }));
                  clearSelection();
                },
              })),
            }}
          >
            <Button size="small" icon={<SwapOutlined />} className="kb-bulk-btn">
              Move to…
            </Button>
          </Dropdown>
          {onBulkArchive && (canUpdateTicket || canManageTickets) && (
            <Button
              size="small"
              icon={<FolderAddOutlined />}
              className="kb-bulk-btn"
              onClick={() => {
                onBulkArchive(Array.from(selectedTicketIds));
                clearSelection();
              }}
            >
              Archive
            </Button>
          )}
          {onBulkDelete && canDeleteTicket && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              className="kb-bulk-btn"
              onClick={() => {
                onBulkDelete(Array.from(selectedTicketIds));
                clearSelection();
              }}
            >
              Delete
            </Button>
          )}
          <Button
            size="small"
            type="text"
            icon={<CloseOutlined />}
            onClick={clearSelection}
            className="kb-bulk-cancel"
          >
            Clear
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        autoScroll={{ threshold: { x: 0.05, y: 0.18 }, acceleration: 12 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        accessibility={{
          container: typeof document !== 'undefined' ? document.body : undefined,
        }}
      >
        {totalTickets === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--kb-card-bg)',
              border: '1px solid var(--kb-card-border)',
              borderRadius: 14,
              boxShadow: 'var(--kb-shadow-card)',
            }}
          >
            <Empty description={<span style={{ color: 'var(--kb-text-muted)' }}>No tickets yet — create one to get started</span>} />
          </div>
        ) : (
          <div className="kb-track">
            {COLUMNS.map((col) => {
              const colTickets = columns[col.id] || [];
              const colAllSelected = colTickets.length > 0 && colTickets.every((t) => selectedTicketIds.has(t.id));
              const colSomeSelected = colTickets.some((t) => selectedTicketIds.has(t.id));
              return (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  tickets={colTickets}
                  projects={projects}
                  members={members}
                  onTicketUpdate={onTicketUpdate}
                  activeSprint={activeSprint}
                  kanbanScope={kanbanScope}
                  onSprintAssignment={onSprintAssignment}
                  onTicketClick={onTicketClick}
                  permissions={permissions}
                  sortKey={columnSort[col.id]}
                  onSortChange={(key) => setColumnSortKey(col.id, key)}
                  collapsed={collapsedColumns.has(col.id)}
                  onToggleCollapsed={() => toggleColumnCollapsed(col.id)}
                  onClearColumnState={() => clearColumnState(col.id)}
                  onAddTicket={onAddTicketToColumn ? () => onAddTicketToColumn(col.id) : undefined}
                  selectionAllChecked={colAllSelected}
                  selectionPartial={!colAllSelected && colSomeSelected}
                  onToggleSelectAll={() => toggleColumnSelectAll(col.id, colTickets)}
                  selectedTicketIds={selectedTicketIds}
                  onToggleTicketSelected={toggleTicketSelected}
                  hasAnySelection={selectedTicketIds.size > 0}
                />
              );
            })}
          </div>
        )}

        <DragOverlay
          dropAnimation={{
            duration: 220,
            // easeOutQuart — natural deceleration without overshoot, feels
            // like the card "settles" into the new slot instead of snapping.
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          zIndex={1000}
        >
          {activeTicket ? (
            <KanbanCard
              ticket={activeTicket}
              projects={projects}
              members={members}
              onUpdate={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
