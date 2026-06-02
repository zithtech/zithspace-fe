"use client";

import React, { useEffect, useState } from "react";
import { Popover, Button, Input, Select, Form, Spin, App } from "antd";
import {
  PlayCircleFilled,
  PauseCircleFilled,
  HistoryOutlined,
} from "@ant-design/icons";
import {
  Briefcase,
  ListChecks,
  FileText,
  Square,
  ArrowUpRight,
  Timer,
} from "lucide-react";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { ProjectService } from "@/services/projectService";
import TicketService from "@/services/ticketService";
import { useRouter } from "next/navigation";

interface TimeTrackerPopoverProps {
  isMenuItem?: boolean;
  showContentOnly?: boolean;
}

type TimerState = "running" | "paused" | "idle";

export const TimeTrackerPopover: React.FC<TimeTrackerPopoverProps> = ({
  isMenuItem,
  showContentOnly,
}) => {
  const { notification, message } = App.useApp();
  const {
    activeEntry,
    activeEntries,
    isLoading,
    isPopoverOpen,
    setPopoverOpen,
    fetchActiveTimer,
    startMultipleTimers,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimeTrackerStore();

  const [form] = Form.useForm();
  const router = useRouter();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveTimer();
    loadProjects();
  }, []);

  useEffect(() => {
    const runningOrPaused = activeEntries.filter(
      (e) => e.status === "RUNNING" || e.status === "PAUSED"
    );
    if (runningOrPaused.length > 0) {
      const pIds = Array.from(
        new Set(runningOrPaused.map((e) => e.projectId).filter(Boolean))
      ) as string[];
      const tIds = Array.from(
        new Set(runningOrPaused.map((e) => e.ticketId).filter(Boolean))
      ) as string[];

      form.setFieldsValue({
        projectId: pIds,
        ticketId: tIds,
        description: runningOrPaused[0].description,
        billable: runningOrPaused.some((e) => e.billable),
        billingRate: runningOrPaused[0].billingRate,
      });
      if (pIds.length > 0) {
        loadTickets(pIds);
      }
    } else if (activeEntries.length === 0) {
      form.resetFields();
    }
  }, [activeEntries.length]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeEntry) {
      const baseDuration = activeEntry.duration || 0;

      if (activeEntry.status === "RUNNING") {
        const lastLog = activeEntry.logs?.find(
          (l) => l.action === "STARTED" || l.action === "RESUMED"
        );
        const lastActiveTime = lastLog
          ? new Date(lastLog.createdAt).getTime()
          : new Date(activeEntry.startTime).getTime();

        const updateTime = () => {
          const sessionElapsed = Math.floor((new Date().getTime() - lastActiveTime) / 1000);
          const currentElapsed = baseDuration + sessionElapsed;
          if (sessionElapsed >= 6 * 60 * 60) {
            setElapsedTime(currentElapsed);
            pauseTimer();
            clearInterval(interval);
          } else {
            setElapsedTime(currentElapsed);
          }
        };

        updateTime();
        interval = setInterval(updateTime, 1000);
      } else if (activeEntry.status === "PAUSED") {
        setElapsedTime(baseDuration);
      }
    } else {
      setElapsedTime(0);
    }

    return () => clearInterval(interval);
  }, [activeEntry]);

  const loadProjects = async () => {
    try {
      const res = await ProjectService.getUserProjects();
      setProjects(res || []);
    } catch (err) { }
  };

  const loadTickets = async (projectIds: string[]) => {
    if (!projectIds || projectIds.length === 0) {
      setTickets([]);
      return;
    }
    try {
      const ticketPromises = projectIds.map(async (pid) => {
        try {
          const projectTickets = await TicketService.getMyTicketsByProject(pid);
          return (projectTickets || []).map((t) => ({ ...t, projectId: pid }));
        } catch (err) {
          console.error(`Failed to load tickets for project ${pid}:`, err);
          return [];
        }
      });

      const allTicketsResults = await Promise.all(ticketPromises);
      setTickets(allTicketsResults.flat());
    } catch (err) {
      console.error("General error in loadTickets:", err);
      setTickets([]);
    }
  };

  const handleProjectChange = (projectIds: string[]) => {
    form.setFieldsValue({ ticketId: [] });
    loadTickets(projectIds);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleStart = async (values: any) => {
    try {
      const entriesToCreate = values.ticketId.map((tId: string) => {
        const ticket = tickets.find((t) => t.id === tId);
        const pId =
          ticket?.projectId ||
          (values.projectId.length === 1 ? values.projectId[0] : undefined);

        return {
          projectId: pId,
          ticketId: tId,
          description: values.description,
          billable: values.billable,
          billingRate: values.billingRate,
        };
      });

      await startMultipleTimers(entriesToCreate);
      message.success("Timer started");
    } catch (error: any) {
      message.error(`Failed to start timer: ${error.message}`);
    }
  };

  const handleStop = async () => {
    try {
      await stopTimer();
      form.resetFields();
      message.success("Timer stopped and saved");
    } catch (error: any) {
      message.error(`Failed to stop timer: ${error.message}`);
    }
  };

  const selectedPids = Form.useWatch("projectId", form) || [];

  const state: TimerState = !activeEntry
    ? "idle"
    : activeEntry.status === "RUNNING"
      ? "running"
      : "paused";

  const stateMeta: Record<TimerState, { label: string; dot: string; ring: string; text: string }> = {
    running: {
      label: "Running",
      dot: "#10b981",
      ring: "rgba(16, 185, 129, 0.18)",
      text: "#059669",
    },
    paused: {
      label: "Paused",
      dot: "#f59e0b",
      ring: "rgba(245, 158, 11, 0.18)",
      text: "#d97706",
    },
    idle: {
      label: "Ready to track",
      dot: "#94a3b8",
      ring: "rgba(148, 163, 184, 0.18)",
      text: "#64748b",
    },
  };

  const renderContent = () => (
    <div
      className={`ttp-root ttp-state-${state}`}
      style={{ width: showContentOnly ? "100%" : 360, maxWidth: 360 }}
    >
      {isLoading && (
        <div className="ttp-loading">
          <Spin size="small" />
        </div>
      )}

      {/* Hero: status pill + timer + actions */}
      <div className="ttp-hero">
        <div className="ttp-status-pill">
          <span
            className="ttp-status-dot"
            style={{
              background: stateMeta[state].dot,
              boxShadow: state === "running" ? `0 0 0 4px ${stateMeta[state].ring}` : "none",
            }}
          />
          <span style={{ color: stateMeta[state].text }}>
            {stateMeta[state].label}
          </span>
        </div>

        <div className="ttp-timer">{formatTime(elapsedTime)}</div>

        <div className="ttp-controls">
          {state === "running" && (
            <>
              <button
                type="button"
                className="ttp-btn ttp-btn-secondary"
                onClick={async () => {
                  try {
                    await pauseTimer();
                    message.success("Timer paused");
                  } catch (e: any) { 
                    message.error(e.message || "Error pausing timer");
                  }
                }}
                disabled={isLoading}
                aria-label="Pause"
              >
                <PauseCircleFilled style={{ fontSize: 20 }} />
                <span>Pause</span>
              </button>
              <button
                type="button"
                className="ttp-btn ttp-btn-stop"
                onClick={handleStop}
                disabled={isLoading}
                aria-label="Stop"
              >
                <Square size={14} fill="currentColor" strokeWidth={0} />
                <span>Stop</span>
              </button>
            </>
          )}
          {state === "paused" && (
            <>
              <button
                type="button"
                className="ttp-btn ttp-btn-primary"
                onClick={async () => {
                  try {
                    await resumeTimer();
                    message.success("Timer resumed");
                  } catch (e: any) {
                    message.error(e.message || "Error resuming timer");
                  }
                }}
                disabled={isLoading}
                aria-label="Resume"
              >
                <PlayCircleFilled style={{ fontSize: 20 }} />
                <span>Resume</span>
              </button>
              <button
                type="button"
                className="ttp-btn ttp-btn-stop"
                onClick={handleStop}
                disabled={isLoading}
                aria-label="Stop"
              >
                <Square size={14} fill="currentColor" strokeWidth={0} />
                <span>Stop</span>
              </button>
            </>
          )}
          {state === "idle" && (
            <button
              type="button"
              className="ttp-btn ttp-btn-primary ttp-btn-wide"
              onClick={() => form.submit()}
              disabled={isLoading}
              aria-label="Start timer"
            >
              <PlayCircleFilled style={{ fontSize: 20 }} />
              <span>Start timer</span>
            </button>
          )}
        </div>
      </div>

      <div className="ttp-divider" />

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleStart}
        initialValues={{ billable: false }}
        disabled={!!activeEntry || isLoading}
        className="ttp-form"
        requiredMark={false}
      >
        <Form.Item
          name="projectId"
          label={
            <span className="ttp-label">
              <Briefcase size={13} />
              Project
            </span>
          }
          rules={[{ required: true, message: "Select a project" }]}
        >
          <Select
            mode="multiple"
            placeholder="Select project(s)"
            onChange={handleProjectChange}
            allowClear
            disabled={!!activeEntry || isLoading}
            showSearch
            maxTagCount="responsive"
            options={projects.map((p) => ({ label: p.label, value: p.value }))}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="ticketId"
          label={
            <span className="ttp-label">
              <ListChecks size={13} />
              Task
            </span>
          }
          rules={[{ required: true, message: "Select a task" }]}
        >
          <Select
            mode="multiple"
            placeholder="Select task(s)"
            allowClear
            disabled={!!activeEntry || isLoading || !selectedPids.length}
            showSearch
            maxTagCount="responsive"
            options={tickets.map((t) => ({
              label: `${t.title}${selectedPids.length > 1
                  ? ` · ${projects.find((p) => p.value === t.projectId)?.label ||
                  "Unknown"
                  }`
                  : ""
                }`,
              value: t.id,
            }))}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={
            <span className="ttp-label">
              <FileText size={13} />
              What are you working on?
            </span>
          }
        >
          <Input.TextArea
            rows={2}
            placeholder="Add a brief note (optional)"
            maxLength={240}
            showCount
          />
        </Form.Item>
      </Form>

      <div className="ttp-footer">
        <button
          type="button"
          className="ttp-link"
          onClick={() => {
            setPopoverOpen(false);
            router.push("/time-tracking");
          }}
        >
          <HistoryOutlined />
          <span>View all time entries</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      <style jsx global>{`
        .ttp-root {
          padding: 4px 2px 0;
          color: var(--text-primary);
          position: relative;
        }
        .ttp-loading {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 2;
        }
        .ttp-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 18px 8px 20px;
          border-radius: 14px;
          background:
            radial-gradient(120% 100% at 50% 0%, var(--bg-blue-50) 0%, transparent 70%),
            var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          position: relative;
          overflow: hidden;
        }
        .ttp-state-running .ttp-hero {
          background:
            radial-gradient(120% 100% at 50% 0%, rgba(16, 185, 129, 0.12) 0%, transparent 70%),
            var(--bg-pure-white);
          border-color: rgba(16, 185, 129, 0.2);
        }
        .ttp-state-paused .ttp-hero {
          background:
            radial-gradient(120% 100% at 50% 0%, rgba(245, 158, 11, 0.12) 0%, transparent 70%),
            var(--bg-pure-white);
          border-color: rgba(245, 158, 11, 0.2);
        }
        .ttp-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .ttp-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          display: inline-block;
        }
        .ttp-state-running .ttp-status-dot {
          animation: ttp-pulse 1.6s ease-in-out infinite;
        }
        @keyframes ttp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.92); }
        }
        .ttp-timer {
          font-family: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
          font-size: 40px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-slate-900);
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .ttp-state-running .ttp-timer { color: #059669; }
        .ttp-state-paused .ttp-timer { color: #d97706; }
        .ttp-controls {
          display: flex;
          gap: 8px;
          width: 100%;
          padding: 0 12px;
          margin-top: 4px;
        }
        .ttp-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding: 0 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease, border-color 120ms ease;
          font-family: inherit;
        }
        .ttp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .ttp-btn:not(:disabled):active { transform: translateY(1px); }
        .ttp-btn-wide { flex: 1; }
        .ttp-btn-primary {
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          box-shadow: 0 1px 0 rgba(255,255,255,0.2) inset, 0 4px 14px rgba(37, 99, 235, 0.28);
        }
        .ttp-btn-primary:not(:disabled):hover {
          box-shadow: 0 1px 0 rgba(255,255,255,0.2) inset, 0 6px 18px rgba(37, 99, 235, 0.36);
        }
        .ttp-btn-secondary {
          background: var(--bg-pure-white);
          color: var(--text-slate-700);
          border-color: var(--border-slate-200);
        }
        .ttp-btn-secondary:not(:disabled):hover {
          border-color: var(--border-slate-300, #cbd5e1);
          background: var(--bg-slate-50);
        }
        .ttp-btn-stop {
          background: #fff;
          color: #dc2626;
          border-color: #fecaca;
        }
        .ttp-btn-stop:not(:disabled):hover {
          background: #fef2f2;
          border-color: #fca5a5;
        }
        .ttp-divider {
          height: 1px;
          background: var(--border-slate-100);
          margin: 16px -2px 12px;
        }
        .ttp-form .ant-form-item { margin-bottom: 12px; }
        .ttp-form .ant-form-item-label { padding-bottom: 4px; }
        .ttp-form .ant-form-item-label > label {
          height: auto;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-slate-600);
        }
        .ttp-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ttp-form .ant-select-selector,
        .ttp-form .ant-input,
        .ttp-form textarea.ant-input {
          border-radius: 10px !important;
          background: var(--bg-pure-white) !important;
        }
        .ttp-form .ant-select-selector:hover,
        .ttp-form .ant-input:hover {
          border-color: #93c5fd !important;
        }
        .ttp-footer {
          display: flex;
          justify-content: center;
          padding: 8px 0 4px;
          margin-top: 4px;
          border-top: 1px solid var(--border-slate-100);
        }
        .ttp-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: var(--text-slate-600);
          font-size: 12px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: background 120ms ease, color 120ms ease;
        }
        .ttp-link:hover {
          background: var(--bg-slate-50);
          color: var(--text-blue-700);
        }

        /* Trigger button polish - styles moved to globals.css */

        /* Popover container override */
        .ttp-popover .ant-popover-inner {
          border-radius: 16px;
          padding: 14px;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.06) inset,
            0 12px 32px -8px rgba(15, 23, 42, 0.18),
            0 8px 16px -8px rgba(15, 23, 42, 0.12);
          border: 1px solid var(--border-slate-100);
        }
        .ttp-popover .ant-popover-title {
          padding: 4px 6px 12px;
          margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-900);
        }
      `}</style>
    </div>
  );

  if (showContentOnly) {
    return renderContent();
  }

  const triggerClass = `ttp-trigger ${
    state === "running"
      ? "ttp-trigger-running"
      : state === "paused"
      ? "ttp-trigger-paused"
      : ""
  }`;

  if (isMenuItem) {
    return (
      <div className={triggerClass} style={{ pointerEvents: 'none', border: '1px solid var(--border-slate-300)' }}>
        <span className="ttp-trigger-dot" />
        <span>{formatTime(elapsedTime)}</span>
        <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.8, textTransform: 'uppercase' }}>
          {activeEntry
            ? activeEntry.status === "RUNNING"
              ? "Running"
              : "Paused"
            : "Idle"}
        </span>
      </div>
    );
  }


  return (
    <Popover
      content={renderContent()}
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Timer size={14} />
            {state === "running"
              ? "Running timer"
              : state === "paused"
                ? "Paused timer"
                : "Start a timer"}
          </span>
          <Button
            type="text"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => router.push("/time-tracking")}
          />
        </div>
      }
      trigger="click"
      open={isPopoverOpen}
      onOpenChange={setPopoverOpen}
      placement="bottomRight"
      overlayClassName="ttp-popover"
      arrow={false}
    >
      <button type="button" className={triggerClass}>
        <span className="ttp-trigger-dot" />
        <span>{formatTime(elapsedTime)}</span>
      </button>
    </Popover>
  );
};
