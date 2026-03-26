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
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  RocketOutlined,
  WarningOutlined,
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
  const canComplete = summary?.statistics.pendingTickets === 0;

  return (
    <Modal
      title={
        <div
          style={{
            paddingBottom: 16,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Space>
              <RocketOutlined style={{ fontSize: 20, color: "#1890ff" }} />
              <Title level={4} style={{ margin: 0 }}>
                Sprint Completion
              </Title>
            </Space>
            {summary && (
              <Space size={16} style={{ marginTop: 8 }}>
                <Text type="secondary">
                  <strong>{summary.sprint.name}</strong>
                </Text>
                <Tag color="blue">{summary.sprint.project.code}</Tag>
                <Tag
                  color={
                    summary.sprint.status === "active" ? "processing" : "default"
                  }
                >
                  {summary.sprint.status}
                </Tag>
                <Badge
                  status={canComplete ? "success" : "warning"}
                  text={
                    summary
                      ? canComplete
                        ? "Ready to Complete"
                        : `${summary.statistics.pendingTickets} Pending`
                      : "Loading..."
                  }
                />
              </Space>
            )}
          </Space>
        </div>
      }
      open={open}
      onCancel={onClose}
      width="85%"
      style={{ top: 20 }}
      styles={{
        body: { padding: 0, height: "calc(85vh - 110px)", overflow: "hidden" },
      }}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
          }}
        >
          <div>
            {summary && (
              <Space size={24}>
                <Space size={8}>
                  <CheckCircleOutlined
                    style={{ color: "#52c41a", fontSize: 16 }}
                  />
                  <Text>
                    <strong>{summary.statistics.completedTickets}</strong> Completed
                  </Text>
                </Space>
                <Space size={8}>
                  <ClockCircleOutlined
                    style={{ color: "#faad14", fontSize: 16 }}
                  />
                  <Text>
                    <strong>{summary.statistics.pendingTickets}</strong> Pending
                  </Text>
                </Space>
                <Space size={8}>
                  <FileTextOutlined style={{ fontSize: 16 }} />
                  <Text>
                    <strong>{summary.statistics.totalTickets}</strong> Total
                  </Text>
                </Space>
                <Space size={8}>
                  <Text type="secondary">Progress:</Text>
                  <Tag color={completionPercentage === 100 ? "success" : "processing"}>
                    {completionPercentage}%
                  </Tag>
                </Space>
              </Space>
            )}
          </div>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={handleCompleteSprint}
              disabled={!canComplete}
              loading={completeSprint.isPending}
            >
              Complete Sprint
            </Button>
          </Space>
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
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spin size="large" tip="Loading sprint data">
            <div style={{ padding: 20 }} />
          </Spin>
        </div>
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
            // {
            //   key: "audit",
            //   label: (
            //     <Space>
            //       <HistoryOutlined />
            //       <span>Audit Log</span>
            //     </Space>
            //   ),
            //   children: <AuditLogTab sprintId={sprintId || ""} />,
            // },
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
