import React, { useState, useMemo } from 'react';
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
  members: Array<{ value: string; label: string; position: string; avatarUrl?: string | null }>;
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket> & { assigneeId?: string }) => void;
  activeSprint?: any;
  kanbanScope?: 'active' | 'backlog';
  onSprintAssignment?: (ticketId: string, action: 'add' | 'remove') => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tickets, projects, members, onTicketUpdate, activeSprint, kanbanScope, onSprintAssignment }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const getStatusBadgeColor = (statusId: string) => {
       const color = getStatusColor(statusId);
       if (color === 'success') return '#10b981';
       if (color === 'processing') return 'var(--premium-blue)';
       if (color === 'warning') return '#f59e0b';
       if (color === 'purple') return '#8b5cf6';
       if (color === 'cyan') return '#06b6d4';
       if (color === 'geekblue') return '#4f46e5';
       if (color === 'orange') return '#f59e0b';
       return 'var(--text-slate-400)';
  };

  return (
    <div style={{ 
        flex: 1, 
        minWidth: 300, 
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: 12, 
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        minHeight: '100%',
        border: '1px solid var(--border-color)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 16,
        padding: '0 4px' 
      }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              backgroundColor: getStatusBadgeColor(id),
              boxShadow: `0 0 0 2px ${getStatusColor(id) === 'processing' ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}`
            }} />
            <Text strong style={{ 
              textTransform: 'uppercase', 
              fontSize: 11, 
              letterSpacing: '0.5px',
              color: 'var(--text-primary)' 
            }}>
              {title}
            </Text>
            <Badge 
              count={tickets.length} 
              showZero 
              style={{ 
                backgroundColor: 'var(--bg-pure-white)', 
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                fontSize: 10,
                fontWeight: 600,
                boxShadow: 'none'
              }} 
            />
          </div>
      </div>

      <div 
        ref={setNodeRef} 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          minHeight: 150,
          paddingRight: 4,
          scrollbarWidth: 'thin',
        }}
        className="custom-scrollbar"
      >
        <SortableContext 
            id={id} 
            items={tickets.map(t => t.id)} 
            strategy={verticalListSortingStrategy}
        >
          <div style={{ padding: '2px' }}>
            {tickets.map((ticket) => (
              <KanbanCard 
                  key={ticket.id} 
                  ticket={ticket}
                  projects={projects}
                  members={members}
                  onUpdate={onTicketUpdate}
                  activeSprint={activeSprint}
                  kanbanScope={kanbanScope}
                  onSprintAssignment={onSprintAssignment}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};
