"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, Tag, Typography, Space, Card, Row, Col, Select, Input, Avatar, Tooltip, Button, DatePicker } from "antd";
import { UserOutlined, ClockCircleOutlined, TeamOutlined, SearchOutlined, RocketOutlined, CalendarOutlined } from "@ant-design/icons";
const { RangePicker } = DatePicker;
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import { useMembers, useUserProjects } from "@/hooks/useGlobalData";
import dayjs from "dayjs";
import Link from "next/link";

const { Title, Text } = Typography;

const processLogsToSessions = (logs: TimeTrackingEntry['logs'], startTime: string) => {
  if (!logs || logs.length === 0) return [];

  const sortedLogs = [...logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const sessions: any[] = [];
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
  if (current) sessions.push(current);
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
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: members = [] } = useMembers();
  const { data: projects = [] } = useUserProjects();

  const fetchTeamEntries = async () => {
    try {
      setLoading(true);
      const data = await TimeTrackingService.getEntries({
        allUsers: true,
        userId: filters.userId,
        projectId: filters.projectId,
        startDate: filters.dateRange?.[0].toISOString(),
        endDate: filters.dateRange?.[1].toISOString(),
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

    // Calculate wall-clock total for each user by merging all their intervals
    Object.values(userMap).forEach(userData => {
      const allIntervals: { start: number; end: number }[] = [];

      userData.entries.forEach(entry => {
        const entrySessions = processLogsToSessions(entry.logs, entry.startTime);
        entrySessions.forEach(s => {
          if (s.end) {
            allIntervals.push({
              start: new Date(s.start).getTime(),
              end: new Date(s.end).getTime()
            });
          }
        });

        // Also include the entry's overall range if completed (important for manual updates)
        if (entry.status !== 'RUNNING' && entry.startTime && entry.endTime) {
          allIntervals.push({
            start: new Date(entry.startTime).getTime(),
            end: new Date(entry.endTime).getTime()
          });
        }
      });

      if (allIntervals.length > 0) {
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
        userData.totalSeconds = Math.floor(totalMs / 1000);
      }
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
      title: "Total Time",
      dataIndex: "totalSeconds",
      key: "total",
      render: (val: number) => (
        <Text strong style={{ fontSize: 14 }}>{formatTime(val)}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={status === "Active" ? "processing" : status === "Paused" ? "warning" : "default"}
          icon={status === "Active" ? <ClockCircleOutlined spin /> : null}
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
      const sessions = processLogsToSessions(entry.logs, entry.startTime);

      sessions.forEach(session => {
        allUserSessions.push({
          ...session,
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
        render: (name: string) => name || <Text type="secondary" italic>No Project</Text>
      },
      {
        title: "Task",
        key: "task",
        render: (_: any, record: any) => (
          <div>
            {record.ticket ? (
              <Link href={`/public/tickets/${record.ticketId}`} target="_blank">
                <Text style={{ color: '#1890ff', fontWeight: 500 }}>{record.ticket.title}</Text>
              </Link>
            ) : (
              <Text>{record.description || "No description"}</Text>
            )}
          </div>
        )
      },
      {
        title: "Start Time",
        dataIndex: "start",
        key: "start",
        width: 160,
        render: (t: string) => <Text style={{ fontSize: 13 }}>{dayjs(t).format("MMM D, h:mm:ss A")}</Text>
      },
      {
        title: "End Time",
        dataIndex: "end",
        key: "end",
        width: 160,
        render: (t: string) => t ? <Text style={{ fontSize: 13 }}>{dayjs(t).format("MMM D, h:mm:ss A")}</Text> : <Tag color="processing">Running</Tag>
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
          <Tag color={record.isLive ? 'processing' : record.endAction === 'PAUSED' ? 'warning' : 'default'}>
            {record.isLive ? 'RUNNING' : record.endAction === 'PAUSED' ? 'PAUSED' : 'STOPPED'}
          </Tag>
        )
      }
    ];

    return (
      <div style={{ padding: '12px 24px', backgroundColor: '#f9fafb', borderRadius: 8 }}>
        <Table
          columns={sessionColumns}
          dataSource={allUserSessions}
          pagination={false}
          size="small"
          rowKey={(record) => `${record.id}-${record.start}`}
          bordered
        />
      </div>
    );
  };

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card variant="borderless" className="stat-card">
            <Space align="start">
              <div className="icon-wrapper" style={{ background: '#e0f2fe', color: '#0369a1', padding: 12, borderRadius: 12 }}>
                <TeamOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>Active Users</Text>
                <Title level={3} style={{ margin: 0 }}>{stats.activeUsers}</Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="borderless" className="stat-card">
            <Space align="start">
              <div className="icon-wrapper" style={{ background: '#fef3c7', color: '#b45309', padding: 12, borderRadius: 12 }}>
                <ClockCircleOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>Total Team Hours</Text>
                <Title level={3} style={{ margin: 0 }}>{formatTime(stats.totalSeconds)}</Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="borderless" className="stat-card">
            <Space align="start">
              <div className="icon-wrapper" style={{ background: '#f0fdf4', color: '#15803d', padding: 12, borderRadius: 12 }}>
                <RocketOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>Unique Projects</Text>
                <Title level={3} style={{ margin: 0 }}>{stats.uniqueProjects}</Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" title="Team Activity" styles={{ body: { padding: '0 24px' } }}>
        <div style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 16, display: 'flex', gap: 12 }}>
          <Select
            placeholder="Filter by Member"
            style={{ width: 200 }}
            allowClear
            onChange={(val) => setFilters(f => ({ ...f, userId: val }))}
          >
            {members.map(m => <Select.Option key={m.value} value={m.value}>{m.label}</Select.Option>)}
          </Select>
          <Select
            placeholder="Filter by Project"
            style={{ width: 200 }}
            allowClear
            onChange={(val) => setFilters(f => ({ ...f, projectId: val }))}
          >
            {projects.map(p => <Select.Option key={p.value} value={p.value}>{p.label}</Select.Option>)}
          </Select>
          <Input
            placeholder="Search tasks or descriptions..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            style={{ width: 300 }}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters(f => ({ ...f, dateRange: dates as any }))}
            presets={[
              { label: 'Today', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
              { label: 'Yesterday', value: [dayjs().subtract(1, 'd').startOf('day'), dayjs().subtract(1, 'd').endOf('day')] },
              { label: 'This Week', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
            ]}
          />
          <Button onClick={fetchTeamEntries}>Refresh</Button>
        </div>

        <Table
          columns={userColumns}
          dataSource={groupedData}
          loading={loading}
          rowKey={(record) => record.user.id}
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <style jsx>{`
        .stat-card {
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: all 0.2s;
        }
        .stat-card:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};
