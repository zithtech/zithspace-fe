import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Ticket } from '@/services/ticketService';
import { KanbanCard } from './KanbanCard';
import { InboxOutlined } from '@ant-design/icons';
import { getStatusColor } from '@/utils/ticketUtils';

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
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const accent = getAccent(id);

  return (
    <div
      className={`kb-column ${isOver ? 'kb-col-over' : ''}`}
      style={{ ['--kb-st-accent' as any]: accent }}
    >
      <div className="kb-column-header">
        <div className="kb-col-title">
          <span className="kb-col-dot" />
          <span>{title}</span>
        </div>
        <span className="kb-col-count">{tickets.length}</span>
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
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
