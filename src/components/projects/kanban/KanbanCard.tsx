
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Tag, Typography, Avatar, Space, Select, Input } from 'antd';
import { Ticket } from '@/services/ticketService';
import { getPriorityColor, getTypeColor } from '@/utils/ticketUtils';

const { Text } = Typography;
const { TextArea } = Input;

interface KanbanCardProps {
  ticket: Ticket;
  projects?: Array<{ value: string; label: string; code: string }>;
  members?: Array<{ value: string; label: string; position: string }>;
  onUpdate: (ticketId: string, updates: Partial<Ticket> & { assigneeId?: string }) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ ticket, projects, members, onUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    marginBottom: 8,
    // border: '1px solid #f0f0f0', // Ensure border exists
    backgroundColor: 'white',
  };

  // Editing logic
  const [editingField, setEditingField] = useState<"title" | "priority" | "type" | "storyPoint" | "assignee" | null>(null);
  const [activeValue, setActiveValue] = useState<any>(null);

  // Stop drag propagation
  const stopPropagation = (e: React.PointerEvent | React.MouseEvent | React.UIEvent) => {
      e.stopPropagation();
  };

  const startEditing = (field: "title" | "priority" | "type" | "storyPoint" | "assignee", initialValue: any) => {
      setActiveValue(initialValue);
      setEditingField(field);
  };

  const cleanup = () => {
      setEditingField(null);
      setActiveValue(null);
  };

  const handleSave = (val: any) => {
      if (editingField) {
          onUpdate(ticket.id, { [editingField]: val });
      }
      cleanup();
  };

  const renderTitle = () => {
      if (editingField === 'title') {
          return (
              <TextArea
                  value={activeValue}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  onChange={(e) => setActiveValue(e.target.value)}
                  onFocus={(e) => {
                      const val = e.currentTarget.value;
                      e.currentTarget.setSelectionRange(val.length, val.length);
                  }}
                  onBlur={() => handleSave(activeValue)}
                  onKeyDown={(e) => {
                      if (e.key === ' ') {
                          e.stopPropagation();
                      }
                      if(e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSave(activeValue);
                      }
                      if(e.key === 'Escape') cleanup();
                  }}
                  autoFocus
                  onPointerDown={stopPropagation}
                  onMouseDown={stopPropagation}
              />
          );
      }
      return (
          <div
            onPointerDown={stopPropagation}
            onMouseDown={stopPropagation}
            onClick={() => startEditing('title', ticket.title)}
            style={{ cursor: 'text', marginBottom: 8 }}
          >
            <Text style={{ fontSize: 13 }}>{ticket.title}</Text>
          </div>
      );
  };

  const renderPriority = () => {
    if (editingField === 'priority') {
      return (
        <div onPointerDown={stopPropagation}>
            <Select
            autoFocus
            open
            size="small"
            style={{ width: 80 }}
            value={activeValue}
            onChange={(val) => {
                // Select commits immediately
                handleSave(val);
            }}
            onBlur={cleanup}
            options={[
                { label: "High", value: "P1" },
                { label: "Medium", value: "P2" },
                { label: "Lite", value: "P3" },
            ]}
            />
        </div>
      );
    }
    return (
      <div onPointerDown={stopPropagation} onMouseDown={stopPropagation} onClick={() => startEditing('priority', ticket.priority)}>
          <Tag 
            color={getPriorityColor(ticket.priority)} 
            style={{ margin: 0, fontSize: 10, cursor: 'pointer' }}
          >
            {ticket.priority}
          </Tag>
      </div>
    );
  };

  const renderStoryPoints = () => {
      if (editingField === 'storyPoint') {
          return (
             <div onPointerDown={stopPropagation}>
                 <Input
                    type="number"
                    size="small"
                    style={{ width: 60 }}
                    autoFocus
                    value={activeValue}
                    onChange={(e) => setActiveValue(e.target.value)}
                    onBlur={() => {
                         const val = parseFloat(activeValue);
                         handleSave(isNaN(val) ? 0 : val);
                    }}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            const val = parseFloat(activeValue);
                            handleSave(isNaN(val) ? 0 : val);
                        }
                        if(e.key === 'Escape') cleanup();
                    }}
                 />
             </div>
          );
      }
      return (
          <div onPointerDown={stopPropagation} onMouseDown={stopPropagation} onClick={() => startEditing('storyPoint', ticket.storyPoint)}>
            <Tag 
                style={{ margin: 0, fontSize: 10, cursor: 'pointer' }}
            >
                {ticket.storyPoint !== undefined && ticket.storyPoint !== null ? `${ticket.storyPoint} SP` : '- SP'}
            </Tag>
          </div>
      );
  };

  const renderAssignee = () => {
      if (editingField === 'assignee') {
          return (
            <div onPointerDown={stopPropagation}>
                <Select
                    showSearch
                    autoFocus
                    defaultOpen
                    size="small"
                    style={{ width: 120 }}
                    placeholder="Assign"
                    filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    value={activeValue}
                    onChange={(val) => handleSave(val)} 
                    onBlur={cleanup}
                    options={members?.map(m => ({ label: m.label, value: m.value }))}
                />
            </div>
          );
      }
      return (
        <div 
            style={{ cursor: 'pointer' }} 
            onClick={() => startEditing('assignee', ticket.assignee?.id)}
            onPointerDown={stopPropagation}
            onMouseDown={stopPropagation}
        >
            {ticket.assignee ? (
              <Avatar size="small" style={{ backgroundColor: '#1677ff', fontSize: 12 }}>{ticket.assignee.name?.[0]?.toUpperCase()}</Avatar>
            ) : (
               <Avatar size="small" style={{ backgroundColor: '#f0f0f0', fontSize: 12, border: '1px dashed #d9d9d9' }} >+</Avatar>
            )}
        </div>
      );
  };
    
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(editingField ? {} : listeners)}>
      <Card 
        size="small" 
        hoverable 
        bodyStyle={{ padding: '10px' }}
        style={{ borderRadius: 8, cursor: editingField ? 'default' : 'grab' }}
      >
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          {/* Header: ID and Type */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>{ticket.ticketNumber}</Text>
            {/* Type Edit */}
             {editingField === 'type' ? (
                 <div onPointerDown={stopPropagation}>
                     <Select
                        autoFocus
                        open
                        size="small"
                        style={{ width: 70 }}
                        value={activeValue}
                        onChange={(val) => handleSave(val)}
                        onBlur={cleanup}
                        options={[
                            { label: "Bug", value: "Bug" },
                            { label: "Task", value: "Task" },
                        ]}
                     />
                 </div>
             ) : (
                <div onPointerDown={stopPropagation} onMouseDown={stopPropagation} onClick={() => startEditing('type', ticket.type)}>
                    <Tag 
                        color={getTypeColor(ticket.type)} 
                        style={{ margin: 0, fontSize: 10, lineHeight: '18px', cursor: 'pointer' }}
                    >
                        {ticket.type}
                    </Tag>
                </div>
             )}
          </div>
          
          {/* Title Edit */}
          {renderTitle()}

          {/* Footer: Priority, SP, Assignee */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Space size={4}>
                 {renderPriority()}
                 {renderStoryPoints()}
            </Space>
            
            {renderAssignee()}
          </div>
        </Space>
      </Card>
    </div>
  );
};
