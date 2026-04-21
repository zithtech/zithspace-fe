
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
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button, Avatar, Tooltip, Select } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
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
}

const COLUMNS = STATUS_OPTIONS.map(status => ({
  id: status.value,
  title: status.label
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
  onFilterChange
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag (prevents accidental drags on click)
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tickets by status
  const columns = useMemo(() => {
    const grouped: Record<string, Ticket[]> = {
      not_started: [],
      in_progress: [],
      in_testing: [],
      completed: [],
    };

    tickets.forEach((ticket) => {
      if (grouped[ticket.status]) {
        grouped[ticket.status].push(ticket);
      } else {
        // Handle unexpected statuses if any
        // grouped[ticket.status] = [ticket];
      }
    });
    return grouped;
  }, [tickets]);

  const findContainer = (id: string) => {
    if (Object.keys(columns).includes(id)) return id;
    return tickets.find((t) => t.id === id)?.status;
  };

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

    // Find the status of the item we are over
    // If over a container (column), allow drop
    // If over another card, find that card's status
    const activeTicket = tickets.find(t => t.id === activeId);
    let newStatus = overId as string;

    // Check if we dropped on a column directly
    const isOverColumn = COLUMNS.some(col => col.id === newStatus);

    if (!isOverColumn) {
      // Dropped on a card?
      const overTicket = tickets.find(t => t.id === overId);
      if (overTicket) {
        newStatus = overTicket.status;
      } else {
        // Should not happen if overId exists
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

  return (
    <div style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      {/* Complete Sprint Section - Refined for premium look */}
      {kanbanScope === 'active' && activeSprint && onCompleteSprint && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: "16px",
        }}>
          {/* Members Avatars - Jira style */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar.Group
              maxCount={5}
              size="default"
              maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf', cursor: 'pointer' }}
            >
              {members.map((member) => {
                const isSelected = filters?.assignee?.includes(member.value);
                return (
                  <Tooltip title={`${member.label} - ${member.position}`} key={member.value}>
                    <Avatar 
                      style={{ 
                        backgroundColor: isSelected ? '#003a8c' : '#1890ff', 
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #fff' : 'none',
                        boxShadow: isSelected ? '0 0 0 2px #1890ff' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      src={member.avatarUrl}
                      onClick={() => {
                        if (!onFilterChange) return;
                        const current = filters?.assignee || [];
                        const next = current.includes(member.value)
                          ? current.filter((id: string) => id !== member.value)
                          : [...current, member.value];
                        onFilterChange('assignee', next);
                      }}
                    >
                      {!member.avatarUrl && member.label.charAt(0)}
                    </Avatar>
                  </Tooltip>
                );
              })}
            </Avatar.Group>
            {members.length > 0 && (
              <span style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 500, marginRight: 8 }}>
                {members.length} members
              </span>
            )}
            
            {onFilterChange && (
              <Select
                mode="multiple"
                placeholder="Filter by users"
                style={{ minWidth: 200, maxWidth: 400 }}
                value={filters?.assignee || []}
                onChange={(values) => onFilterChange('assignee', values)}
                maxTagCount="responsive"
                allowClear
                className="premium-select"
                options={members.map(m => ({
                  label: m.label,
                  value: m.value
                }))}
              />
            )}
          </div>

          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={onCompleteSprint}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              height: 34,
              boxShadow: '0 2px 4px rgba(82, 196, 26, 0.15)'
            }}
          >
            Complete Sprint
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display: 'flex',
          gap: 20,
          flex: 1,
          overflowX: 'auto',
          paddingBottom: 16,
          alignItems: 'stretch'
        }} className="custom-scrollbar">
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
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeTicket ? (
            <div style={{
              transform: 'rotate(2deg)',
              transition: 'transform 0.2s ease',
              pointerEvents: 'none'
            }}>
              <KanbanCard
                ticket={activeTicket}
                projects={projects}
                members={members}
                onUpdate={() => { }}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
