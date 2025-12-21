
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
import { Ticket } from '@/services/ticketService';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

interface TicketKanbanProps {
  tickets: Ticket[];
  projects: Array<{ value: string; label: string; code: string }>;
  members: Array<{ value: string; label: string; position: string }>;
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket> & { assigneeId?: string }) => void;
}

const COLUMNS = [
  { id: 'not_started', title: 'Not Started' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_testing', title: 'In Testing' },
  { id: 'completed', title: 'Completed' },
];

export const TicketKanban: React.FC<TicketKanbanProps> = ({ tickets, projects, members, onTicketUpdate }) => {
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
    <div style={{ height: 'calc(100vh - 200px)', overflowX: 'auto', padding: '16px 0' }}>
       <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', gap: 16, height: '100%', alignItems: 'flex-start' }}>
            {COLUMNS.map((col) => (
                <KanbanColumn
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    tickets={columns[col.id] || []}
                    projects={projects}
                    members={members}
                    onTicketUpdate={onTicketUpdate}
                />
            ))}
        </div>

        <DragOverlay dropAnimation={null}>
            {activeTicket ? <KanbanCard ticket={activeTicket} projects={projects} members={members} onUpdate={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
