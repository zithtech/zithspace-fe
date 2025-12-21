import React, { useState, useEffect } from "react";
import { Input, Button, Select, message, Space, Card, Tag, notification } from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { useCreateTicket } from "@/hooks/useTickets";
import { TicketFormData } from "@/services/ticketService";
import { PRIORITY_OPTIONS } from "@/utils/ticketUtils";

interface InlineCreateTicketProps {
  filters: {
    project: string[];
    assignee: string[];
    status: string[];
    priority: string[];
  };
  projects: Array<{ value: string; label: string; code: string }>;
  members: Array<{ value: string; label: string; position: string }>;
  onTicketCreated?: () => void;
}

export const InlineCreateTicket: React.FC<InlineCreateTicketProps> = ({
  filters,
  projects,
  members,
  onTicketCreated,
}) => {
  const [api, contextHolder] = notification.useNotification();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  
  const createTicketMutation = useCreateTicket();

  // Smartly inherit project from filters
  useEffect(() => {
    if (filters.project.length === 1) {
      setSelectedProject(filters.project[0]);
    } else {
      setSelectedProject(undefined);
    }
  }, [filters.project]);

  const handleCreate = () => {
    console.log("handleCreate CALLED", { title, selectedProject, filters });
    
    if (!title.trim()) {
      api.error({ message: "Validation Error", description: "Please enter a ticket title" });
      return;
    }

    if (!selectedProject) {
      if (projects.length > 0) {
          api.error({ message: "Validation Error", description: "Please select a project" });
          return;
      }
      api.error({ message: "Validation Error", description: "No projects available to create ticket" });
      return;
    }

    const newTicketData: TicketFormData = {
      title,
      project: selectedProject,
      status: filters.status.length === 1 ? filters.status[0] : "not_started",
      priority: filters.priority.length === 1 ? filters.priority[0] : "P2",
      assignee: filters.assignee.length === 1 ? filters.assignee[0] : undefined,
      type: "Task", // Normalized to Title Case as seen in KanbanCard default
      description: "",
    };
    
    // 1. Optimistic UI: Reset form IMMEDIATELY
    setTitle(""); 
    setIsCreating(false);
    
    // 2. Fire mutation
    createTicketMutation.mutate(newTicketData, {
        onError: (error: any) => {
            console.error("Failed to create ticket:", error);
            api.error({ 
                message: "Creation Failed", 
                description: error?.message || "Failed to create ticket." 
            });
            // Ideally restore the title here if it failed so user doesn't lose text
            setTitle(newTicketData.title); 
        },
        onSuccess: () => {
             api.success({ message: "Ticket created", duration: 2 });
             if (onTicketCreated) onTicketCreated();
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
    return (
      <>
        {contextHolder}
        <Button 
          type="dashed" 
          block 
          style={{ marginBottom: 16, textAlign: "left" }} 
          icon={<PlusOutlined />}
          onClick={() => setIsCreating(true)}
        >
          Create Ticket
        </Button>
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 16, 
          border: "2px dashed #1677ff",
          background: "#f0f5ff"
        }}
        bodyStyle={{ padding: "8px 16px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!filters.project.length && (
            <Select
              placeholder="Select Project"
              style={{ width: 150 }}
              value={selectedProject}
              onChange={setSelectedProject}
              options={projects.map(p => ({ label: p?.label, value: p?.value }))}
              size="middle"
            />
          )}
          
          {filters.project.length === 1 && (
               <Tag color="blue">{projects.find(p => p.value === filters.project[0])?.code || "Current Project"}</Tag>
          )}

          <Input 
            placeholder="What needs to be done? (Press Enter to create)" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
             style={{ flex: 1 }}
          />

          <div style={{ display: "flex", gap: 4 }}>
             <Select
               value={filters.priority.length === 1 ? filters.priority[0] : "P2"}
               disabled // Just visual indication for now, straightforward
               size="small"
               style={{ width: 60 }}
               variant="borderless"
               suffixIcon={null}
               options={PRIORITY_OPTIONS}
             />
             <Button type="primary" onClick={handleCreate} loading={false}>
               Create
             </Button>
             <Button onClick={() => setIsCreating(false)}>
               Cancel
             </Button>
          </div>
        </div>
      </Card>
    </>
  );
};
