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
      const allIntervals: { start: number; end: number }[] = [];

      entries.forEach(entry => {
        // Collect intervals from logs
        if (entry.logs && entry.logs.length > 0) {
          const sortedLogs = [...entry.logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          let currentStart: number | null = null;

          sortedLogs.forEach(log => {
            if (log.action === 'STARTED' || log.action === 'RESUMED') {
              currentStart = new Date(log.createdAt).getTime();
            } else if ((log.action === 'PAUSED' || log.action === 'STOPPED') && currentStart !== null) {
              allIntervals.push({ start: currentStart, end: new Date(log.createdAt).getTime() });
              currentStart = null;
            }
          });
        }

        // ALSO include the entry's own startTime/endTime range if it's completed (important for manual updates)
        if ((entry.status === 'STOPPED' || entry.status === 'MANUAL_UPDATED') && entry.startTime && entry.endTime) {
          allIntervals.push({
            start: new Date(entry.startTime).getTime(),
            end: new Date(entry.endTime).getTime()
          });
        }
      });

      if (allIntervals.length === 0) {
        onTotalChange?.(0);
        return;
      }

      // Merge overlapping intervals
      allIntervals.sort((a, b) => a.start - b.start);
      const merged: { start: number; end: number }[] = [];
      let current = allIntervals[0];

      for (let i = 1; i < allIntervals.length; i++) {
        const next = allIntervals[i];
        if (next.start <= current.end) {
          current.end = Math.max(current.end, next.end);
        } else {
          merged.push(current);
          current = next;
        }
      }
      merged.push(current);

      const totalMs = merged.reduce((acc, int) => acc + (int.end - int.start), 0);
      const totalSeconds = Math.floor(totalMs / 1000);
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
              <Tag
                color="processing"
                icon={<RunningIcon />}
                style={{ cursor: "pointer" }}
                onClick={(e) => e.stopPropagation()}
              >
                Running (Click to Stop All)
              </Tag>
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
              icon={<PlayCircleOutlined />}
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
    <Card style={{ height: '100%', background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
      <Table
        columns={columns}
        dataSource={entries}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        expandable={{
          expandedRowRender: (record) => {
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
                  return <Tag color={color}>{text}</Tag>;
                }
              },
              {
                title: "Start Time",
                dataIndex: "startTime",
                key: "startTime",
                render: (text: string) => <Text type="secondary">{dayjs(text).format("MMM D, YYYY h:mm:ss A")}</Text>
              },
              {
                title: "End Time",
                dataIndex: "endTime",
                key: "endTime",
                render: (text: string) => text ? <Text type="secondary">{dayjs(text).format("MMM D, YYYY h:mm:ss A")}</Text> : <Tag color="processing" icon={<PlayCircleOutlined />}>Running</Tag>
              },
              {
                title: "Duration",
                dataIndex: "duration",
                key: "duration",
                render: (val: number | null) => val !== null ? <Text strong>{formatDuration(val)}</Text> : <Text type="secondary">-</Text>
              }
            ];
            return (
              <div style={{ padding: '8px 24px', backgroundColor: '#fafafa' }}>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>Detailed Activity</Text>
                <Table
                  columns={logColumns}
                  dataSource={activityChunks}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </div>
            );
          }
        }}
      />
    </Card>
  );
}
