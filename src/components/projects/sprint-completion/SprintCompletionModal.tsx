"use client";

import React, { useState } from "react";
import {
  Modal,
  Tabs,
  Typography,
  Space,
  Button,
  Badge,
  Spin,
  Tag,
  App,
  Divider,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  RocketOutlined,
  WarningOutlined,
  TrophyOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useSprintCompletionSummary, useCompleteSprint } from "@/hooks/useSprintCompletion";
import { SummaryTab } from "./tabs/SummaryTab";
import { PendingTicketsTab } from "./tabs/PendingTicketsTab";
import { CompletedTicketsTab } from "./tabs/CompletedTicketsTab";
// import { AuditLogTab } from "./tabs/AuditLogTab";

const { Title, Text } = Typography;

interface SprintCompletionModalProps {
  sprintId: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Inner component that uses App.useApp() hook
const SprintCompletionModalContent: React.FC<SprintCompletionModalProps> = ({
  sprintId,
  open,
  onClose,
  onSuccess,
}) => {
  const { modal, message } = App.useApp();
  const [activeTab, setActiveTab] = useState<string>("summary");

  // Fetch sprint completion summary
  const { data: summary, isLoading, refetch } = useSprintCompletionSummary(
    sprintId || "",
    !!sprintId && open
  );

  // Complete sprint mutation
  const completeSprint = useCompleteSprint();

  // Handle sprint completion
  const handleCompleteSprint = async () => {
    if (!sprintId) return;

    // Check if there are pending tickets
    if (summary && summary.statistics.pendingTickets > 0) {
      message.warning(
        `Cannot complete sprint with ${summary.statistics.pendingTickets} pending ticket(s). Please resolve all pending tickets first.`
      );
      setActiveTab("pending");
      return;
    }

    modal.confirm({
      title: "Complete Sprint?",
      content: (
        <div>
          <p>
            Are you sure you want to mark this sprint as complete? This action
            will:
          </p>
          <ul>
            <li>Mark the sprint status as "Completed"</li>
            <li>
              Lock tickets from being edited (except by admins)
            </li>
            <li>Generate final velocity metrics</li>
            <li>Create audit log entry</li>
          </ul>
          <p style={{ marginTop: 16, fontWeight: 500 }}>
            All {summary?.statistics.completedTickets || 0} tickets have been
            resolved.
          </p>
        </div>
      ),
      icon: <RocketOutlined style={{ color: "#52c41a" }} />,
      okText: "Complete Sprint",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await completeSprint.mutateAsync({ sprintId, force: false });
          // Wait for parent to refresh before closing modal
          if (onSuccess) {
            await onSuccess();
          }
          // Small delay to ensure UI updates
          await new Promise(resolve => setTimeout(resolve, 300));
          onClose();
        } catch (error: any) {
          message.error(error.message || "Failed to complete sprint");
        }
      },
    });
  };

  // Calculate completion progress
  const completionPercentage = summary?.statistics.completionPercentage || 0;

  return (
    <Modal
      title={
        <div
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid var(--border-color)",
            background: "var(--bg-pure-white)",
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={16}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
                }}
              >
                <RocketOutlined style={{ fontSize: 18, color: "#fff" }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}>
                  Sprint Completion
                </Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Final Review & Cleanup
                  </Text>
                </div>
              </div>
            </Space>

            {summary && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Divider type="vertical" style={{ height: 32, margin: 0, borderColor: 'var(--border-color)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      padding: '0 8px',
                      height: 24,
                      borderRadius: 4,
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--premium-blue)',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {summary.sprint.project.code}
                    </div>
                    <Text style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-slate-700)' }}>
                      {summary.sprint.project.name}
                    </Text>
                  </div>
                  
                  <Divider type="vertical" style={{ height: 16, margin: 0, opacity: 0.5 }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-500)' }}>{summary.sprint.name}</Text>
                    <Tag 
                      bordered={false}
                      style={{ 
                        margin: 0, 
                        borderRadius: 4, 
                        fontSize: 10, 
                        fontWeight: 800, 
                        textTransform: 'uppercase',
                        background: summary.sprint.status === 'active' ? '#f0fdf4' : '#f1f5f9',
                        color: summary.sprint.status === 'active' ? '#10b981' : '#64748b',
                        padding: '0 8px'
                      }}
                    >
                      {summary.sprint.status}
                    </Tag>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1100}
      centered
      styles={{
        header: { padding: 0, margin: 0 },
        body: { padding: 0, height: "calc(85vh - 120px)", overflow: "hidden" },
      }}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: 'calc(100% - 48px)',
            margin: '0 24px 24px 24px',
            padding: '16px 24px',
            background: 'var(--bg-blue-50)',
            borderRadius: 16,
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileTextOutlined style={{ color: '#1890ff', fontSize: 16 }} />
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{summary?.statistics.totalTickets || 0}</span>
                <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Tickets</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrophyOutlined style={{ color: '#52c41a', fontSize: 16 }} />
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{summary?.statistics.completedPoints || 0}</span>
                <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Resolved Points</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClockCircleOutlined style={{ color: summary?.statistics.pendingTickets && summary.statistics.pendingTickets > 0 ? '#faad14' : '#52c41a', fontSize: 16 }} />
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{summary?.statistics.pendingTickets || 0}</span>
                <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Pending</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              onClick={onClose}
              style={{
                borderRadius: 10,
                height: 40,
                padding: '0 24px',
                fontWeight: 600,
                fontSize: 13,
                border: '1px solid var(--border-blue-200)',
                color: '#1890ff',
                background: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleCompleteSprint}
              loading={completeSprint.isPending}
              disabled={(summary?.statistics.pendingTickets ?? 0) > 0}
              style={{
                borderRadius: 10,
                height: 40,
                padding: '0 28px',
                fontWeight: 700,
                fontSize: 13,
                background: summary?.statistics.pendingTickets === 0 ? 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)' : undefined,
                border: 'none',
                boxShadow: summary?.statistics.pendingTickets === 0 ? '0 6px 12px rgba(24, 144, 255, 0.2)' : undefined,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Complete Sprint</span>
              <ArrowRightOutlined style={{ fontSize: 14 }} />
            </Button>
          </div>
        </div>
      }
    >
      {isLoading || !summary ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 400,
          }}
        >
          <Spin size="large" tip="Loading sprint data" />
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ height: "100%" }}
          items={[
            {
              key: "summary",
              label: (
                <Space>
                  <FileTextOutlined />
                  <span>Summary</span>
                </Space>
              ),
              children: <SummaryTab summary={summary} />,
            },
            {
              key: "pending",
              label: (
                <Space>
                  <ClockCircleOutlined />
                  <span>
                    Pending Tickets
                    <Badge
                      count={summary.statistics.pendingTickets}
                      style={{ marginLeft: 8 }}
                      showZero
                    />
                  </span>
                </Space>
              ),
              children: (
                <PendingTicketsTab
                  sprintId={sprintId || ""}
                  summary={summary}
                  onActionComplete={() => refetch()}
                />
              ),
            },
            {
              key: "completed",
              label: (
                <Space>
                  <CheckCircleOutlined />
                  <span>
                    Completed Tickets
                    <Badge
                      count={summary.statistics.completedTickets}
                      style={{ marginLeft: 8 }}
                      showZero
                      color="green"
                    />
                  </span>
                </Space>
              ),
              children: <CompletedTicketsTab tickets={summary.tickets.completed} />,
            },
          ]}
        />
      )}
    </Modal>
  );
};

// Wrapper component that provides App context
export const SprintCompletionModal: React.FC<SprintCompletionModalProps> = (props) => {
  return (
    <App>
      <SprintCompletionModalContent {...props} />
    </App>
  );
};

export default SprintCompletionModal;
