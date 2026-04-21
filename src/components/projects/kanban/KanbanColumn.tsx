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
       if (color === 'success') return '#52c41a';
       if (color === 'processing') return '#1677ff';
       if (color === 'warning') return '#faad14';
       return '#d9d9d9';
  };

  return (
    <div style={{ 
        flex: 1, 
        minWidth: 300, 
        backgroundColor: '#f8f9fa', 
        borderRadius: 12, 
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        minHeight: '100%',
        border: '1px solid #f0f0f0'
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
              boxShadow: `0 0 0 2px ${getStatusBadgeColor(id)}20`
            }} />
            <Text strong style={{ 
              textTransform: 'uppercase', 
              fontSize: 11, 
              letterSpacing: '0.5px',
              color: '#434343' 
            }}>
              {title}
            </Text>
            <Badge 
              count={tickets.length} 
              showZero 
              style={{ 
                backgroundColor: '#ffffff', 
                color: '#8c8c8c',
                border: '1px solid #f0f0f0',
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
