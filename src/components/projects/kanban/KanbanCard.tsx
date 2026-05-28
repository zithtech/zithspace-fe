import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Avatar,
  Select,
  Input,
  Dropdown,
  MenuProps,
  Button,
  Tooltip,
} from 'antd';
import { Ticket } from '@/services/ticketService';
import { PRIORITY_OPTIONS, TYPE_OPTIONS } from '@/utils/ticketUtils';
import {
  MoreOutlined,
  RocketOutlined,
  CloseCircleOutlined,
  BugOutlined,
  CheckSquareOutlined,
  ThunderboltOutlined,
  RetweetOutlined,
  MessageOutlined,
  PaperClipOutlined,
  FlagFilled,
  UserAddOutlined,
} from '@ant-design/icons';

interface KanbanCardProps {
  ticket: Ticket;
  projects?: Array<{ value: string; label: string; code: string }>;
  members?: Array<{ value: string; label: string; position: string; avatarUrl?: string | null }>;
  onUpdate: (ticketId: string, updates: Partial<Ticket> & { assigneeId?: string }) => void;
  activeSprint?: any;
  kanbanScope?: 'active' | 'backlog';
  onSprintAssignment?: (ticketId: string, action: 'add' | 'remove') => void;
  onClick?: () => void;
  isOverlay?: boolean;
  permissions?: {
    canUpdateTicket: boolean;
    canDeleteTicket: boolean;
    canAssignTicket: boolean;
    canManageTickets: boolean;
  };
}

const PRIORITY_COLOR_VAR: Record<string, string> = {
  P1: 'var(--kb-pri-p1)',
  P2: 'var(--kb-pri-p2)',
  P3: 'var(--kb-pri-p3)',
};

const PRIORITY_LABEL: Record<string, string> = {
  P1: 'High',
  P2: 'Medium',
  P3: 'Low',
};

const getTypeMeta = (type: string) => {
  if (!type) return { color: 'var(--kb-type-task)', icon: <CheckSquareOutlined /> };
  const t = type.toLowerCase();
  if (t.includes('bug')) return { color: 'var(--kb-type-bug)', icon: <BugOutlined /> };
  if (t.includes('feat')) return { color: 'var(--kb-type-feat)', icon: <ThunderboltOutlined /> };
  if (t.includes('overwrite')) return { color: 'var(--kb-type-overwrite)', icon: <RetweetOutlined /> };
  return { color: 'var(--kb-type-task)', icon: <CheckSquareOutlined /> };
};

