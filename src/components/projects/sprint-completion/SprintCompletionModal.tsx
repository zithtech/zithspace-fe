"use client";

import React, { useState } from "react";
import { Modal, Tabs, Button, Spin, App } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  RocketOutlined,
  TrophyOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useSprintCompletionSummary, useCompleteSprint } from "@/hooks/useSprintCompletion";
import { SummaryTab } from "./tabs/SummaryTab";
import { PendingTicketsTab } from "./tabs/PendingTicketsTab";
import { CompletedTicketsTab } from "./tabs/CompletedTicketsTab";

interface SprintCompletionModalProps {
  sprintId: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SprintCompletionModalContent: React.FC<SprintCompletionModalProps> = ({
  sprintId,
  open,
  onClose,
  onSuccess,
}) => {
  const { modal, message } = App.useApp();
  const [activeTab, setActiveTab] = useState<string>("summary");

  const { data: summary, isLoading, refetch } = useSprintCompletionSummary(
    sprintId || "",
    !!sprintId && open
  );

  const completeSprint = useCompleteSprint();

  const handleCompleteSprint = async () => {
    if (!sprintId) return;

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
          <p>Are you sure you want to mark this sprint as complete? This action will:</p>
          <ul>
            <li>Mark the sprint status as "Completed"</li>
            <li>Lock tickets from being edited (except by admins)</li>
            <li>Generate final velocity metrics</li>
            <li>Create audit log entry</li>
          </ul>
          <p style={{ marginTop: 16, fontWeight: 500 }}>
            All {summary?.statistics.completedTickets || 0} tickets have been resolved.
          </p>
        </div>
      ),
      icon: <RocketOutlined style={{ color: "#10B981" }} />,
      okText: "Complete Sprint",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await completeSprint.mutateAsync({ sprintId, force: false });
          if (onSuccess) onSuccess();
          await new Promise((resolve) => setTimeout(resolve, 300));
          onClose();
        } catch (error: any) {
          message.error(error.message || "Failed to complete sprint");
        }
      },
    });
  };

  const pendingCount = summary?.statistics.pendingTickets ?? 0;
  const completedCount = summary?.statistics.completedTickets ?? 0;
  const headerTone = !summary
    ? ""
    : pendingCount === 0
    ? "sc-header-success"
    : "sc-header";

  return (
    <Modal
      className="sprint-completion-modal"
      open={open}
      onCancel={onClose}
      width={1100}
      centered
      closable
      title={null}
      styles={{
        header: { display: 'none' },
        body: { padding: 0 },
        footer: { padding: 0, margin: 0, border: 'none' },
      }}
      footer={
        summary ? (
          <div className="sc-footer">
            <div className="sc-footer-stats">
              <span className="sc-footer-stat" style={{ ['--sc-stat-color' as any]: 'var(--sc-info)' }}>
                <span className="sc-footer-stat-icon"><FileTextOutlined /></span>
                <span>
                  <span className="sc-footer-stat-value">{summary.statistics.totalTickets}</span>{' '}
                  <span className="sc-footer-stat-label">Total</span>
                </span>
              </span>
              <span className="sc-footer-stat" style={{ ['--sc-stat-color' as any]: 'var(--sc-success)' }}>
                <span className="sc-footer-stat-icon"><TrophyOutlined /></span>
                <span>
                  <span className="sc-footer-stat-value">{summary.statistics.completedPoints}</span>{' '}
                  <span className="sc-footer-stat-label">Resolved Points</span>
                </span>
              </span>
              <span
                className="sc-footer-stat"
                style={{ ['--sc-stat-color' as any]: pendingCount > 0 ? 'var(--sc-warning)' : 'var(--sc-success)' }}
              >
                <span className="sc-footer-stat-icon"><ClockCircleOutlined /></span>
                <span>
                  <span className="sc-footer-stat-value">{pendingCount}</span>{' '}
                  <span className="sc-footer-stat-label">Pending</span>
                </span>
              </span>
            </div>
            <div className="sc-footer-actions">
              <Button onClick={onClose} className="sc-btn-cancel">Cancel</Button>
              <Button
                type="primary"
                onClick={handleCompleteSprint}
                loading={completeSprint.isPending}
                disabled={pendingCount > 0}
                className="sc-btn-complete"
                icon={<ArrowRightOutlined />}
                iconPosition="end"
              >
                {pendingCount > 0 ? `Resolve ${pendingCount} Pending` : 'Complete Sprint'}
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      {/* Header */}
      <div className={`sc-header ${headerTone}`}>
        <div className="sc-header-row">
          <div className="sc-header-left">
            <div className="sc-header-icon">
              <RocketOutlined />
            </div>
            <div>
              <h3 className="sc-header-title">Sprint Completion</h3>
              <span className="sc-header-sub">
                <span className="sc-pulse-dot" />
                Final review &amp; cleanup
              </span>
            </div>
          </div>

          {summary && (
            <div className="sc-header-meta">
              <span className="sc-project-pill">{summary.sprint.project.code}</span>
              <span className="sc-meta-text">{summary.sprint.project.name}</span>
              <span className="sc-meta-divider" />
              <span className="sc-meta-text-muted">{summary.sprint.name}</span>
              <span
                className={`sc-status-tag ${
                  summary.sprint.status === 'active' ? 'sc-status-tag-active' : 'sc-status-tag-default'
                }`}
              >
                {summary.sprint.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {isLoading || !summary ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(85vh - 160px)',
            background: 'var(--sc-canvas)',
          }}
        >
          <Spin size="large" tip="Loading sprint data" />
        </div>
      ) : (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'summary',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FileTextOutlined />
                  Summary
                </span>
              ),
              children: <SummaryTab summary={summary} />,
            },
            {
              key: 'pending',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <ClockCircleOutlined />
                  Pending
                  <span
                    style={{
                      background: pendingCount > 0 ? 'rgba(245, 158, 11, 0.14)' : 'rgba(100, 116, 139, 0.14)',
                      color: pendingCount > 0 ? 'var(--sc-warning)' : 'var(--sc-text-muted)',
                      fontSize: 10,
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: '0 7px',
                      minWidth: 18,
                      height: 18,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pendingCount}
                  </span>
                </span>
              ),
              children: (
                <PendingTicketsTab
                  sprintId={sprintId || ''}
                  summary={summary}
                  onActionComplete={() => refetch()}
                />
              ),
            },
            {
              key: 'completed',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleOutlined />
                  Completed
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.14)',
                      color: 'var(--sc-success)',
                      fontSize: 10,
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: '0 7px',
                      minWidth: 18,
                      height: 18,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {completedCount}
                  </span>
                </span>
              ),
              children: <CompletedTicketsTab tickets={summary.tickets.completed} />,
            },
          ]}
        />
      )}
    </Modal>
  );
};

export const SprintCompletionModal: React.FC<SprintCompletionModalProps> = (props) => {
  return (
    <App>
      <SprintCompletionModalContent {...props} />
    </App>
  );
};

export default SprintCompletionModal;
