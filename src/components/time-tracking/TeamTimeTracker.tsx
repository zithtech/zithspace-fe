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
      // Step 1: Shorten the entry. We explicitly only update End Time.
      await TimeTrackingService.updateEntry(entry.entryId, {
        endTime: endTime.toISOString(),
        status: 'STOPPED'
      });
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
        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 24 }}>
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
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: 8, color: '#475569', fontWeight: 600 }}>
                {dayjs(entry?.start).format("h:mm:ss A")}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>New End Time</Text>
              <TimePicker
                value={endTime}
                onChange={(time) => setEndTime(time)}
                format="HH:mm:ss"
                style={{ width: '100%', height: 40, borderRadius: 8 }}
                allowClear={false}
                placeholder="Select end time"
              />
            </div>
          </div>

          <div style={{ background: '#fef2f2', padding: 12, borderRadius: 8, border: '1px solid #fee2e2' }}>
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
    if (!filters.search) return entries;
    const searchLower = filters.search.toLowerCase();
    return entries.filter(e =>
      e.description?.toLowerCase().includes(searchLower) ||
      e.ticket?.title?.toLowerCase().includes(searchLower) ||
      e.ticket?.ticketNumber?.toLowerCase().includes(searchLower)
    );
  }, [entries, filters.search]);

  // Group entries by user and calculate wall-clock total time
  const groupedData = useMemo(() => {
    const userMap: Record<string, { user: any; entries: TimeTrackingEntry[]; totalSeconds: number; status: string }> = {};

    filteredEntries.forEach(entry => {
      if (!entry.user) return;
      const uId = entry.user.id;
      if (!userMap[uId]) {
        userMap[uId] = { user: entry.user, entries: [], totalSeconds: 0, status: "Idle" };
      }
      userMap[uId].entries.push(entry);
      if (entry.status === "RUNNING") {
        userMap[uId].status = "Active";
      }
    });

    // Calculate total duration for each user using net duration utility
    Object.values(userMap).forEach(userData => {
      userData.totalSeconds = calculateNetDuration(userData.entries, 5000, currentTime.getTime());

      // Calculate project breakdown for tooltips
      const projBreakdown: Record<string, { seconds: number; name: string; entries: TimeTrackingEntry[] }> = {};
      userData.entries.forEach(e => {
        const pId = (e.project && typeof e.project === 'object') ? e.project.id : (e.project || 'unknown');
        const pName = (e.project && typeof e.project === 'object') ? e.project.name : (e.project || 'No Project');

        if (!projBreakdown[pId]) projBreakdown[pId] = { seconds: 0, name: pName, entries: [] };
        projBreakdown[pId].entries.push(e);
      });

      // Recalculate each project's net duration
      Object.keys(projBreakdown).forEach(pId => {
        projBreakdown[pId].seconds = calculateNetDuration(projBreakdown[pId].entries, 5000, currentTime.getTime());
      });

      (userData as any).projectBreakdown = Object.values(projBreakdown).sort((a, b) => b.seconds - a.seconds);
    });

    return Object.values(userMap).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [filteredEntries, currentTime]);

  const stats = useMemo(() => {
    const activeUsers = groupedData.filter(u => u.status === "Active").length;
    const totalSeconds = groupedData.reduce((acc, u) => acc + u.totalSeconds, 0);
    const uniqueProjects = new Set(filteredEntries.map(e => e.projectId).filter(Boolean)).size;

    return { activeUsers, totalSeconds, uniqueProjects };
  }, [groupedData, filteredEntries]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const userColumns = [
    {
      title: "Team Member",
      key: "user",
      render: (_: any, record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }}>
            {record.user.name[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.user.name}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{record.user.workEmail}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Daily Capacity",
      key: "progress",
      width: 200,
      render: (_: any, record: any) => {
        const targetSeconds = 8 * 3600; // 8 hours
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
                <Text type="secondary">{percent >= 100 ? 'Goal Reached' : `${Math.round(percent)}% of 8h`}</Text>
                <Text strong style={{ color: percent >= 100 ? '#10b981' : 'inherit' }}>{formatTime(record.totalSeconds)}</Text>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
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

    // Sort user sessions by start time descending
    allUserSessions.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

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
      <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #f1f5f9' }}>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockCircleOutlined style={{ color: '#6366f1', fontSize: 14 }} />
          <Text strong style={{ fontSize: 14, color: '#1e293b' }}>Activity Timeline</Text>
        </div>

        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {/* Vertical Line */}
          <div style={{
            position: 'absolute',
            left: 5,
            top: 6,
            bottom: 6,
            width: 1.5,
            background: 'linear-gradient(to bottom, #6366f1, #f1f5f9)',
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
                border: '3px solid #fff',
                boxShadow: '0 0 0 1px #e0e7ff',
                zIndex: 2
              }} />

              <div className="glass-card" style={{ padding: '12px 16px', background: '#fff' }}>
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
                        <Link href={`/tickets/${session.ticketId}`}>
                          <Text strong style={{ fontSize: 13, color: '#1e293b', cursor: 'pointer' }}>{session.ticket.title}</Text>
                        </Link>
                      ) : (
                        <Text strong style={{ fontSize: 13, color: '#1e293b' }}>{session.description || "No description provided"}</Text>
                      )}
                    </div>
                  </Col>

                  <Col style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        padding: '2px 10px',
                        background: session.isLive ? '#f0fdf4' : session.endAction === 'PAUSED' ? '#fffbeb' : '#f8fafc',
                        borderRadius: 12,
                        color: session.isLive ? '#16a34a' : session.endAction === 'PAUSED' ? '#b45309' : '#475569',
                        fontWeight: 700,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        border: '1px solid ' + (session.isLive ? '#bcf0da' : session.endAction === 'PAUSED' ? '#fde68a' : '#e2e8f0')
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

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={true} style={{ borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Active Members</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{stats.activeUsers}</div>
              </div>
              <div style={{ background: '#eff6ff', color: '#2563eb', padding: 10, borderRadius: 12, display: 'flex' }}>
                <TeamOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={true} style={{ borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Total Work Hours</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{formatTime(stats.totalSeconds)}</div>
              </div>
              <div style={{ background: '#ecfdf5', color: '#10b981', padding: 10, borderRadius: 12, display: 'flex' }}>
                <ClockCircleOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={true} style={{ borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Project Coverage</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{stats.uniqueProjects}</div>
              </div>
              <div style={{ background: '#fff7ed', color: '#f59e0b', padding: 10, borderRadius: 12, display: 'flex' }}>
                <RocketOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* <Select
          allowClear
          showSearch
          placeholder="Member"
          style={{ width: 160, height: 32 }}
          size="small"
          onChange={(val) => setFilters(f => ({ ...f, userId: val }))}
        >
          {members.map(m => <Select.Option key={m.value} value={m.value}>{m.label}</Select.Option>)}
        </Select> */}
        <Select
          allowClear
          showSearch
          placeholder="Member"
          style={{ width: 160, height: 32 }}
          size="small"
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.children ?? "")
              .toString()
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          onChange={(val) => setFilters(f => ({ ...f, userId: val }))}
        >
          {members.map(m => (
            <Select.Option key={m.value} value={m.value}>
              {m.label}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="Project"
          style={{ width: 160, height: 32 }}
          size="small"
          allowClear
          onChange={(val) => setFilters(f => ({ ...f, projectId: val }))}
        >
          {projects.map(p => <Select.Option key={p.value} value={p.value}>{p.label}</Select.Option>)}
        </Select>
        <Input
          placeholder="Search..."
          prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 13 }} />}
          style={{ width: 220, height: 32, borderRadius: 6, fontSize: 13 }}
          size="small"
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <RangePicker
          style={{ height: 32, borderRadius: 6 }}
          size="small"
          value={filters.dateRange}
          onChange={(dates) => setFilters(f => ({ ...f, dateRange: dates as any }))}
        />
        <Tooltip title="Refresh Data">
          <Button
            onClick={fetchTeamEntries}
            icon={<ReloadOutlined />}
            style={{ height: 32, width: 32, padding: 0, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            size="small"
          />
        </Tooltip>
      </div>

      <Table
        columns={userColumns}
        dataSource={groupedData}
        loading={loading}
        rowKey={(record) => record.user.id}
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 20 }}
        size="middle"
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

        .pulse-tag {
            animation: pulse-border 2s infinite;
        }
        @keyframes pulse-border {
            0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(24, 144, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
        }

        .control-bar {
            background: #fff;
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 12px;
            border: 1px solid #e2e8f0;
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