export const KanbanCard: React.FC<KanbanCardProps> = ({
  ticket,
  members,
  onUpdate,
  activeSprint,
  kanbanScope,
  onSprintAssignment,
  onClick,
  isOverlay = false,
  permissions,
}) => {
  const { canUpdateTicket, canDeleteTicket, canAssignTicket, canManageTickets } = permissions || {
    canUpdateTicket: true,
    canDeleteTicket: true,
    canAssignTicket: true,
    canManageTickets: true,
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, disabled: isOverlay || !canUpdateTicket });

  const [editingField, setEditingField] = useState<
    'title' | 'priority' | 'type' | 'storyPoint' | 'assignee' | null
  >(null);
  const [activeValue, setActiveValue] = useState<any>(null);

  const stopPropagation = (e: React.PointerEvent | React.MouseEvent | React.UIEvent) => {
    e.stopPropagation();
  };

  const startEditing = (
    field: 'title' | 'priority' | 'type' | 'storyPoint' | 'assignee',
    initialValue: any
  ) => {
    setActiveValue(initialValue);
    setEditingField(field);
  };

  const cleanup = () => {
    setEditingField(null);
    setActiveValue(null);
  };

  const handleSave = (val: any) => {
    if (editingField) {
      const finalVal = (val === undefined || val === null) ? null : val;
      onUpdate(ticket.id, { [editingField]: finalVal });
    }
    cleanup();
  };

  const priorityColor = PRIORITY_COLOR_VAR[ticket.priority] || 'var(--kb-pri-default)';
  const typeMeta = getTypeMeta(ticket.type);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // expose CSS variables so card stripes/chips pick up the right hue
    ['--kb-pri-color' as any]: priorityColor,
    ['--kb-type-color' as any]: typeMeta.color,
  };

  const commentCount = ticket.comments?.length || 0;
  const attachmentCount = ticket.attachments?.length || 0;
  const subtaskCount = ticket.subTasks?.length || 0;

  const getMenuItems = (): MenuProps['items'] => {
    const items: MenuProps['items'] = [];
    if (kanbanScope === 'backlog' && activeSprint && onSprintAssignment && (canUpdateTicket || canManageTickets)) {
      items.push({
        key: 'addToSprint',
        label: 'Add to Active Sprint',
        icon: <RocketOutlined />,
        onClick: () => onSprintAssignment(ticket.id, 'add'),
      });
    }
    if (kanbanScope === 'active' && onSprintAssignment && (canUpdateTicket || canManageTickets)) {
      items.push({
        key: 'removeFromSprint',
        label: 'Remove from Sprint',
        icon: <CloseCircleOutlined />,
        danger: true,
        onClick: () => onSprintAssignment(ticket.id, 'remove'),
      });
    }
    return items;
  };

  const menuItems = getMenuItems();
  const className = [
    'kb-card',
    isDragging ? 'kb-card-dragging' : '',
    isOverlay ? 'kb-card-overlay' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const renderTitle = () => {
    if (editingField === 'title') {
      return (
        <div className="kb-card-title-edit" onPointerDown={stopPropagation} onMouseDown={stopPropagation}>
          <Input.TextArea
            value={activeValue}
            autoSize={{ minRows: 2, maxRows: 4 }}
            onChange={(e) => setActiveValue(e.target.value)}
            onFocus={(e) => {
              const val = e.currentTarget.value;
              e.currentTarget.setSelectionRange(val.length, val.length);
            }}
            onBlur={() => handleSave(activeValue)}
            onKeyDown={(e) => {
              if (e.key === ' ') e.stopPropagation();
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave(activeValue);
              }
              if (e.key === 'Escape') cleanup();
            }}
            autoFocus
          />
        </div>
      );
    }
    return (
      <h4
        className="kb-card-title"
        onPointerDown={stopPropagation}
        onMouseDown={stopPropagation}
        onClick={(e) => {
          if (!canUpdateTicket) return;
          e.stopPropagation();
          startEditing('title', ticket.title);
        }}
        title={ticket.title}
      >
        {ticket.title}
      </h4>
    );
  };

  const renderType = () => {
    if (editingField === 'type') {
      return (
        <div onPointerDown={stopPropagation}>
          <Select
            autoFocus
            open
            size="small"
            style={{ width: 100 }}
            value={activeValue}
            onChange={(val) => handleSave(val)}
            onBlur={cleanup}
            options={TYPE_OPTIONS}
          />
        </div>
      );
    }
    return (
      <Tooltip title={`Type: ${ticket.type}`}>
        <span
          className="kb-chip kb-chip-type"
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
          onClick={(e) => {
            if (!canUpdateTicket) return;
            e.stopPropagation();
            startEditing('type', ticket.type);
          }}
        >
          {typeMeta.icon}
          {ticket.type}
        </span>
      </Tooltip>
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
            style={{ width: 110 }}
            value={activeValue}
            onChange={(val) => handleSave(val)}
            onBlur={cleanup}
            options={PRIORITY_OPTIONS}
          />
        </div>
      );
    }
    return (
      <Tooltip title={`Priority: ${PRIORITY_LABEL[ticket.priority] || ticket.priority || '—'}`}>
        <span
          className="kb-chip kb-chip-pri"
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
          onClick={(e) => {
            if (!canUpdateTicket) return;
            e.stopPropagation();
            startEditing('priority', ticket.priority);
          }}
        >
          <FlagFilled style={{ fontSize: 9 }} />
          {ticket.priority || '—'}
        </span>
      </Tooltip>
    );
  };

  const renderStoryPoints = () => {
    if (editingField === 'storyPoint') {
      return (
        <div onPointerDown={stopPropagation}>
          <Input
            type="number"
            size="small"
            style={{ width: 70 }}
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
    const hasSp = ticket.storyPoint !== undefined && ticket.storyPoint !== null;
    return (
      <Tooltip title="Story points">
        <span
          className="kb-chip kb-chip-sp"
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
          onClick={(e) => {
            if (!canUpdateTicket) return;
            e.stopPropagation();
            startEditing('storyPoint', ticket.storyPoint);
          }}
        >
          {hasSp ? `${ticket.storyPoint} SP` : '— SP'}
        </span>
      </Tooltip>
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
            style={{ width: 160 }}
            placeholder="Assign"
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            value={activeValue}
            onChange={(val) => handleSave(val)}
            onBlur={cleanup}
            options={members?.map((m) => ({ label: m.label, value: m.value }))}
          />
        </div>
      );
    }
    if (ticket.assignee) {
      return (
        <Tooltip title={`Assigned to ${ticket.assignee.name}`}>
          <span
            className="kb-assignee"
            onPointerDown={stopPropagation}
            onMouseDown={stopPropagation}
            onClick={(e) => {
              if (!canAssignTicket && !canUpdateTicket) return;
              e.stopPropagation();
              startEditing('assignee', ticket.assignee?.id);
            }}
          >
            <Avatar
              size={24}
              style={{ backgroundColor: '#1677ff', fontSize: 11, fontWeight: 600 }}
              src={ticket.assignee.avatarUrl || undefined}
            >
              {!ticket.assignee.avatarUrl && ticket.assignee.name?.[0]?.toUpperCase()}
            </Avatar>
          </span>
        </Tooltip>
      );
    }
    return (
      <Tooltip title="Assign someone">
        <span
          className="kb-assignee-empty"
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
          onClick={(e) => {
            if (!canAssignTicket && !canUpdateTicket) return;
            e.stopPropagation();
            startEditing('assignee', undefined);
          }}
        >
          <UserAddOutlined />
        </span>
      </Tooltip>
    );
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isOverlay || editingField) return;
    if (e.defaultPrevented) return;
    onClick?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      onClick={handleCardClick}
      {...attributes}
      {...(editingField || isOverlay ? {} : listeners)}
    >
      <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']} disabled={!menuItems?.length}>
        <div>
          <div className="kb-card-head">
            <span className="kb-card-id">{ticket.ticketNumber}</span>
            <div className="kb-card-actions" onPointerDown={stopPropagation} onMouseDown={stopPropagation}>
              {menuItems && menuItems.length > 0 && (
                <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                  <Button type="text" size="small" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
                </Dropdown>
              )}
            </div>
          </div>

          {renderTitle()}

          <div className="kb-card-meta">
            {renderType()}
            {renderPriority()}
            {renderStoryPoints()}
          </div>

          <div className="kb-card-foot">
            <div className="kb-card-foot-left">
              {commentCount > 0 && (
                <Tooltip title={`${commentCount} comment${commentCount > 1 ? 's' : ''}`}>
                  <span className="kb-foot-stat">
                    <MessageOutlined />
                    {commentCount}
                  </span>
                </Tooltip>
              )}
              {attachmentCount > 0 && (
                <Tooltip title={`${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''}`}>
                  <span className="kb-foot-stat">
                    <PaperClipOutlined />
                    {attachmentCount}
                  </span>
                </Tooltip>
              )}
              {subtaskCount > 0 && (
                <Tooltip title={`${subtaskCount} subtask${subtaskCount > 1 ? 's' : ''}`}>
                  <span className="kb-foot-stat">
                    <CheckSquareOutlined />
                    {subtaskCount}
                  </span>
                </Tooltip>
              )}
            </div>

            {renderAssignee()}
          </div>
        </div>
      </Dropdown>
    </div>
  );
};
