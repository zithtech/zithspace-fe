import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button, Avatar, Tooltip, Select, Empty } from 'antd';
import { CheckCircleOutlined, RocketOutlined, TeamOutlined } from '@ant-design/icons';
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
  onSprintAssignment?: (ticketId: string, action: 'add' | 'remove') => void;
  onCompleteSprint?: () => void;
  filters?: any;
  onFilterChange?: (key: string, value: any) => void;
  onTicketClick?: (ticketId: string) => void;
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
  onSprintAssignment,
  onCompleteSprint,
  filters,
  onFilterChange,
  onTicketClick,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const showToolbar = !!onFilterChange || (kanbanScope === 'active' && activeSprint && onCompleteSprint);
  const totalTickets = tickets.length;

  return (
    <div
      className="kanban-board-premium"
      style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}
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

          {kanbanScope === 'active' && activeSprint && onCompleteSprint && (
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
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
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
              />
            ))}
          </div>
        )}

        <DragOverlay
          dropAnimation={{
            duration: 220,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
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
