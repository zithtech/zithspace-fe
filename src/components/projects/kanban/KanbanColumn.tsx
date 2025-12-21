import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Ticket } from '@/services/ticketService';
import { KanbanCard } from './KanbanCard';
import { Typography, Badge } from 'antd';
import { getStatusColor } from '@/utils/ticketUtils';

const { Text } = Typography;

interface KanbanColumnProps {
  id: string; 
  title: string;
  tickets: Ticket[];
  projects: Array<{ value: string; label: string; code: string }>;
  members: Array<{ value: string; label: string; position: string }>;
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket> & { assigneeId?: string }) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tickets, projects, members, onTicketUpdate }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const getStatusBadgeColor = (statusId: string) => {
       const color = getStatusColor(statusId);
       if (color === 'success') return '#52c41a';
       if (color === 'processing') return '#1677ff';
       if (color === 'warning') return '#faad14';
       return '#d9d9d9';
  };

  return (
    <div style={{ 
        flex: 1, 
        minWidth: 280, 
        backgroundColor: '#ffffffff', // Changed to white as requested
        borderRadius: 8, 
        padding: '12px',
        // border: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        minHeight:'100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getStatusBadgeColor(id) }} />
            <Text strong style={{ textTransform: 'uppercase', fontSize: 12, color: '#595959' }}>{title}</Text>
          </div>
          <Badge count={tickets.length} showZero style={{ backgroundColor: '#f0f0f0', color: '#595959' }} />
      </div>

      <div ref={setNodeRef} style={{ flex: 1, overflowY: 'auto', minHeight: 100 }}>
        <SortableContext 
            id={id} 
            items={tickets.map(t => t.id)} 
            strategy={verticalListSortingStrategy}
        >
          {tickets.map((ticket) => (
            <KanbanCard 
                key={ticket.id} 
                ticket={ticket}
                projects={projects}
                members={members}
                onUpdate={onTicketUpdate}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
