"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, Tag, Typography, Space, Card, Row, Col, Select, Input, Avatar, Tooltip, Button, DatePicker, Modal, TimePicker, notification } from "antd";
import {
  TeamOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  SearchOutlined,
  EditOutlined,
  HistoryOutlined,
  UserOutlined,
  ReloadOutlined
} from "@ant-design/icons";
const { RangePicker } = DatePicker;
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import { useMembers, useUserProjects } from "@/hooks/useGlobalData";
import dayjs from "dayjs";
import Link from "next/link";
import { calculateNetDuration } from "@/utils/timeTrackingUtils";

const { Title, Text } = Typography;

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

interface TimeEntryEditModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entry: any; // Simplified type for now
}

const TimeEntryEditModal: React.FC<TimeEntryEditModalProps> = ({ open, onClose, onSuccess, entry }) => {
  const [loading, setLoading] = useState(false);
  const [endTime, setEndTime] = useState<dayjs.Dayjs | null>(null);

  useEffect(() => {
    if (open && entry) {
      setEndTime(entry.end ? dayjs(entry.end) : dayjs());
    }
  }, [open, entry]);

  const handleUpdate = async () => {
    if (!entry || !endTime) return;

    setLoading(true);
    try {
      // Step 1: Update the entry. If it's a multi-session entry, we only update the specific log segment.
      await TimeTrackingService.updateEntry(entry.entryId, {
        endTime: endTime.toISOString(),
        status: 'STOPPED',
        logId: entry.endLogId // Pass the specific log segment ID to avoid truncating later work
      } as any);
      notification.success({ message: "Entry updated successfully" });
      onSuccess();
      onClose();
    } catch (error: any) {
      notification.error({ message: "Error updating entry", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const originalDuration = entry ? Math.floor((new Date(entry.end || new Date()).getTime() - new Date(entry.start).getTime()) / 1000) : 0;
  const newDuration = (entry && endTime) ? Math.floor((endTime.toDate().getTime() - new Date(entry.start).getTime()) / 1000) : 0;
  const diff = originalDuration - newDuration;

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined style={{ color: '#6366f1' }} />
          <span>Adjust Session Time</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleUpdate}
      confirmLoading={loading}
      destroyOnClose
      width={480}
      centered
      okText="Save Changes"
      okButtonProps={{ style: { borderRadius: 8, background: '#6366f1' } }}
      cancelButtonProps={{ style: { borderRadius: 8 } }}
    >
      <div style={{ padding: '8px 0' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border-slate-200)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>PROJECT</Text>
              <Text strong style={{ fontSize: 13 }}>{entry?.project?.name || 'No Project'}</Text>
            </div>
            {entry?.ticket?.ticketNumber && (
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>TICKET</Text>
                <Tag color="blue" style={{ margin: 0, borderRadius: 4 }}>{entry.ticket.ticketNumber}</Tag>
              </div>
            )}
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>TASK / DESCRIPTION</Text>
            <Text strong style={{ fontSize: 13 }}>{entry?.ticket?.title || entry?.description || 'No Task Title'}</Text>
          </div>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Original Start</Text>
              <div style={{ background: 'var(--bg-table-header)', padding: '8px 12px', borderRadius: 8, color: 'var(--text-slate-600)', fontWeight: 600, border: '1px solid var(--border-slate-100)' }}>
                {dayjs(entry?.start).format("HH:mm:ss")}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>New End Time</Text>
              <TimePicker
                value={endTime}
                onChange={(time) => {
                  if (!time) {
                    setEndTime(null);
                    return;
                  }
                  if (entry && entry.start) {
                    // Change the date safely using ISO string format
                    const isoDate = dayjs(entry.start).format('YYYY-MM-DD');
                    const isoTime = time.format('HH:mm:ss');

                    // Combine into a standard local ISO format
                    let correctedTime = dayjs(`${isoDate}T${isoTime}`);

                    // If the selected time is earlier than the start time, 
                    // assume the session continued past midnight into the next day.
                    if (correctedTime.isBefore(dayjs(entry.start))) {
                      correctedTime = correctedTime.add(1, 'day');
                    }

                    setEndTime(correctedTime);
                  } else {
                    setEndTime(time);
                  }
                }}
                format="HH:mm:ss"
                style={{ width: '100%', height: 40, borderRadius: 8 }}
                allowClear={false}
                placeholder="Select end time"
                needConfirm={false}
              />
            </div>
          </div>

          <div style={{ background: 'var(--bg-leave)', padding: 12, borderRadius: 8, border: '1px solid var(--border-slate-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: '#991b1b' }}>New Duration</Text>
              <Text strong style={{ fontSize: 13, color: '#991b1b' }}>{formatTime(newDuration)}</Text>
            </div>
            {diff > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#b91c1c', opacity: 0.8 }}>Truncating</Text>
                <Text style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>- {formatTime(diff)}</Text>
              </div>
            )}
          </div>

          <div style={{ padding: '0 4px' }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <ClockCircleOutlined style={{ marginTop: 3 }} />
              Updating the end time will remove all activity logs that fall after the new timestamp.
            </Text>
          </div>
        </Space>
      </div>
    </Modal>
  );
};

const processLogsToSessions = (logs: TimeTrackingEntry['logs'], startTime: string, endTime?: string | null) => {
  const sessions: any[] = [];

  if (logs && logs.length > 0) {
    const sortedLogs = [...logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let current: any = null;

    for (const log of sortedLogs) {
      if (log.action === 'STARTED' || log.action === 'RESUMED') {
        current = { id: log.id, start: log.createdAt, end: null, endAction: null, startLogId: log.id };
      } else if ((log.action === 'PAUSED' || log.action === 'STOPPED') && current) {
        current.end = log.createdAt;
        current.endAction = log.action;
        current.endLogId = log.id;
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

  // Fallback: If no sessions were found from logs but we have start/end times,
  // treat it as a single manual session. This handles legacy/manual entries.
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

interface TeamTimeTrackerProps {
  refreshKey?: number;
}

export const TeamTimeTracker: React.FC<TeamTimeTrackerProps> = ({ refreshKey }) => {
  const [entries, setEntries] = useState<TimeTrackingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    userId: undefined as string | undefined,
    projectId: undefined as string | undefined,
    search: "",
    dateRange: [dayjs().startOf('day'), dayjs().endOf('day')] as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: members = [] } = useMembers();
  const { data: projects = [] } = useUserProjects();

  const fetchTeamEntries = async () => {
    try {
      setLoading(true);
      const startDate = filters.dateRange?.[0]?.startOf('day').toISOString();
      const endDate = filters.dateRange?.[1]?.endOf('day').toISOString();

      const data = await TimeTrackingService.getEntries({
        allUsers: true,
        userId: filters.userId,
        projectId: filters.projectId,
        startDate,
        endDate,
      });
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching team entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamEntries();
  }, [filters.userId, filters.projectId, filters.dateRange, refreshKey]);

  // Update current time for live calculations
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredEntries = useMemo(() => {
    let result = entries;

    if (filters.userId) {
      result = result.filter(e => e.user?.id === filters.userId);
    }

    if (filters.projectId) {
      result = result.filter(e => e.projectId === filters.projectId);
    }

    return result;
  }, [entries, filters.userId, filters.projectId]);

  // Group entries by user and date
  const groupedData = useMemo(() => {
    const groupMap: Record<string, { id: string; user: any; date: string; entries: TimeTrackingEntry[]; totalSeconds: number; status: string }> = {};

    filteredEntries.forEach(entry => {
      if (!entry.user || !entry.startTime) return;
      const uId = entry.user.id;
      const dateKey = dayjs(entry.startTime).format("YYYY-MM-DD");
      const compositeKey = `${uId}_${dateKey}`;

      if (!groupMap[compositeKey]) {
        groupMap[compositeKey] = {
          id: compositeKey,
          user: entry.user,
          date: dateKey,
          entries: [],
          totalSeconds: 0,
          status: "Idle"
        };
      }
      groupMap[compositeKey].entries.push(entry);
      if (entry.status === "RUNNING") {
        groupMap[compositeKey].status = "Active";
      }
    });

    // Calculate total duration for each group using net duration utility
    Object.values(groupMap).forEach(groupData => {
      groupData.totalSeconds = calculateNetDuration(groupData.entries, 5000, currentTime.getTime());

      // Calculate project breakdown for tooltips
      const projBreakdown: Record<string, { seconds: number; name: string; entries: TimeTrackingEntry[] }> = {};
      groupData.entries.forEach(e => {
        const pId = (e.project && typeof e.project === 'object') ? e.project.id : (e.project || 'unknown');
        const pName = (e.project && typeof e.project === 'object') ? e.project.name : (e.project || 'No Project');

        if (!projBreakdown[pId]) projBreakdown[pId] = { seconds: 0, name: pName, entries: [] };
        projBreakdown[pId].entries.push(e);
      });

      // Recalculate each project's net duration
      Object.keys(projBreakdown).forEach(pId => {
        projBreakdown[pId].seconds = calculateNetDuration(projBreakdown[pId].entries, 5000, currentTime.getTime());
      });

      (groupData as any).projectBreakdown = Object.values(projBreakdown).sort((a, b) => b.seconds - a.seconds);

      // Calculate unique ticket count
      const uniqueTickets = new Set(groupData.entries.map(e => e.ticketId).filter(Boolean)).size;
      (groupData as any).ticketCount = uniqueTickets;
    });

    return Object.values(groupMap).sort((a, b) => {
      // Primary sort: Date (most recent first)
      const dateDiff = dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
      if (dateDiff !== 0) return dateDiff;
      // Secondary sort: Total seconds
      return b.totalSeconds - a.totalSeconds;
    });
  }, [filteredEntries, currentTime]);

  const [lastIndividualAverage, setLastIndividualAverage] = useState<number>(0);

  const stats = useMemo(() => {
    const activeUsers = new Set(groupedData.filter(u => u.status === "Active").map(u => u.user.id)).size;
    const totalSeconds = groupedData.reduce((acc, u) => acc + u.totalSeconds, 0);
    const uniqueProjects = new Set(filteredEntries.map(e => e.projectId).filter(Boolean)).size;

    let averageSeconds = 0;
    if (filters.userId) {
      const activeDaysCount = groupedData.length;
      if (activeDaysCount > 0) {
        averageSeconds = totalSeconds / activeDaysCount;
      }
    }

    return { activeUsers, totalSeconds, uniqueProjects, averageSeconds };
  }, [groupedData, filteredEntries, filters.userId]);

  // Track the last non-zero individual average
  useEffect(() => {
    if (filters.userId && stats.averageSeconds > 0) {
      setLastIndividualAverage(stats.averageSeconds);
    }
  }, [stats.averageSeconds, filters.userId]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const userColumns = [
    {
      title: "Day and Date",
      key: "date",
      width: 140,
      render: (_: any, record: any) => (
        <div style={{ fontWeight: 500, color: 'var(--text-slate-700)' }}>
          {dayjs(record.date).format("ddd, MMM D")}
        </div>
      ),
    },
    {
      title: "Team Member",
      key: "user",
      render: (_: any, record: any) => (
        <Space>
          <Avatar src={record.user?.avatarUrl} style={{ backgroundColor: 'var(--bg-holiday)', color: 'var(--text-holiday)' }}>
            {record.user.name?.[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>{record.user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{record.user.workEmail}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Tickets",
      dataIndex: "ticketCount",
      key: "ticketCount",
      width: 100,
      render: (count: number) => (
        <Space size={4}>
          <Text strong style={{ color: 'var(--text-slate-700)' }}>{count}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{count === 1 ? 'ticket' : 'tickets'}</Text>
        </Space>
      ),
    },
    {
      title: "Daily Capacity",
      key: "progress",
      width: 200,
      render: (_: any, record: any) => {
        const targetSeconds = 6 * 3600; // 6 hours
        const percent = Math.min(100, (record.totalSeconds / targetSeconds) * 100);
        let color = "#cbd5e1"; // Slate (0-50%)
        if (percent > 90) color = "#10b981"; // Emerald (90-100%)
        else if (percent > 50) color = "#1677ff"; // Blue (50-90%)

        return (
          <Tooltip
            title={
              <div style={{ padding: '4px' }}>
                <div style={{ marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 4, fontWeight: 600 }}>Project Breakdown</div>
                {(record.projectBreakdown || []).map((p: any) => (
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11, marginBottom: 2 }}>
                    <span>{p.name}</span>
                    <span style={{ opacity: 0.8 }}>{formatTime(p.seconds)}</span>
                  </div>
                ))}
              </div>
            }
            overlayInnerStyle={{ borderRadius: 12, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(4px)' }}
          >
            <div style={{ width: '100%', cursor: 'help' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                <Text type="secondary">{percent >= 100 ? 'Goal Reached' : `${Math.round(percent)}% of 6h`}</Text>
                <Text strong style={{ color: percent >= 100 ? '#10b981' : 'var(--text-slate-700)' }}>{formatTime(record.totalSeconds)}</Text>
              </div>
              <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border-divider)' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${percent}%`,
                    background: color,
                    borderRadius: 3,
                    transition: 'width 0.5s ease-out',
                    boxShadow: percent >= 95 ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                />
              </div>
            </div>
          </Tooltip>
        );
      }
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag
          color={status === "Active" ? "processing" : status === "Paused" ? "warning" : "default"}
          className={status === "Active" ? "pulse-tag" : ""}
          style={{ borderRadius: 6, padding: '2px 8px' }}
          icon={status === "Active" ? <ClockCircleOutlined spin /> : status === "Paused" ? <ClockCircleOutlined /> : null}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  const expandedRowRender = (userRecord: any) => {
    // Flatten all sessions for this user across all their entries
    const allUserSessions: any[] = [];
    userRecord.entries.forEach((entry: TimeTrackingEntry) => {
      const sessions = processLogsToSessions(entry.logs, entry.startTime, entry.endTime);

      sessions.forEach(session => {
        allUserSessions.push({
          ...session,
          entryId: entry.id,
          project: entry.project,
          ticket: entry.ticket,
          description: entry.description,
          ticketId: entry.ticketId,
          entryStatus: entry.status,
          isLive: !session.end && entry.status === 'RUNNING'
        });
      });
    });

    // Sort user sessions by start time descending, then use entryId as a tie-breaker for stable sorting
    allUserSessions.sort((a, b) => {
      const diff = new Date(b.start).getTime() - new Date(a.start).getTime();
      if (diff !== 0) return diff;
      return String(b.entryId).localeCompare(String(a.entryId));
    });

    const sessionColumns = [
      {
        title: "Project",
        dataIndex: ["project", "name"],
        key: "project",
        width: 150,
        render: (name: string, record: any) => {
          if (name) return name;
          if (record.project && typeof record.project === 'string') return `Project ${record.project}`;
          return <Text type="secondary" italic>No Project</Text>;
        }
      },
      {
        title: "Task",
        key: "task",
        render: (_: any, record: any) => {
          const ticket = record.ticket;
          const ticketId = record.ticketId;
          const description = record.description;

          if (ticket && typeof ticket === 'object') {
            return (
              <Link href={`/tickets/${ticketId}`}>
                <Text style={{ color: '#1890ff', fontWeight: 500 }}>{ticket.title}</Text>
              </Link>
            );
          }

          return <Text>{description || (ticketId ? `Ticket ${ticketId}` : "No description")}</Text>;
        }
      },
      {
        title: "Start Time",
        dataIndex: "start",
        key: "start",
        width: 160,
        render: (t: string) => {
          if (!t) return <Text type="secondary">-</Text>;
          const d = dayjs(t);
          return <Text style={{ fontSize: 13 }}>{d.isValid() ? d.format("MMM D, h:mm:ss A") : "Invalid Date"}</Text>;
        }
      },
      {
        title: "End Time",
        dataIndex: "end",
        key: "end",
        width: 160,
        render: (t: string) => {
          if (!t) return <Tag color="processing">Running</Tag>;
          const d = dayjs(t);
          return <Text style={{ fontSize: 13 }}>{d.isValid() ? d.format("MMM D, h:mm:ss A") : "Invalid Date"}</Text>;
        }
      },
      {
        title: "Time",
        key: "duration",
        width: 110,
        render: (_: any, s: any) => {
          const start = new Date(s.start).getTime();
          const end = s.end ? new Date(s.end).getTime() : currentTime.getTime();
          const diff = Math.floor((end - start) / 1000);
          const h = Math.floor(diff / 3600);
          const m = Math.floor((diff % 3600) / 60);
          const sec = diff % 60;
          return (
            <Text strong style={{ fontFamily: 'monospace', color: !s.end ? '#1890ff' : '#374151' }}>
              {`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`}
            </Text>
          );
        }
      },
      {
        title: "Status",
        key: "status",
        width: 100,
        render: (_: any, record: any) => (
          <Tag color={record.isLive ? 'processing' : record.entryStatus === 'MANUAL_UPDATED' ? 'purple' : record.endAction === 'PAUSED' ? 'warning' : 'default'}>
            {record.isLive ? 'RUNNING' : record.entryStatus === 'MANUAL_UPDATED' ? 'MANUAL UPDATED' : record.endAction === 'PAUSED' ? 'PAUSED' : 'STOPPED'}
          </Tag>
        )
      },
      {
        title: "Action",
        key: "action",
        width: 80,
        align: "center" as const,
        render: (_: any, record: any) => (
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#1890ff' }} />}
            onClick={() => {
              setEditingEntry(record);
              setIsEditModalOpen(true);
            }}
          />
        )
      }
    ];

    return (
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-pure-white)', borderRadius: 12, border: '1px solid var(--border-slate-100)' }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#6366f1', fontSize: 14 }} />
          <Text strong style={{ fontSize: 14, color: 'var(--text-slate-900)' }}>Activity Timeline</Text>
        </div>

        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {/* Vertical Line */}
          <div style={{
            position: 'absolute',
            left: 5,
            top: 6,
            bottom: 6,
            width: 1.5,
            background: 'linear-gradient(to bottom, #6366f1, var(--border-slate-100))',
            borderRadius: 1
          }} />

          {allUserSessions.map((session, idx) => (
            <div key={`${session.id}-${idx}`} style={{ position: 'relative', marginBottom: 12 }}>
              {/* Timeline Node */}
              <div style={{
                position: 'absolute',
                left: -24,
                top: 4,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: session.isLive ? '#10b981' : session.endAction === 'PAUSED' ? '#f59e0b' : '#6366f1',
                border: '3px solid var(--bg-pure-white)',
                boxShadow: '0 0 0 1px var(--border-slate-200)',
                zIndex: 2
              }} />

              <div className="glass-card" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-slate-200)', borderRadius: 12 }}>
                <Row gutter={12} align="middle">
                  <Col flex="auto">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Tag color="blue" style={{ borderRadius: 4, border: 'none', background: '#e0e7ff', color: '#4338ca', fontWeight: 600, fontSize: 10 }}>
                        {session.project?.name || "No Project"}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(session.start).format("h:mm:ss A")} - {session.end ? dayjs(session.end).format("h:mm:ss A") : "Running"}
                      </Text>
                    </div>

                    <div style={{ marginBottom: 0 }}>
                      {session.ticket?.title ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Link href={`/tickets/${session.ticketId}`}>
                            <div style={{ display: 'flex', gap: 6, cursor: 'pointer' }}>
                              {session.ticket.ticketNumber && (
                                <Text strong style={{ fontSize: 13, color: 'var(--premium-blue)', whiteSpace: 'nowrap' }}>
                                  [{session.ticket.ticketNumber}]
                                </Text>
                              )}
                              <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>{session.ticket.title}</Text>
                            </div>
                          </Link>
                          {session.ticket.estimateHours !== undefined ? (
                            <Tag color="cyan" style={{ border: 'none', borderRadius: 4, margin: 0, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>
                              EST: {(() => {
                                const mins = Math.round(Number(session.ticket.estimateHours) * 60);
                                const h = Math.floor(mins / 60);
                                const m = mins % 60;
                                return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
                              })()}
                            </Tag>
                          ) : null}
                        </div>
                      ) : (
                        <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>{session.description || "No description provided"}</Text>
                      )}
                    </div>
                  </Col>

                  <Col style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        padding: '2px 10px',
                        background: session.isLive ? 'var(--bg-holiday)' : session.endAction === 'PAUSED' ? 'var(--bg-paused-row)' : 'var(--bg-table-header)',
                        borderRadius: 12,
                        color: session.isLive ? '#16a34a' : session.endAction === 'PAUSED' ? '#b45309' : 'var(--text-slate-700)',
                        fontWeight: 700,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        border: '1px solid ' + (session.isLive ? 'var(--bg-holiday)' : session.endAction === 'PAUSED' ? 'var(--bg-paused-row)' : 'var(--border-slate-100)')
                      }}>
                        {(() => {
                          const start = new Date(session.start).getTime();
                          const end = session.end ? new Date(session.end).getTime() : currentTime.getTime();
                          const diff = Math.floor((end - start) / 1000);
                          const h = Math.floor(diff / 3600);
                          const m = Math.floor((diff % 3600) / 60);
                          const s = diff % 60;
                          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                        })()}
                      </div>

                      <Space size={4}>
                        <Tag color={session.isLive ? 'processing' : session.endAction === 'PAUSED' ? 'warning' : session.entryStatus === 'MANUAL_UPDATED' ? 'purple' : 'default'} style={{ borderRadius: 4, fontSize: 9 }}>
                          {session.isLive ? 'LIVE' : session.endAction === 'PAUSED' ? 'PAUSED' : session.entryStatus === 'MANUAL_UPDATED' ? 'MANUAL' : 'STOPPED'}
                        </Tag>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined style={{ color: '#94a3b8', fontSize: 12 }} />}
                          onClick={() => {
                            setEditingEntry(session);
                            setIsEditModalOpen(true);
                          }}
                        />
                      </Space>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          ))}

          {allUserSessions.length === 0 && (
            <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '20px 0' }}>No activity recorded for this period.</div>
          )}
        </div>
      </div>
    );
  };

  const handleClearFilters = () => {
    setFilters({
      userId: undefined,
      projectId: undefined,
      search: "",
      dateRange: [dayjs().startOf('day'), dayjs().endOf('day')],
    });
  };

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={true} style={{ borderRadius: 12, background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-100)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: 'var(--text-slate-600)', fontSize: 13, fontWeight: 500 }}>Active Members</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-slate-900)', marginTop: 4 }}>{stats.activeUsers}</div>
              </div>
              <div style={{ background: 'var(--bg-blue-50)', color: 'var(--text-blue-600)', padding: 10, borderRadius: 12, display: 'flex' }}>
                <TeamOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={true} style={{ borderRadius: 12, background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-100)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: 'var(--text-slate-600)', fontSize: 13, fontWeight: 500 }}>Total Work Hours</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-slate-900)', marginTop: 4 }}>{formatTime(stats.totalSeconds)}</div>
              </div>
              <div style={{ background: 'var(--bg-holiday)', color: 'var(--text-holiday)', padding: 10, borderRadius: 12, display: 'flex' }}>
                <ClockCircleOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={true} style={{ borderRadius: 12, background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-100)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: 'var(--text-slate-600)', fontSize: 13, fontWeight: 500 }}>Project Coverage</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-slate-900)', marginTop: 4 }}>{stats.uniqueProjects}</div>
              </div>
              <div style={{ background: 'var(--bg-paused-row)', color: '#f59e0b', padding: 10, borderRadius: 12, display: 'flex' }}>
                <RocketOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Left Side: Statistics (Persistent) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '0 16px',
            height: 38,
            background: 'var(--bg-blue-50)',
            border: '1px solid var(--border-blue-200)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              Individual Average:
            </Text>
            <Text strong style={{ fontSize: 15, color: 'var(--text-blue-700)' }}>
              {formatTime(filters.userId ? stats.averageSeconds : lastIndividualAverage)}
            </Text>
          </div>
        </div>

        {/* Right Side: Filters, Clear & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Select
            allowClear
            showSearch
            placeholder="Select Member"
            style={{ width: 180, height: 38 }}
            size="middle"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.children ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            value={filters.userId}
            onChange={(val) => setFilters(f => ({ ...f, userId: val }))}
          >
            {members.map(m => (
              <Select.Option key={m.value} value={m.value}>
                {m.label}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="All Projects"
            style={{ width: 180, height: 38 }}
            size="middle"
            allowClear
            value={filters.projectId}
            onChange={(val) => setFilters(f => ({ ...f, projectId: val }))}
          >
            {projects.map(p => <Select.Option key={p.value} value={p.value}>{p.label}</Select.Option>)}
          </Select>

          <RangePicker
            style={{ height: 38, borderRadius: 10, background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-200)' }}
            size="middle"
            allowClear
            value={filters.dateRange}
            onChange={(dates) => setFilters(f => ({ ...f, dateRange: dates as any }))}
          />

          <Button
            onClick={handleClearFilters}
            style={{
              fontWeight: 500,
              height: 38,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--bg-pure-white)',
              border: '1px solid var(--border-slate-200)',
              color: 'var(--text-leave)'
            }}
          >
            Clear
          </Button>

          <Tooltip title="Refresh Data">
            <Button
              onClick={fetchTeamEntries}
              icon={<ReloadOutlined />}
              style={{
                height: 38,
                width: 38,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-pure-white)',
                border: '1px solid var(--border-slate-200)'
              }}
              size="middle"
            />
          </Tooltip>
        </div>
      </div>

      <Table
        columns={userColumns}
        dataSource={groupedData}
        loading={loading}
        rowKey={(record) => record.id}
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 20 }}
        size="middle"
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

        .pulse-tag {
            animation: pulse-border 2s infinite;
        }
        @keyframes pulse-border {
            0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(24, 144, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
        }

        .control-bar {
            background: var(--bg-pure-white);
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 12px;
            border: 1px solid var(--border-slate-200);
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: center;
        }
      `}</style>

      <TimeEntryEditModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchTeamEntries}
        entry={editingEntry}
      />
    </div>
  );
};
