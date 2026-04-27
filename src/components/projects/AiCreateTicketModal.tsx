"use client";

import React, { useState } from "react";
import { Modal, Input, Button, Space, Typography, Tag, notification, Avatar } from "antd";
import { ThunderboltOutlined, SendOutlined, LoadingOutlined } from "@ant-design/icons";
import { useCreateTicket } from "@/hooks/useTickets";
import { Ticket } from "@/services/ticketService";

const { Text, Title } = Typography;
const { TextArea } = Input;

interface AiCreateTicketModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onTicketCreated?: (ticket: Ticket) => void;
}

export const AiCreateTicketModal: React.FC<AiCreateTicketModalProps> = ({
  open,
  onClose,
  projectId,
  onTicketCreated,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [api, contextHolder] = notification.useNotification({
    placement: 'top',
  });
  const createTicketMutation = useCreateTicket();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      api.error({ message: "Please describe the ticket" });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI Generation
    setTimeout(() => {
      setIsGenerating(false);
      api.success({ 
        message: "Zai is thinking...", 
        description: "Drafting ticket based on your description. (In a real app, this would call the AI endpoint)",
        icon: <ThunderboltOutlined style={{ color: '#722ed1' }} />
      });
      
      // For now, we'll just create a basic ticket with the prompt as description
      createTicketMutation.mutate({
        title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
        description: prompt,
        project: projectId,
        status: "not_started",
        priority: "P2",
        type: "Task"
      }, {
        onSuccess: (savedTicket) => {
          api.success({ message: "Ticket created with AI help!" });
          if (onTicketCreated) onTicketCreated(savedTicket);
          setPrompt("");
          onClose();
        }
      });
    }, 1500);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      className="saas-modal"
      title={
        <Space size={12}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 10, 
            background: 'linear-gradient(135deg, #722ed1 0%, #391085 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <ThunderboltOutlined />
          </div>
          <div>
            <Title level={5} style={{ margin: 0 }}>Create with Zai</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>Describe what needs to be done and Zai will handle the details</Text>
          </div>
        </Space>
      }
    >
      {contextHolder}
      <div style={{ marginTop: 24 }}>
        <div style={{ 
          background: 'rgba(114, 46, 209, 0.1)', 
          padding: '16px', 
          borderRadius: 12, 
          border: '1px solid rgba(114, 46, 209, 0.2)',
          marginBottom: 20
        }}>
          <Space align="start" size={12}>
            <Avatar style={{ backgroundColor: '#722ed1' }} icon={<ThunderboltOutlined />} />
            <div>
              <Text strong style={{ color: 'var(--text-primary)' }}>How can I help you today?</Text>
              <br />
              <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                You can say things like "Create a bug report for the login page flickering on mobile" 
                or "Plan a new feature for user dashboard analytics".
              </Text>
            </div>
          </Space>
        </div>

        <TextArea
          placeholder="Type your ticket description here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          autoSize={{ minRows: 4, maxRows: 8 }}
          style={{ 
            borderRadius: 12, 
            padding: '16px', 
            fontSize: 14,
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
          disabled={isGenerating}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, gap: 12 }}>
          <Button onClick={onClose} disabled={isGenerating}>Cancel</Button>
          <Button 
            type="primary" 
            icon={isGenerating ? <LoadingOutlined /> : <SendOutlined />}
            onClick={handleGenerate}
            loading={isGenerating}
            style={{ 
              background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)', 
              border: 'none', 
              borderRadius: 8,
              height: 40,
              padding: '0 24px',
              fontWeight: 600
            }}
          >
            {isGenerating ? "Zai is thinking..." : "Generate Ticket"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
