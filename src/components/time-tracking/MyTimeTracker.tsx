"use client";
import React, { useEffect, useState } from "react";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { getSyncedTime } from "@/utils/timeUtils";
import { DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, ClockCircleOutlined, FileTextOutlined, ReloadOutlined } from "@ant-design/icons";
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import dayjs from "dayjs";
import { PlayCircleOutlined as RunningIcon } from "@ant-design/icons";
import { calculateNetDuration } from "@/utils/timeTrackingUtils";
import { Table, Tag, Button, Typography, Space, App, Tabs, Card, Row, Col, Select, DatePicker, Tooltip } from "antd";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { AlertTriangle } from "lucide-react";

const { RangePicker } = DatePicker;
const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];
import { useTicketDrawer } from "@/context/TicketDrawerContext";
import { usePermission } from "@/hooks/usePermission";
import { parseDecimal } from "@/services/ticketService";
import { useAttendanceGuard } from "@/hooks/useAttendanceGuard";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

const { Text } = Typography;

export function MyTimeTracker({
  dateRange,
  setDateRange,
  refreshKey,
  onTotalChange,
}: {
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
  setDateRange: (range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;
  refreshKey?: number;
  onTotalChange?: (total: number) => void;
}) {
  const { message } = App.useApp();
  const [entries, setEntries] = useState<TimeTrackingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { stopAllTimers, pauseAllTimers, resumeAllTimers, pauseTimerById, resumeTimerById, activeEntry, refreshTrigger } = useTimeTrackerStore();
  const { open: openTicketDrawer } = useTicketDrawer();
  const { canCreateTimeTracking, canDeleteTimeTracking, canManageTimeTrackingTime } = usePermission();
  const { withAttendanceGuard, AttendanceGuardModal } = useAttendanceGuard();

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (dateRange?.[0]) {
        filters.startDate = dateRange[0].startOf('day').toISOString();
      }
      if (dateRange?.[1]) {
        filters.endDate = dateRange[1].endOf('day').toISOString();
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
  }, [refreshTrigger, dateRange?.[0]?.toISOString(), dateRange?.[1]?.toISOString(), refreshKey]);

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
      await withAttendanceGuard(async () => {
        await resumeAllTimers();
        message.success("All timers resumed");
        fetchEntries();
      });
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
      await withAttendanceGuard(async () => {
        await resumeTimerById(id);
        message.success("Timer resumed");
        fetchEntries();
      });
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
      width: 150,
      render: (text: string) => (
        <span className="whitespace-nowrap">
          {dayjs(text).format("ddd, MMM D, YYYY")}
        </span>
      ),
    },
    {
      title: "Project",
      dataIndex: ["project", "name"],
      key: "project",
      width: 150,
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
      width: 250,
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
      width: 140,
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
              <ConfirmDialog
                tone="warning"
                title="Stop All Active Timers"
                description="Are you sure you want to stop all running timers?"
                onConfirm={handleStopAll}
                confirmText="Stop All"
                cancelText="Cancel"
                placement="left"
                icon={<AlertTriangle size={16} />}
              >
                {tagEl}
              </ConfirmDialog>
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
      width: 110,
      fixed: "right" as const,
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
            <ConfirmDialog
              tone="danger"
              title="Delete this entry?"
              description="Are you sure you want to delete this time entry? This action cannot be undone."
              onConfirm={() => handleDelete(record.id)}
              confirmText="Delete"
              cancelText="Cancel"
              placement="left"
              icon={<AlertTriangle size={16} />}
            >
              <Button type="text" danger icon={<DeleteOutlined />} disabled={record.status === 'RUNNING'} />
            </ConfirmDialog>
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

  const total = entries.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  // Ensure we don't end up on an empty page if items are deleted
  useEffect(() => {
    if (tablePage > pageCount) setTablePage(pageCount);
  }, [total, tablePageSize, pageCount, tablePage]);

  const paginatedEntries = entries.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Card
        className="mtt-tracker-card mtt-team-card"
        style={{
          background: "var(--bg-pure-white)",
          borderRadius: 0,
          border: "1px solid var(--border-slate-100)",
          overflow: "visible",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
          flex: 1,
        }}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}
      >
        <div className="mtt-tracker-card__head mtt-team-card__head">
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
          
          <div className="mtt-team-filters">
            {canCreateTimeTracking && runningCount > 0 && (
              <ConfirmDialog
                tone="warning"
                title="Stop all running timers?"
                description="This will stop every active timer for the day."
                onConfirm={handleStopAll}
                confirmText="Stop All"
                cancelText="Cancel"
                placement="bottomRight"
                icon={<AlertTriangle size={16} />}
              >
                <Button
                  size="small"
                  icon={<PauseCircleOutlined />}
                  className="mtt-tracker-card__action"
                  style={{ marginRight: 4 }}
                >
                  Stop All
                </Button>
              </ConfirmDialog>
            )}

            <RangePicker
              className="mtt-team-filters__range"
              allowClear
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
            />

            <Tooltip title="Refresh data">
              <Button
                onClick={fetchEntries}
                icon={<ReloadOutlined />}
                loading={loading}
                className="mtt-tracker-card__action mtt-team-card__refresh"
                size="small"
              />
            </Tooltip>
          </div>
        </div>

        <div style={{ minWidth: 0, overflow: 'auto' }}>
          <ZukvoLoadingOverlay loading={loading} message="">
                  <Table
                              columns={columns.filter(col => col.key !== 'action' || canCreateTimeTracking || canDeleteTimeTracking)}
                              dataSource={paginatedEntries}
                              rowKey="id"
                              pagination={false}
                              rowClassName={(record) => record.status === "RUNNING" ? "running-row" : ""}
                              scroll={{ x: 800 }}
                              locale={{
                                emptyText: loading ? <div style={{ minHeight: 400 }} /> : (
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
                                    <div className="py-2 px-4 sm:px-6" style={{ backgroundColor: 'var(--bg-pure-white)', borderTop: '1px solid var(--border-slate-100)' }}>
                                      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
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
                                                borderRadius: 0,
                                                border: '1px solid var(--border-slate-200)',
                                                transition: 'all 0.2s ease'
                                              }}>
                                                <Row gutter={[12, 12]} align="middle">
                                                  <Col xs={24} sm={16} md={18}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                                      <Text type="secondary" style={{ fontSize: 11, fontWeight: 500 }}>
                                                        {dayjs(session.start).format("h:mm:ss A")} - {session.end ? dayjs(session.end).format("h:mm:ss A") : "Running"}
                                                      </Text>
                                                      <Tag color={sessionIsLive ? 'processing' : session.endAction === 'PAUSED' ? 'warning' : 'default'} style={{ borderRadius: 4, fontSize: 9, height: 16, lineHeight: '14px', padding: '0 4px', margin: 0 }}>
                                                        {sessionIsLive ? 'LIVE' : session.endAction === 'PAUSED' ? 'PAUSED' : 'STOPPED'}
                                                      </Tag>
                                                    </div>

                                                    <div style={{ marginBottom: 0 }}>
                                                      {record.ticket?.title ? (
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                          <div
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              if (record.ticketId) openTicketDrawer(record.ticketId);
                                                            }}
                                                            style={{ display: 'flex', gap: 6, cursor: 'pointer' }}
                                                          >
                                                            <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>{record.ticket.title}</Text>
                                                          </div>
                                                          {(() => {
                                                            const parsedHours = parseDecimal(record.ticket.estimateHours);
                                                            if (parsedHours === undefined || parsedHours === null || isNaN(parsedHours)) return null;
                                                            const mins = Math.round(parsedHours * 60);
                                                            const h = Math.floor(mins / 60);
                                                            const m = mins % 60;
                                                            return (
                                                              <Tag color="cyan" style={{ border: 'none', borderRadius: 4, margin: 0, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>
                                                                EST: {h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`}
                                                              </Tag>
                                                            );
                                                          })()}
                                                        </div>
                                                      ) : (
                                                        <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>{record.description || "No description provided"}</Text>
                                                      )}
                                                    </div>
                                                  </Col>

                                                  <Col xs={24} sm={8} md={6} className="text-left sm:text-right">
                                                    <div style={{
                                                      display: 'inline-block',
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
                                                        const end = session.end ? new Date(session.end).getTime() : getSyncedTime().getTime();
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
                  </ZukvoLoadingOverlay>
        </div>
      </Card>
      {total > 0 && (
        <div className="mtt-footer mtt-footer--fixed">
          <div className="mtt-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="mtt-pager">
            <button type="button" className="mtt-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`mtt-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
            ))}
            <button type="button" className="mtt-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select
              className="mtt-pagesize"
              value={tablePageSize}
              onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
              options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}
      <style jsx global>{`
        .mtt-team-card {
          overflow: visible !important;
        }
        .ant-table-thead > tr > th {
          background: var(--bg-table-header) !important;
          color: var(--text-slate-600) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          padding: 12px 16px !important;
          white-space: nowrap !important;
        }
        [data-theme='dark'] .mtt-team-card .ant-table-thead > tr > th {
          background: #0B0F1A !important;
          color: #94A3B8 !important;
          border-bottom-color: #1F2937 !important;
        }
        .ant-table-tbody > tr > td {
          padding: 8px 16px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
          background-color: var(--bg-pure-white) !important;
          font-size: 14px !important;
          color: var(--text-slate-900) !important;
        }
        [data-theme='dark'] .mtt-team-card .ant-table-tbody > tr > td {
          background-color: #0B0F1A !important;
          border-bottom-color: #1F2937 !important;
          color: #E2E8F0 !important;
        }
        .ant-table-row:hover > td {
          background-color: var(--bg-table-header) !important;
        }
        [data-theme='dark'] .mtt-team-card .ant-table-row:hover > td {
          background-color: #161B22 !important;
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

        .mtt-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 12px 20px; border-top: 1px solid var(--border-slate-200);
        }
        .mtt-footer--fixed {
          position: sticky; bottom: 0; z-index: 100;
          margin-top: auto;
          margin-left: -20px;
          margin-right: -20px;
          margin-bottom: -14px;
          padding: 12px 20px;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
        }
        .mtt-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .mtt-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .mtt-pager { display: flex; align-items: center; gap: 3px; }
        .mtt-pager-btn, .mtt-pager-num {
          display: flex; align-items: center; justify-content: center;
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          padding: 0;
        }
        .mtt-pager-btn:hover:not(:disabled), .mtt-pager-num:hover:not(.is-active) {
          border-color: #cbd5e1; color: var(--text-slate-900); background: var(--bg-slate-50);
        }
        .mtt-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .mtt-pager-num.is-active {
          background: #3B82F6; color: white; border-color: #3B82F6;
        }
        .mtt-pagesize { margin-left: 5px; }
        .mtt-pagesize.ant-select .ant-select-selector {
          height: 28px !important; border-radius: 7px !important; font-size: 12.5px !important; font-weight: 600 !important;
        }
        [data-theme='dark'] .mtt-footer,
        [data-theme='dark'] .mtt-footer--fixed {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
          box-shadow: 0 -4px 14px rgba(0,0,0,0.2);
        }
        [data-theme='dark'] .mtt-pager-btn,
        [data-theme='dark'] .mtt-pager-num {
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .mtt-pager-num.is-active {
          background: #3B82F6 !important;
          color: white !important;
          border-color: #3B82F6 !important;
        }
        [data-theme='dark'] .mtt-pagesize.ant-select .ant-select-selector {
          background: #161B22 !important;
          border-color: #1F2937 !important;
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .mtt-footer-info { color: #94A3B8; }
        [data-theme='dark'] .mtt-footer-info strong { color: #CBD5E1; }
      `}</style>
      {AttendanceGuardModal}
    </div>
  );
}
