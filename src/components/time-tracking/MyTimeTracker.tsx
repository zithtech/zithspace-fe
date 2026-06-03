"use client";
import React, { useEffect, useState } from "react";
import { DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import dayjs from "dayjs";
import { PlayCircleOutlined as RunningIcon } from "@ant-design/icons";
import { calculateNetDuration } from "@/utils/timeTrackingUtils";
import { Table, Tag, Button, Typography, Space, Popconfirm, App, Tabs, Card, Row, Col } from "antd";
import { useTicketDrawer } from "@/context/TicketDrawerContext";
import { usePermission } from "@/hooks/usePermission";

const { Text } = Typography;

export function MyTimeTracker({ selectedDate, refreshKey, onTotalChange }: { selectedDate?: dayjs.Dayjs, refreshKey?: number, onTotalChange?: (total: number) => void }) {
  const { message } = App.useApp();
  const [entries, setEntries] = useState<TimeTrackingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { stopAllTimers, pauseAllTimers, resumeAllTimers, pauseTimerById, resumeTimerById, activeEntry, refreshTrigger } = useTimeTrackerStore();
  const { open: openTicketDrawer } = useTicketDrawer();
  const { canCreateTimeTracking, canDeleteTimeTracking, canManageTimeTrackingTime } = usePermission();

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedDate) {
        filters.startDate = selectedDate.startOf('day').toISOString();
        filters.endDate = selectedDate.endOf('day').toISOString();
      }
      const data = await TimeTrackingService.getEntries(filters);
      setEntries(data || []);
    } catch (error: any) {
      message.error(error.message || "Error fetching time entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [refreshTrigger, selectedDate?.toISOString(), refreshKey]);

  // Total time calculation (Completed Only)
  useEffect(() => {
    const calculateTotal = () => {
      const totalSeconds = calculateNetDuration(entries);
      onTotalChange?.(totalSeconds);
    };

    calculateTotal();
  }, [entries, onTotalChange]);

  const handleDelete = async (id: string) => {
    try {
      await TimeTrackingService.deleteEntry(id);
      message.success("Entry deleted successfully");
      fetchEntries();
    } catch (error: any) {
      message.error(error.message || "Error deleting entry");
    }
  };

  const handleStopAll = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await stopAllTimers();
      message.success("All timers stopped successfully");
      fetchEntries();
    } catch (error: any) {
      message.error(error.message || "Error stopping timers");
    }
  };

  const handlePauseAll = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await pauseAllTimers();
      message.success("All timers paused");
      fetchEntries();
    } catch (error: any) {
      message.error(error.message || "Error pausing timers");
    }
  };

  const handleResumeAll = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await resumeAllTimers();
      message.success("All timers resumed");
      fetchEntries();
    } catch (error: any) {
      message.error(error.message || "Error resuming timers");
    }
  };

  const handlePause = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await pauseTimerById(id);
      message.success("Timer paused");
      fetchEntries();
    } catch (error: any) {
      message.error(error.message || "Error pausing timer");
    }
  };

  const handleResume = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await resumeTimerById(id);
      message.success("Timer resumed");
      fetchEntries();
    } catch (error: any) {
      message.error(error.message || "Error resuming timer");
    }
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "-";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "startTime",
      key: "date",
      render: (text: string) => dayjs(text).format("ddd, MMM D, YYYY"),
    },
    {
      title: "Project",
      dataIndex: ["project", "name"],
      key: "project",
      render: (text: string, record: TimeTrackingEntry) => {
        if (text) return text;
        if (record.projectId) return `Project ${record.projectId}`;
        return <Text type="secondary">No project</Text>;
      },
    },
    {
      title: "Task",
      dataIndex: "description",
      key: "task",
      render: (text: string, record: TimeTrackingEntry) => (
        <div>
          <div>
            {record.ticket?.title ? (
              <a
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (record.ticketId) openTicketDrawer(record.ticketId);
                }}
                style={{ fontWeight: 500, cursor: "pointer" }}
              >
                {record.ticket.title}
              </a>
            ) : (
              text || (record.ticketId ? `Ticket ${record.ticketId}` : <Text type="secondary">No task</Text>)
            )}
          </div>
          {record.description && record.ticket?.title && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
          )}
        </div>
      ),
    },
    {
      title: "Time",
      dataIndex: "duration",
      key: "time",
      render: (val: number, record: TimeTrackingEntry) => {
        if (record.status === "RUNNING") {
          const tagEl = (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="pulse-indicator" />
              <Tag
                color="processing"
                icon={<RunningIcon />}
                style={{
                  cursor: canCreateTimeTracking ? "pointer" : "default",
                  borderRadius: 6,
                  fontWeight: 600,
                  padding: '2px 10px',
                  border: '1px solid #bae6fd'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Running
              </Tag>
            </div>
          );

          if (canCreateTimeTracking) {
            return (
              <Popconfirm
                title="Stop All Active Timers"
                description="Are you sure you want to stop all running timers?"
                onConfirm={(e) => handleStopAll(e as any)}
                onCancel={(e) => e?.stopPropagation()}
              >
                {tagEl}
              </Popconfirm>
            );
          }
          return tagEl;
        }
        if (record.status === "PAUSED") {
          return (
            <Tag
              color="warning"
              icon={<PauseCircleOutlined />}
              style={{ cursor: canCreateTimeTracking ? "pointer" : "default" }}
              onClick={(e) => canCreateTimeTracking ? handleResume(e, record.id) : null}
            >
              Paused ({formatDuration(val)})
            </Tag>
          );
        }
        return <span style={{ fontWeight: 600 }}>{formatDuration(val)}</span>;
      },
    },
    {
      title: "Action",
      key: "action",
      align: "right" as const,
      render: (_: any, record: TimeTrackingEntry) => (
        <Space>
          {canCreateTimeTracking && record.status === "RUNNING" && (
            <Button
              type="text"
              icon={<PauseCircleOutlined />}
              onClick={(e) => handlePause(e, record.id)}
              title="Pause Timer"
            />
          )}
          {canCreateTimeTracking && record.status === "PAUSED" && (
            <Button
              type="text"
              icon={<PlayCircleOutlined style={{ color: '#1677ff' }} />}
              onClick={(e) => handleResume(e, record.id)}
              title="Resume Timer"
            />
          )}
          {canDeleteTimeTracking && (
            <Popconfirm title="Delete this entry?" onConfirm={() => handleDelete(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} disabled={record.status === 'RUNNING'} />
            </Popconfirm>
          )}
        </Space>
      ),
    }
  ];

  const processLogsToSessions = (logs: TimeTrackingEntry['logs'], startTime: string, endTime?: string | null) => {
    const sessions: any[] = [];

    if (logs && logs.length > 0) {
      const sortedLogs = [...logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      let current: any = null;

      for (const log of sortedLogs) {
        if (log.action === 'STARTED' || log.action === 'RESUMED') {
          current = { id: log.id, start: log.createdAt, end: null, endAction: null };
        } else if ((log.action === 'PAUSED' || log.action === 'STOPPED') && current) {
          current.end = log.createdAt;
          current.endAction = log.action;
          sessions.push(current);
          current = null;
        }
      }

      if (current) {
        if (endTime && !current.end) {
          current.end = endTime;
          current.endAction = 'STOPPED';
          sessions.push(current);
        } else {
          sessions.push(current);
        }
      }
    }

    // Fallback handles legacy/manual entries.
    if (sessions.length === 0 && startTime && endTime) {
      return [{
        id: 'fallback-' + startTime,
        start: startTime,
        end: endTime,
        endAction: 'STOPPED',
        isManual: true
      }];
    }

    return sessions.reverse();
  };

  const runningCount = entries.filter(e => e.status === "RUNNING").length;
  const pausedCount = entries.filter(e => e.status === "PAUSED").length;

  return (
    <Card
      className="mtt-tracker-card"
      style={{
        height: '100%',
        background: "var(--bg-pure-white)",
        borderRadius: 16,
        border: "1px solid var(--border-slate-100)",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)"
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div className="mtt-tracker-card__head">
        <div className="mtt-tracker-card__title-wrap">
          <div className="mtt-tracker-card__icon">
            <FileTextOutlined />
          </div>
          <div>
            <div className="mtt-tracker-card__title">Time Entries</div>
            <div className="mtt-tracker-card__subtitle">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
              {runningCount > 0 && (
                <>
                  {" · "}
                  <span className="mtt-tracker-card__chip mtt-tracker-card__chip--running">
                    <span className="pulse-indicator" /> {runningCount} running
                  </span>
                </>
              )}
              {pausedCount > 0 && (
                <>
                  {" · "}
                  <span className="mtt-tracker-card__chip mtt-tracker-card__chip--paused">
                    {pausedCount} paused
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {canCreateTimeTracking && runningCount > 0 && (
          <Popconfirm
            title="Stop all running timers?"
            description="This will stop every active timer for the day."
            onConfirm={(e) => handleStopAll(e as any)}
          >
            <Button
              size="small"
              icon={<PauseCircleOutlined />}
              className="mtt-tracker-card__action"
            >
              Stop All
            </Button>
          </Popconfirm>
        )}
      </div>

      <Table
        columns={columns.filter(col => col.key !== 'action' || canCreateTimeTracking || canDeleteTimeTracking)}
        dataSource={entries}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, hideOnSinglePage: true, showTotal: (total) => `${total} ${total === 1 ? 'entry' : 'entries'}` }}
        rowClassName={(record) => record.status === "RUNNING" ? "running-row" : ""}
        locale={{
          emptyText: loading ? <></> : (
            <div className="mtt-tracker-card__empty">
              <div className="mtt-tracker-card__empty-icon">
                <ClockCircleOutlined />
              </div>
              <div className="mtt-tracker-card__empty-title">No time logged for this day</div>
              <div className="mtt-tracker-card__empty-sub">
                {canCreateTimeTracking ? (
                  <>Start a timer or click <strong>Add Time</strong> to log a manual entry.</>
                ) : (
                  "You do not have permission to log or start timers."
                )}
              </div>
            </div>
          )
        }}
        expandable={{
          expandedRowRender: (record) => {
            const sessions = processLogsToSessions(record.logs, record.startTime, record.endTime);
            const isLive = record.status === 'RUNNING';

            return (
              <div style={{ padding: '20px 32px', backgroundColor: 'var(--bg-pure-white)', borderTop: '1px solid var(--border-slate-100)' }}>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClockCircleOutlined style={{ color: '#1677ff', fontSize: 14 }} />
                  <Text strong style={{ fontSize: 12, color: 'var(--text-slate-600)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Activity Timeline</Text>
                </div>

                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  {/* Vertical Line */}
                  <div style={{
                    position: 'absolute',
                    left: 5,
                    top: 6,
                    bottom: 6,
                    width: 1.5,
                    background: 'linear-gradient(to bottom, #1677ff, var(--border-slate-100))',
                    borderRadius: 1
                  }} />

                  {sessions.map((session, idx) => {
                    const sessionIsLive = !session.end && isLive;
                    return (
                      <div key={`${session.id}-${idx}`} style={{ position: 'relative', marginBottom: 16 }}>
                        {/* Timeline Node */}
                        <div style={{
                          position: 'absolute',
                          left: -24,
                          top: 4,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: sessionIsLive ? '#10b981' : session.endAction === 'PAUSED' ? '#f59e0b' : '#1677ff',
                          border: '3px solid var(--bg-pure-white)',
                          boxShadow: '0 0 0 1px var(--border-slate-200)',
                          zIndex: 2
                        }} />

                        <div style={{
                          padding: '12px 16px',
                          background: 'var(--bg-secondary)',
                          borderRadius: 12,
                          border: '1px solid var(--border-slate-200)',
                          transition: 'all 0.2s ease'
                        }}>
                          <Row gutter={12} align="middle">
                            <Col flex="auto">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 500 }}>
                                  {dayjs(session.start).format("h:mm:ss A")} - {session.end ? dayjs(session.end).format("h:mm:ss A") : "Running"}
                                </Text>
                                <Tag color={sessionIsLive ? 'processing' : session.endAction === 'PAUSED' ? 'warning' : 'default'} style={{ borderRadius: 4, fontSize: 9, height: 16, lineHeight: '14px', padding: '0 4px', margin: 0 }}>
                                  {sessionIsLive ? 'LIVE' : session.endAction === 'PAUSED' ? 'PAUSED' : 'STOPPED'}
                                </Tag>
                              </div>

                              <div style={{ marginBottom: 0 }}>
                                {record.ticket?.title ? (
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (record.ticketId) openTicketDrawer(record.ticketId);
                                      }}
                                      style={{ display: 'flex', gap: 6, cursor: 'pointer' }}
                                    >
                                      <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>{record.ticket.title}</Text>
                                    </div>
                                    {record.ticket.estimateHours !== undefined ? (
                                      <Tag color="cyan" style={{ border: 'none', borderRadius: 4, margin: 0, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>
                                        EST: {(() => {
                                          const mins = Math.round(Number(record.ticket.estimateHours) * 60);
                                          const h = Math.floor(mins / 60);
                                          const m = mins % 60;
                                          return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
                                        })()}
                                      </Tag>
                                    ) : null}
                                  </div>
                                ) : (
                                  <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>{record.description || "No description provided"}</Text>
                                )}
                              </div>
                            </Col>

                            <Col style={{ textAlign: 'right' }}>
                              <div style={{
                                padding: '4px 12px',
                                background: sessionIsLive ? '#f0fdf4' : '#fff',
                                borderRadius: 8,
                                color: sessionIsLive ? '#16a34a' : '#475569',
                                fontWeight: 700,
                                fontSize: 13,
                                fontFamily: 'monospace',
                                border: '1px solid ' + (sessionIsLive ? '#bcf0da' : '#e2e8f0')
                              }}>
                                {(() => {
                                  const start = new Date(session.start).getTime();
                                  const end = session.end ? new Date(session.end).getTime() : new Date().getTime();
                                  const diff = Math.floor((end - start) / 1000);
                                  const h = Math.floor(diff / 3600);
                                  const m = Math.floor((diff % 3600) / 60);
                                  const s = diff % 60;
                                  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                                })()}
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </div>
                    );
                  })}

                  {sessions.length === 0 && (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '10px 0' }}>No activity recorded for this period.</div>
                  )}
                </div>
              </div>
            );
          }
        }}

      />
      <style jsx global>{`
        .ant-table-thead > tr > th {
          background: var(--bg-table-header) !important;
          color: var(--text-slate-600) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          padding: 12px 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
          background-color: var(--bg-pure-white) !important;
          font-size: 14px !important;
          color: var(--text-slate-900) !important;
        }
        .ant-table-row:hover > td {
          background-color: var(--bg-table-header) !important;
        }
        .running-row {
          background-color: var(--bg-running-row) !important;
        }
        .nested-history-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-size: 10px !important;
          padding: 8px 12px !important;
        }
        .nested-history-table .ant-table-tbody > tr > td {
          padding: 10px 12px !important;
          font-size: 13px !important;
        }
        .pulse-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #1677ff;
          box-shadow: 0 0 0 rgba(22, 119, 255, 0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(22, 119, 255, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(22, 119, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(22, 119, 255, 0); }
        }
      `}</style>
    </Card>
  );
}
