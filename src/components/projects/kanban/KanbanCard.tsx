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
import ConfirmDialog from '@/components/common/ConfirmDialog';
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
  UserAddOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
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
  /** Whether this card is in the bulk-selection set. */
  selected?: boolean;
  /** Toggle this card's selection state — wired by the column. */
  onToggleSelected?: () => void;
  /** Show the selection checkbox even when this card isn't selected
   * (i.e. some OTHER card on the board is selected). Hides the affordance
   * otherwise so the card stays minimal. */
  showSelectionAffordance?: boolean;
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
  selected = false,
  onToggleSelected,
  showSelectionAffordance = false,
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
  // Pending sprint assignment awaiting confirmation — mirrors the confirm-first
  // behaviour of the list view's Actions column and the ticket drawer.
  const [sprintConfirm, setSprintConfirm] = useState<'add' | 'remove' | null>(null);

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
    // expose CSS variables so the card stripe + footer accents pick up the
    // right hue. The left stripe now follows the TYPE color (matches the
    // image), while the priority arrow uses its own priority hue.
    ['--kb-pri-color' as any]: priorityColor,
    ['--kb-type-color' as any]: typeMeta.color,
  };

  const renderPriorityArrow = () => {
    const p = (ticket.priority || '').toUpperCase();
    if (p === 'P1') {
      return <ArrowUpOutlined className="kb-card-pri-arrow up" />;
    }
    if (p === 'P3') {
      return <ArrowDownOutlined className="kb-card-pri-arrow down" />;
    }
    if (p === 'P2') {
      return <span className="kb-card-pri-dash">—</span>;
    }
    return null;
  };

  const getMenuItems = (): MenuProps['items'] => {
    const items: MenuProps['items'] = [];
    if (kanbanScope === 'backlog' && activeSprint && onSprintAssignment && (canUpdateTicket || canManageTickets)) {
      items.push({
        key: 'addToSprint',
        label: 'Add to Active Sprint',
        icon: <RocketOutlined />,
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation();
          setSprintConfirm('add');
        },
      });
    }
    if (kanbanScope === 'active' && onSprintAssignment && (canUpdateTicket || canManageTickets)) {
      items.push({
        key: 'removeFromSprint',
        label: 'Remove from Sprint',
        icon: <CloseCircleOutlined />,
        danger: true,
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation();
          setSprintConfirm('remove');
        },
      });
    }
    return items;
  };

  const menuItems = getMenuItems();
  const className = [
    'kb-card',
    isDragging ? 'kb-card-dragging' : '',
    isOverlay ? 'kb-card-overlay' : '',
    selected ? 'kb-card-selected' : '',
    showSelectionAffordance ? 'kb-card-select-mode' : '',
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

  // Editing-only render helpers — invoked from the footer when the matching
  // editingField is active; the non-editing visual is rendered inline.
  const renderType = () => (
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

  const renderPriority = () => (
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

  const renderStoryPoints = () => {
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
    // When the board is in selection mode, plain clicks on a card toggle its
    // selection state instead of opening the detail drawer. Click the title
    // area to open the drawer in select mode.
    if (showSelectionAffordance && onToggleSelected) {
      onToggleSelected();
      return;
    }
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
          {/* Selection checkbox — visible when the board is in select mode
              or this card is already selected. Click stops propagation so
              the card's drag listeners don't activate. */}
          {(showSelectionAffordance || selected) && onToggleSelected && (
            <button
              type="button"
              className={`kb-card-select ${selected ? 'is-checked' : ''}`}
              aria-label={selected ? 'Deselect ticket' : 'Select ticket'}
              onPointerDown={stopPropagation}
              onMouseDown={stopPropagation}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelected();
              }}
            />
          )}

          {/* Sprint add/remove confirmation — anchored top-right of the card.
              Opened from the hover menu / context menu instead of firing the
              assignment straight away. */}
          {sprintConfirm && (
            <ConfirmDialog
              open
              onOpenChange={(v) => { if (!v) setSprintConfirm(null); }}
              tone={sprintConfirm === 'remove' ? 'danger' : 'primary'}
              title={sprintConfirm === 'remove' ? 'Remove from Sprint' : 'Add to Sprint'}
              description={
                sprintConfirm === 'remove'
                  ? 'Are you sure you want to remove this ticket from the active sprint?'
                  : 'Are you sure you want to add this ticket to the active sprint?'
              }
              confirmText={sprintConfirm === 'remove' ? 'Remove' : 'Add to Sprint'}
              placement="bottomRight"
              onConfirm={() => {
                onSprintAssignment?.(ticket.id, sprintConfirm);
                setSprintConfirm(null);
              }}
              onCancel={() => setSprintConfirm(null)}
            >
              <span
                style={{ position: 'absolute', top: 8, right: 8, width: 1, height: 1 }}
                onPointerDown={stopPropagation}
                onMouseDown={stopPropagation}
                onClick={stopPropagation}
              />
            </ConfirmDialog>
          )}

          {/* Hover-only action menu, top-right */}
          {menuItems && menuItems.length > 0 && (
            <div
              className="kb-card-actions"
              onPointerDown={stopPropagation}
              onMouseDown={stopPropagation}
            >
              <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </div>
          )}

          {renderTitle()}

          <div className="kb-card-foot">
            <div className="kb-card-foot-left">
              <Tooltip title={`Type: ${ticket.type || '—'}`}>
                <span
                  className="kb-card-type-icon"
                  onPointerDown={stopPropagation}
                  onMouseDown={stopPropagation}
                  onClick={(e) => {
                    if (!canUpdateTicket) return;
                    e.stopPropagation();
                    startEditing('type', ticket.type);
                  }}
                >
                  {editingField === 'type' ? renderType() : typeMeta.icon}
                </span>
              </Tooltip>
              <span className="kb-card-id">{ticket.ticketNumber}</span>
              {editingField === 'priority' ? (
                renderPriority()
              ) : (
                <Tooltip
                  title={`Priority: ${PRIORITY_LABEL[ticket.priority] || ticket.priority || '—'}`}
                >
                  <span
                    className="kb-card-pri-wrap"
                    onPointerDown={stopPropagation}
                    onMouseDown={stopPropagation}
                    onClick={(e) => {
                      if (!canUpdateTicket) return;
                      e.stopPropagation();
                      startEditing('priority', ticket.priority);
                    }}
                  >
                    {renderPriorityArrow()}
                  </span>
                </Tooltip>
              )}
              {editingField === 'storyPoint' && renderStoryPoints()}
            </div>

            {renderAssignee()}
          </div>
        </div>
      </Dropdown>
    </div>
  );
};
