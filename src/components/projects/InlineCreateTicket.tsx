import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, Input, Dropdown, App, Avatar } from "antd";
import type { MenuProps } from "antd";
import {
  PlusOutlined,
  CloseOutlined,
  UserOutlined,
  FlagOutlined,
  AppstoreOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useCreateTicket } from "@/hooks/useTickets";
import { Ticket, TicketFormData } from "@/services/ticketService";
import { PRIORITY_OPTIONS, TYPE_OPTIONS } from "@/utils/ticketUtils";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

interface InlineCreateTicketProps {
  projectId: string;
  filters: {
    assignee: string[];
    status: string[];
    priority: string[];
  };
  projects: Array<{ value: string; label: string; code: string }>;
  members: Array<{ value: string; label: string; position: string; avatarUrl?: string | null }>;
  onTicketCreated?: (ticket: Ticket) => void;
  visible?: boolean;
  onClose?: () => void;
}

const TYPE_DOT: Record<string, string> = {
  Task: "#3b82f6",
  Bug: "#ef4444",
  Feat: "#10b981",
  Overwrite: "#f97316",
};

const PRIORITY_DOT: Record<string, string> = {
  P1: "#ef4444",
  P2: "#f59e0b",
  P3: "#10b981",
};

const avatarColorFor = (str: string): string => {
  const COLORS = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};

