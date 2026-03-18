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

export function MyTimeTracker() {
  const { notification } = App.useApp();
  const [entries, setEntries] = useState<TimeTrackingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { stopTimer, activeEntry } = useTimeTrackerStore();

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const data = await TimeTrackingService.getEntries();
      setEntries(data || []);
    } catch (error: any) {
      notification.error({ message: "Error fetching time entries", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [activeEntry?.id, activeEntry?.status]);

  const handleDelete = async (id: string) => {
    try {
      await TimeTrackingService.deleteEntry(id);
      notification.success({ message: "Entry deleted successfully" });
      fetchEntries();
    } catch (error: any) {
      notification.error({ message: "Error deleting entry", description: error.message });
    }
  };

  const handleStopTimer = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await stopTimer();
      notification.success({ message: "Timer stopped successfully" });
      fetchEntries();
    } catch (error: any) {
      notification.error({ message: "Error stopping timer", description: error.message });
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
      render: (text: string) => text || <Text type="secondary">No project</Text>,
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
              text || <Text type="secondary">No task</Text>
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
              title="Stop Active Timer"
              description="Are you sure you want to stop the running timer?"
              onConfirm={handleStopTimer}
              onCancel={(e) => e?.stopPropagation()}
            >
              <Tag 
                color="processing" 
                icon={<RunningIcon />} 
                style={{ cursor: "pointer" }}
                onClick={(e) => e.stopPropagation()}
              >
                Running (Click to Stop)
              </Tag>
            </Popconfirm>
          );
        }
        if (record.status === "PAUSED") return <Tag color="warning" icon={<PauseCircleOutlined />}>Paused ({formatDuration(val)})</Tag>;
        return <span style={{ fontWeight: 600 }}>{formatDuration(val)}</span>;
      },
    },
    {
      title: "Action",
      key: "action",
      align: "right" as const,
      render: (_: any, record: TimeTrackingEntry) => (
        <Space>
          <Popconfirm title="Delete this entry?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} disabled={record.status === 'RUNNING'} />
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <Card style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
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
