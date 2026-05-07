import React, { useState, useEffect } from "react";
import { Input, Button, Select, message, Space, Card, Tag, notification, Divider, App } from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { useCreateTicket } from "@/hooks/useTickets";
import { Ticket, TicketFormData } from "@/services/ticketService";
import { PRIORITY_OPTIONS } from "@/utils/ticketUtils";

interface InlineCreateTicketProps {
  projectId: string;
  filters: {
    assignee: string[];
    status: string[];
    priority: string[];
  };
  projects: Array<{ value: string; label: string; code: string }>;
  members: Array<{ value: string; label: string; position: string }>;
  onTicketCreated?: (ticket: Ticket) => void;
  visible?: boolean;
  onClose?: () => void;
}


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
  // const [api, contextHolder] = notification.useNotification({
  //   placement: 'top',
  // });
  // Internal state for uncontrolled mode
  const [internalIsCreating, setInternalIsCreating] = useState(false);

  // Use prop if provided, otherwise internal state
  const isCreating = visible !== undefined ? visible : internalIsCreating;

  const [title, setTitle] = useState("");

  const createTicketMutation = useCreateTicket();

  const handleCreate = () => {
    console.log("handleCreate CALLED", { title, projectId, filters });

    if (!title.trim()) {
      messageApi.error("Please enter a ticket title");
      return;
    }

    if (!projectId) {
      messageApi.error("Project context is missing");
      return;
    }

    const newTicketData: TicketFormData = {
      title,
      project: projectId,
      status: filters.status.length === 1 ? filters.status[0] : "not_started",
      priority: filters.priority.length === 1 ? filters.priority[0] : "P2",
      assignee: filters.assignee.length === 1 ? filters.assignee[0] : undefined,
      type: "Task", // Normalized to Title Case as seen in KanbanCard default
      description: "",
    };

    // 1. Optimistic UI: Reset form IMMEDIATELY
    setTitle("");
    if (visible === undefined) setInternalIsCreating(false);

    // 2. Fire mutation
    createTicketMutation.mutate(newTicketData, {
      onError: (error: any) => {
        console.error("Failed to create ticket:", error);
        messageApi.error(error?.message || "Failed to create ticket.");
        // Ideally restore the title here if it failed so user doesn't lose text
        setTitle(newTicketData.title);
      },
      onSuccess: (savedTicket) => {
        // Removed local success message, let handleTicketCreated in TicketList handle it
        if (onTicketCreated) onTicketCreated(savedTicket);
        if (onClose) onClose();
        if (visible === undefined) setInternalIsCreating(false);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  };

  if (!isCreating) {
    // If controlled (visible is provided) and false, render nothing
    if (visible !== undefined) return null;

    return (
      <>
        <Button
          type="dashed"
          block
          style={{ marginBottom: 16, textAlign: "left" }}
          icon={<PlusOutlined />}
          onClick={() => setInternalIsCreating(true)}
        >
          Create Ticket
        </Button>
      </>
    );
  }

  return (
    <>
      <Card
        size="small"
        className="saas-card"
        style={{
          marginBottom: 24,
          border: "1px solid var(--premium-blue)",
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--premium-shadow-lg)'
        }}
        styles={{ body: { padding: "12px 16px" } }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--premium-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0
          }}>
            <PlusOutlined style={{ fontSize: 16 }} />
          </div>

          <Input
            placeholder="What needs to be done? (Press Enter to create)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            variant="borderless"
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: 500,
              padding: '4px 0'
            }}
          />

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Tag color="blue" bordered={false} style={{ margin: 0, opacity: 0.7, fontSize: 10, fontWeight: 700 }}>
              ENTER ↵
            </Tag>
            <Divider type="vertical" style={{ height: 20 }} />
            <Button
              type="primary"
              onClick={handleCreate}
              loading={createTicketMutation.isPending}
              style={{ borderRadius: 6, fontWeight: 600 }}
            >
              Create
            </Button>
            <Button
              type="text"
              onClick={() => {
                if (onClose) onClose();
                if (visible === undefined) setInternalIsCreating(false);
              }}
              style={{ fontWeight: 600, color: 'var(--text-slate-500)' }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};