export const InlineCreateTicket: React.FC<InlineCreateTicketProps> = ({
  projectId,
  filters,
  projects,
  members,
  onTicketCreated,
  visible,
  onClose,
}) => {
  const { message: messageApi } = App.useApp();

  const [internalIsCreating, setInternalIsCreating] = useState(false);
  const isCreating = visible !== undefined ? visible : internalIsCreating;

  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("Task");
  const [priority, setPriority] = useState<string>(
    filters.priority.length === 1 ? filters.priority[0] : "P2"
  );
  const [assigneeId, setAssigneeId] = useState<string | undefined>(
    filters.assignee.length === 1 ? filters.assignee[0] : undefined
  );

  const inputRef = useRef<any>(null);
  const createTicketMutation = useCreateTicket();

  // Re-sync defaults from filters whenever the composer opens.
  useEffect(() => {
    if (!isCreating) return;
    setPriority(filters.priority.length === 1 ? filters.priority[0] : "P2");
    setAssigneeId(filters.assignee.length === 1 ? filters.assignee[0] : undefined);
    // Focus the input on open for instant typing
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [isCreating, filters.priority, filters.assignee]);

  const resetTransient = () => {
    setTitle("");
    setType("Task");
  };

  const handleCreate = () => {
    if (!title.trim()) {
      messageApi.error("Please enter a ticket title");
      return;
    }
    if (!projectId) {
      messageApi.error("Project context is missing");
      return;
    }

    const payload: TicketFormData = {
      title: title.trim(),
      project: projectId,
      status: filters.status.length === 1 ? filters.status[0] : "not_started",
      priority,
      assignee: assigneeId,
      type,
      description: "",
    };

    resetTransient();
    if (visible === undefined) setInternalIsCreating(false);

    createTicketMutation.mutate(payload, {
      onError: (error: any) => {
        messageApi.error(error?.message || "Failed to create ticket.");
        setTitle(payload.title);
      },
      onSuccess: (savedTicket) => {
        if (onTicketCreated) onTicketCreated(savedTicket);
        if (onClose) onClose();
        if (visible === undefined) setInternalIsCreating(false);
      },
    });
  };

  const handleClose = () => {
    resetTransient();
    if (onClose) onClose();
    if (visible === undefined) setInternalIsCreating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  const typeMenu: MenuProps = useMemo(
    () => ({
      items: TYPE_OPTIONS.map((opt) => ({
        key: opt.value,
        label: (
          <span className="ict-menu-row">
            <span className="ict-menu-dot" style={{ background: TYPE_DOT[opt.value] || "#94a3b8" }} />
            <span className="ict-menu-label">{opt.label}</span>
            {type === opt.value && <CheckOutlined className="ict-menu-check" />}
          </span>
        ),
        onClick: () => setType(opt.value),
      })),
    }),
    [type]
  );

  const priorityMenu: MenuProps = useMemo(
    () => ({
      items: PRIORITY_OPTIONS.map((opt) => ({
        key: opt.value,
        label: (
          <span className="ict-menu-row">
            <span className="ict-menu-dot" style={{ background: PRIORITY_DOT[opt.value] || "#94a3b8" }} />
            <span className="ict-menu-label">{opt.label}</span>
            {priority === opt.value && <CheckOutlined className="ict-menu-check" />}
          </span>
        ),
        onClick: () => setPriority(opt.value),
      })),
    }),
    [priority]
  );

  const searchableAssignees = useMemo(() => {
    return [
      {
        value: "__unassigned",
        label: "Unassigned",
        badge: (
          <UserOutlined style={{ fontSize: 10 }} />
        ),
      },
      ...members.map((m) => ({
        value: m.value,
        label: m.label,
        avatarUrl: m.avatarUrl,
      })),
    ];
  }, [members]);

  const assigneeLabel = useMemo(() => {
    if (!assigneeId) return "Unassigned";
    const match = members.find((m) => m.value === assigneeId);
    return match?.label || "Unassigned";
  }, [assigneeId, members]);

  const selectedMember = useMemo(() => {
    return members.find((m) => m.value === assigneeId);
  }, [assigneeId, members]);

  const typeLabel = useMemo(() => {
    const match = TYPE_OPTIONS.find((t) => t.value === type);
    return match?.label || "Task";
  }, [type]);

  // Closed (uncontrolled) — render the dashed "+" prompt button as before
  if (!isCreating) {
    if (visible !== undefined) return null;
    return (
      <Button
        type="dashed"
        block
        style={{ marginBottom: 16, textAlign: "left" }}
        icon={<PlusOutlined />}
        onClick={() => setInternalIsCreating(true)}
      >
        Create Ticket
      </Button>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ict-shell {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px 8px 8px;
          margin-top: 8px;
          margin-bottom: 16px;
          background: var(--bg-secondary, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 10px;
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.08),
            0 1px 2px rgba(15, 23, 42, 0.04);
          transition: box-shadow 160ms ease, border-color 160ms ease;
          animation: ictFadeIn 180ms ease-out;
        }
        .ict-shell:focus-within {
          border-color: var(--premium-blue, #3b82f6);
          box-shadow:
            0 0 0 4px rgba(59, 130, 246, 0.18),
            0 1px 2px rgba(15, 23, 42, 0.06);
        }
        @keyframes ictFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ict-plus {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 1px 2px rgba(59, 130, 246, 0.4);
        }
        .ict-input input,
        .ict-input .ant-input {
          font-size: 14.5px !important;
          font-weight: 500 !important;
          padding: 4px 0 !important;
          background: transparent !important;
        }
        .ict-divider {
          width: 1px;
          align-self: stretch;
          background: var(--border-color, #e2e8f0);
          opacity: 0.7;
          margin: 6px 2px;
        }
        .ict-chips {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .ict-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          padding: 0 10px;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-slate-700, #334155);
          cursor: pointer;
          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
          white-space: nowrap;
          max-width: 160px;
        }
        .ict-chip:hover {
          background: var(--bg-slate-100, #f1f5f9);
          border-color: var(--text-slate-300, #cbd5e1);
          color: var(--text-slate-900, #0f172a);
        }
        .ict-chip-icon {
          font-size: 11px;
          color: var(--text-slate-400, #94a3b8);
          display: inline-flex;
        }
        .ict-chip-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ict-chip-avatar {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--premium-blue, #3b82f6);
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          letter-spacing: 0;
          flex-shrink: 0;
        }
        .ict-chip-avatar-empty {
          background: var(--bg-slate-100, #f1f5f9);
          color: var(--text-slate-400, #94a3b8);
          border: 1px dashed var(--text-slate-300, #cbd5e1);
        }
        .ict-chip-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ict-kbd {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          height: 22px;
          padding: 0 6px;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-color, #e2e8f0);
          border-bottom-width: 2px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 800;
          color: var(--text-slate-500, #64748b);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .ict-kbd-key {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10.5px;
        }
        .ict-actions {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .ict-cancel {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text-slate-400, #94a3b8);
          cursor: pointer;
          transition: background 120ms ease, color 120ms ease;
          border: 1px solid transparent;
        }
        .ict-cancel:hover {
          background: var(--bg-slate-100, #f1f5f9);
          color: var(--text-slate-700, #334155);
        }
        @media (max-width: 880px) {
          .ict-chip-label-priority,
          .ict-chip-label-type {
            display: none;
          }
          .ict-kbd {
            display: none;
          }
        }
      ` }} />

      <div className="ict-shell" role="form" aria-label="Quick create ticket">
        <span className="ict-plus" aria-hidden>
          <PlusOutlined style={{ fontSize: 14 }} />
        </span>

        <Input
          ref={inputRef}
          className="ict-input"
          placeholder="What needs to be done? Press Enter to create…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="borderless"
          style={{ flex: 1 }}
        />

        <div className="ict-chips">
          <Dropdown menu={typeMenu} trigger={["click"]} placement="bottomRight">
            <button type="button" className="ict-chip" title="Type">
              <span
                className="ict-chip-dot"
                style={{ background: TYPE_DOT[type] || "#94a3b8" }}
              />
              <span className="ict-chip-label ict-chip-label-type">{typeLabel}</span>
            </button>
          </Dropdown>

          <Dropdown menu={priorityMenu} trigger={["click"]} placement="bottomRight">
            <button type="button" className="ict-chip" title="Priority">
              <FlagOutlined
                className="ict-chip-icon"
                style={{ color: PRIORITY_DOT[priority] || "#94a3b8" }}
              />
              <span className="ict-chip-label ict-chip-label-priority">{priority}</span>
            </button>
          </Dropdown>

          <SearchableDropdown
            options={searchableAssignees}
            value={assigneeId || "__unassigned"}
            onChange={(val) => setAssigneeId(val === "__unassigned" ? undefined : val)}
            placeholder="Search assignees..."
            allowClear={false}
            customTrigger={
              <button type="button" className="ict-chip" title="Assignee" style={{ paddingLeft: assigneeId ? 4 : 10 }}>
                {assigneeId ? (
                  <Avatar
                    size={18}
                    src={selectedMember?.avatarUrl || undefined}
                    style={{
                      backgroundColor: selectedMember?.avatarUrl ? "transparent" : avatarColorFor(selectedMember?.value || selectedMember?.label || ""),
                      fontSize: 9,
                      fontWeight: 800,
                      color: "#fff",
                      flexShrink: 0
                    }}
                  >
                    {(assigneeLabel || "?").charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <span className="ict-chip-avatar ict-chip-avatar-empty">
                    <UserOutlined style={{ fontSize: 9 }} />
                  </span>
                )}
                <span className="ict-chip-label" style={{ marginLeft: assigneeId ? 2 : 0 }}>{assigneeLabel}</span>
              </button>
            }
          />
        </div>

        <div className="ict-divider" />

        <div className="ict-actions">
          <span className="ict-kbd" aria-hidden>
            <span className="ict-kbd-key">↵</span>
            Enter
          </span>
          <Button
            type="primary"
            size="middle"
            onClick={handleCreate}
            loading={createTicketMutation.isPending}
            style={{ height: 32, fontWeight: 700, borderRadius: 6, padding: "0 14px" }}
          >
            Create
          </Button>
          <button
            type="button"
            className="ict-cancel"
            onClick={handleClose}
            aria-label="Cancel"
            title="Cancel (Esc)"
          >
            <CloseOutlined style={{ fontSize: 11 }} />
          </button>
        </div>
      </div>
    </>
  );
};
