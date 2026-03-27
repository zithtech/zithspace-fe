"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Typography, Space, Popconfirm, App, Tabs, Card } from "antd";
import { DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons";
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import dayjs from "dayjs";
import Link from "next/link";
import { PlayCircleOutlined as RunningIcon } from "@ant-design/icons";

const { Text } = Typography;

export function MyTimeTracker({ selectedDate, refreshKey, onTotalChange }: { selectedDate?: dayjs.Dayjs, refreshKey?: number, onTotalChange?: (total: number) => void }) {
  const { notification } = App.useApp();
  const [entries, setEntries] = useState<TimeTrackingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { stopAllTimers, pauseAllTimers, resumeAllTimers, activeEntry, refreshTrigger } = useTimeTrackerStore();

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
      notification.error({ message: "Error fetching time entries", description: error.message });
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
      let totalSeconds = 0;

      entries.forEach(entry => {
        // Add recorded duration
        totalSeconds += (entry.duration || 0);

        // If running, add current live session time
        if (entry.status === 'RUNNING' && entry.logs) {
          const lastLog = [...entry.logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          if (lastLog && (lastLog.action === 'STARTED' || lastLog.action === 'RESUMED')) {
            const now = new Date().getTime();
            const start = new Date(lastLog.createdAt).getTime();
            totalSeconds += Math.floor((now - start) / 1000);
          }
        }
      });

      onTotalChange?.(totalSeconds);
    };

    calculateTotal();
  }, [entries, onTotalChange]);

  const handleDelete = async (id: string) => {
    try {
      await TimeTrackingService.deleteEntry(id);
      notification.success({ message: "Entry deleted successfully" });
      fetchEntries();
    } catch (error: any) {
      notification.error({ message: "Error deleting entry", description: error.message });
    }
  };

  const handleStopAll = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await stopAllTimers();
      notification.success({ message: "All timers stopped successfully" });
      fetchEntries();
    } catch (error: any) {
      notification.error({ message: "Error stopping timers", description: error.message });
    }
  };

  const handlePauseAll = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await pauseAllTimers();
      notification.success({ message: "All timers paused" });
      fetchEntries();
    } catch (error: any) {
      notification.error({ message: "Error pausing timers", description: error.message });
    }
  };

  const handleResumeAll = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await resumeAllTimers();
      notification.success({ message: "All timers resumed" });
      fetchEntries();
    } catch (error: any) {
      notification.error({ message: "Error resuming timers", description: error.message });
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
              <Link href={`/public/tickets/${record.ticketId}`} style={{ fontWeight: 500 }}>
                {record.ticket.title}
              </Link>
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
          return (
            <Popconfirm
              title="Stop All Active Timers"
              description="Are you sure you want to stop all running timers?"
              onConfirm={(e) => handleStopAll(e as any)}
              onCancel={(e) => e?.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="pulse-indicator" />
                <Tag
                  color="processing"
                  icon={<RunningIcon />}
                  style={{
                    cursor: "pointer",
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
            </Popconfirm>
          );
        }
        if (record.status === "PAUSED") {
          return (
            <Tag
              color="warning"
              icon={<PauseCircleOutlined />}
              style={{ cursor: "pointer" }}
              onClick={(e) => handleResumeAll(e)}
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
          {record.status === "RUNNING" && (
            <Button
              type="text"
              icon={<PauseCircleOutlined />}
              onClick={(e) => handlePauseAll(e)}
              title="Pause All Timers"
            />
          )}
          {record.status === "PAUSED" && (
            <Button
              type="text"
              icon={<PlayCircleOutlined style={{ color: '#1677ff' }} />}
              onClick={(e) => handleResumeAll(e)}
              title="Resume All Timers"
            />
          )}
          <Popconfirm title="Delete this entry?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} disabled={record.status === 'RUNNING'} />
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <Card style={{
      height: '100%',
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #f1f5f9",
      overflow: "hidden"
    }}
      styles={{ body: { padding: 0 } }}
    >
      <Table
        columns={columns}
        dataSource={entries}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        rowClassName={(record) => record.status === "RUNNING" ? "running-row" : ""}
        expandable={{
          expandedRowRender: (record) => {
            // ... (rest of the expandable code remains exactly same as user's version)
            if (!record.logs || record.logs.length === 0) {
              return <Text type="secondary" style={{ padding: '8px 16px', display: 'block' }}>No activity logs recorded.</Text>;
            }
            const sortedLogs = [...record.logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            const activityChunks = [];
            let currentChunk: any = null;

            for (const log of sortedLogs) {
              if (log.action === 'STARTED' || log.action === 'RESUMED') {
                currentChunk = {
                  id: log.id,
                  action: log.action === 'STARTED' ? 'Initial Session' : 'Resumed Session',
                  startTime: log.createdAt,
                  endTime: null,
                  duration: null
                };
              } else if ((log.action === 'PAUSED' || log.action === 'STOPPED') && currentChunk) {
                currentChunk.endTime = log.createdAt;
                const start = new Date(currentChunk.startTime).getTime();
                const end = new Date(currentChunk.endTime).getTime();
                currentChunk.duration = Math.floor((end - start) / 1000);

                activityChunks.push(currentChunk);
                currentChunk = null;
              }
            }
            if (currentChunk) {
              activityChunks.push(currentChunk);
            }

            activityChunks.reverse();

            const logColumns = [
              {
                title: "Session",
                dataIndex: "action",
                key: "action",
                render: (text: string) => {
                  let color = text === 'Initial Session' ? 'blue' : 'cyan';
                  return <Tag color={color} style={{ borderRadius: 4 }}>{text}</Tag>;
                }
              },
              {
                title: "Start Time",
                dataIndex: "startTime",
                key: "startTime",
                render: (text: string) => <Text type="secondary" style={{ fontSize: 13 }}>{dayjs(text).format("MMM D, YYYY h:mm:ss A")}</Text>
              },
              {
                title: "End Time",
                dataIndex: "endTime",
                key: "endTime",
                render: (text: string) => text ? <Text type="secondary" style={{ fontSize: 13 }}>{dayjs(text).format("MMM D, YYYY h:mm:ss A")}</Text> : <Tag color="processing" icon={<PlayCircleOutlined />} style={{ borderRadius: 4 }}>Running</Tag>
              },
              {
                title: "Duration",
                dataIndex: "duration",
                key: "duration",
                render: (val: number | null) => val !== null ? <Text strong>{formatDuration(val)}</Text> : <Text type="secondary">-</Text>
              }
            ];
            return (
              <div style={{ padding: '24px 32px', background: '#ffffff' }}>
                <Text strong style={{ marginBottom: 16, display: 'block', color: '#64748b', fontSize: 11, letterSpacing: '0.05em' }}>DETAILED ACTIVITY HISTORY</Text>
                <Table
                  columns={logColumns}
                  dataSource={activityChunks}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  style={{ background: 'transparent' }}
                />
              </div>
            );
          }
        }}
      />
      <style jsx global>{`
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 12px 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          font-size: 14px !important;
          color: #1e293b !important;
        }
        .ant-table-row:hover > td {
          background-color: #f8fafc !important;
        }
        .running-row {
          background-color: #f0f7ff !important;
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
