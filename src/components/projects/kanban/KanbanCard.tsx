
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Tag, Typography, Avatar, Space, Select, Input, Dropdown, MenuProps, Button, Divider } from 'antd';
import { Ticket } from '@/services/ticketService';
import { getPriorityColor, getTypeColor, PRIORITY_OPTIONS, TYPE_OPTIONS } from '@/utils/ticketUtils';
import { MoreOutlined, RocketOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

interface KanbanCardProps {
  ticket: Ticket;
  projects?: Array<{ value: string; label: string; code: string }>;
  members?: Array<{ value: string; label: string; position: string; avatarUrl?: string | null }>;
  onUpdate: (ticketId: string, updates: Partial<Ticket> & { assigneeId?: string }) => void;
  activeSprint?: any; // Replace with ReleasePlan type if available, using any to avoid import cycles for now or just Ticket interactions
  kanbanScope?: 'active' | 'backlog';
  onSprintAssignment?: (ticketId: string, action: 'add' | 'remove') => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ ticket, projects, members, onUpdate, activeSprint, kanbanScope, onSprintAssignment }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const shadowStyle = isDragging
    ? { boxShadow: 'var(--premium-shadow-lg)' }
    : { boxShadow: 'var(--premium-shadow)' };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: 'grab',
    marginBottom: 12,
    backgroundColor: 'var(--bg-pure-white)',
    borderRadius: 12,
    ...shadowStyle,
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
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSave(activeValue);
            }
            if (e.key === 'Escape') cleanup();
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
        style={{
          cursor: 'text',
          marginBottom: 10,
          minHeight: 40
        }}
      >
        <Text style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#262626',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {ticket.title}
        </Text>
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
            options={PRIORITY_OPTIONS}
          />
        </div>
      );
    }
    return (
      <div onPointerDown={stopPropagation} onMouseDown={stopPropagation} onClick={() => startEditing('priority', ticket.priority)}>
        <Tag
          bordered={false}
          color={getPriorityColor(ticket.priority)}
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 4,
            padding: '0 6px',
            cursor: 'pointer'
          }}
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
              if (e.key === 'Enter') {
                const val = parseFloat(activeValue);
                handleSave(isNaN(val) ? 0 : val);
              }
              if (e.key === 'Escape') cleanup();
            }}
          />
        </div>
      );
    }
    return (
      <div onPointerDown={stopPropagation} onMouseDown={stopPropagation} onClick={() => startEditing('storyPoint', ticket.storyPoint)}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 4,
          padding: '0 6px',
          height: 20,
          fontSize: 10,
          fontWeight: 600,
          color: '#595959',
          cursor: 'pointer'
        }}>
          {ticket.storyPoint !== undefined && ticket.storyPoint !== null ? `${ticket.storyPoint} SP` : '- SP'}
        </div>
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
          <Avatar
            size="small"
            style={{ backgroundColor: '#1677ff', fontSize: 12 }}
            src={ticket.assignee.avatarUrl}
          >
            {!ticket.assignee.avatarUrl && ticket.assignee.name?.[0]?.toUpperCase()}
          </Avatar>
        ) : (
          <Avatar size="small" style={{ backgroundColor: '#f0f0f0', fontSize: 12, border: '1px dashed #d9d9d9' }} >+</Avatar>
        )}
      </div>
    );
  };

  const getMenuItems = (): MenuProps['items'] => {
    const items: MenuProps['items'] = [];
    if (kanbanScope === 'backlog' && activeSprint && onSprintAssignment) {
      items.push({
        key: 'addToSprint',
        label: 'Add to Active Sprint',
        icon: <RocketOutlined />,
        onClick: () => onSprintAssignment(ticket.id, 'add')
      });
    }
    if (kanbanScope === 'active' && onSprintAssignment) {
      items.push({
        key: 'removeFromSprint',
        label: 'Remove from Sprint',
        icon: <CloseCircleOutlined />,
        danger: true,
        onClick: () => onSprintAssignment(ticket.id, 'remove')
      });
    }
    return items;
  };

  const menuItems = getMenuItems();

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(editingField ? {} : listeners)}>
      <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
        <Card
          size="small"
          hoverable
          bodyStyle={{ padding: '12px' }}
          style={{
            borderRadius: 12,
            cursor: editingField ? 'default' : 'grab',
            border: '1px solid #f0f0f0',
            transition: 'all 0.2s ease',
          }}
          className="kanban-card-premium"
        >
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            {/* Header: ID and Type */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text type="secondary" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2px' }}>{ticket.ticketNumber}</Text>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
                      options={TYPE_OPTIONS}
                    />
                  </div>
                ) : (
                  <div onPointerDown={stopPropagation} onMouseDown={stopPropagation} onClick={() => startEditing('type', ticket.type)}>
                    <Tag
                      bordered={false}
                      color={getTypeColor(ticket.type)}
                      style={{
                        margin: 0,
                        fontSize: 9,
                        fontWeight: 700,
                        lineHeight: '16px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      {ticket.type}
                    </Tag>
                  </div>
                )}

                {/* Extra Actions Trigger */}
                {menuItems && menuItems.length > 0 && (
                  <div onPointerDown={stopPropagation} onClick={(e) => e.stopPropagation()}>
                    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                      <Button
                        type="text"
                        size="small"
                        icon={<MoreOutlined style={{ color: 'var(--text-slate-400)', fontSize: 16 }} />}
                        style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      />
                    </Dropdown>
                  </div>
                )}
              </div>
            </div>

            {/* Title Edit */}
            {renderTitle()}

            <Divider style={{ margin: '8px 0', opacity: 0.6 }} />

            {/* Footer: Priority, SP, Assignee */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size={6}>
                {renderPriority()}
                {renderStoryPoints()}
              </Space>

              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '2px',
                borderRadius: '50%',
                border: '1px solid #f0f0f0'
              }}>
                {renderAssignee()}
              </div>
            </div>
          </Space>
        </Card>
      </Dropdown>
    </div>
  );
};
