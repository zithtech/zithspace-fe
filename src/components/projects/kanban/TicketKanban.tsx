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
import { Button, Avatar, Tooltip, Select, Empty, Segmented } from 'antd';
import { CheckCircleOutlined, RocketOutlined, TeamOutlined, ThunderboltOutlined, InboxOutlined } from '@ant-design/icons';
import { Ticket } from '@/services/ticketService';
import { STATUS_OPTIONS } from '@/utils/ticketUtils';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

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
  permissions?: {
    canUpdateTicket: boolean;
    canDeleteTicket: boolean;
    canAssignTicket: boolean;
    canManageTickets: boolean;
  };
}

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
  permissions,
}) => {
  const { canUpdateTicket, canDeleteTicket, canAssignTicket, canManageTickets } = permissions || {
    canUpdateTicket: true,
    canDeleteTicket: true,
    canAssignTicket: true,
    canManageTickets: true,
  };

  const [activeId, setActiveId] = useState<string | null>(null);

  // Mouse uses a small distance threshold so clicks vs. drags don't fight.
  // Touch uses a hold-delay so users can scroll columns without picking up a card.
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
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
      if (grouped[ticket.status]) {
        grouped[ticket.status].push(ticket);
      }
    });
    return grouped;
  }, [tickets]);

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

  const showToolbar = !!onFilterChange || !!onScopeChange || (kanbanScope === 'active' && activeSprint && onCompleteSprint && canManageTickets);
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

            {members.length > 0 && (
              <Avatar.Group
                max={{ count: 6, style: { color: '#f56a00', backgroundColor: '#fde3cf', cursor: 'pointer' } }}
                size={28}
              >
                {members.map((member) => {
                  const isSelected = filters?.assignee?.includes(member.value);
                  return (
                    <Tooltip title={`${member.label}${member.position ? ` — ${member.position}` : ''}`} key={member.value}>
                      <Avatar
                        style={{
                          backgroundColor: isSelected ? '#1d4ed8' : '#3B82F6',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 0 2px var(--kb-card-bg), 0 0 0 4px var(--kb-st-in-progress)' : undefined,
                          transition: 'all 0.18s ease',
                        }}
                        src={member.avatarUrl || undefined}
                        onClick={() => {
                          if (!onFilterChange) return;
                          const current = filters?.assignee || [];
                          const next = current.includes(member.value)
                            ? current.filter((id: string) => id !== member.value)
                            : [...current, member.value];
                          onFilterChange('assignee', next);
                        }}
                      >
                        {!member.avatarUrl && member.label.charAt(0).toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  );
                })}
              </Avatar.Group>
            )}

            {onFilterChange && (
              <Select
                mode="multiple"
                placeholder="Filter assignees"
                style={{ minWidth: 220, maxWidth: 360 }}
                value={filters?.assignee || []}
                onChange={(values) => onFilterChange('assignee', values)}
                maxTagCount="responsive"
                allowClear
                className="premium-select"
                options={members.map((m) => ({ label: m.label, value: m.value }))}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            {onScopeChange && (
              <Segmented
                value={kanbanScope || 'active'}
                onChange={(v) => onScopeChange(v as 'active' | 'backlog')}
                options={[
                  { label: 'Sprint', value: 'active', icon: <ThunderboltOutlined style={{ fontSize: 13 }} /> },
                  { label: 'Backlog', value: 'backlog', icon: <InboxOutlined style={{ fontSize: 13 }} /> },
                ]}
                className="saas-segmented-premium"
              />
            )}
            {kanbanScope === 'active' && activeSprint && onCompleteSprint && canManageTickets && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={onCompleteSprint}
                className="kb-complete-btn"
              >
                Complete Sprint
              </Button>
            )}
          </div>
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
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tickets={columns[col.id] || []}
                projects={projects}
                members={members}
                onTicketUpdate={onTicketUpdate}
                activeSprint={activeSprint}
                kanbanScope={kanbanScope}
                onSprintAssignment={onSprintAssignment}
                onTicketClick={onTicketClick}
                permissions={permissions}
              />
            ))}
          </div>
        )}

        <DragOverlay
          dropAnimation={{
            duration: 180,
            easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
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
