"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Table, Typography, Card, Tag, Space, Skeleton } from "antd";
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import dayjs from "dayjs";

import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";

const { Text } = Typography;

export function TimeSummary7Days({ refreshKey }: { refreshKey?: number }) {
  const [entries, setEntries] = useState<TimeTrackingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeEntry, refreshTrigger } = useTimeTrackerStore();

  const fetchLast7Days = async () => {
    try {
      setLoading(true);
      const today = dayjs().endOf('day');
      const sevenDaysAgo = dayjs().subtract(6, 'day').startOf('day');
      
      const data = await TimeTrackingService.getEntries({
        startDate: sevenDaysAgo.toISOString(),
        endDate: today.toISOString(),
      });
      setEntries(data || []);
    } catch (error) {
      console.error("Error fetching 7-day summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLast7Days();
  }, [refreshTrigger, refreshKey]);

  const dailyStats = useMemo(() => {
    const stats: { date: string; seconds: number }[] = [];
    
    // Generate last 7 days (including today) - Today FIRST
    for (let i = 0; i < 7; i++) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      
      // Filter entries for this specific day
      const dayEntries = entries.filter(e => dayjs(e.startTime).format('YYYY-MM-DD') === date);
      
      // Apply wall-clock duration logic (Completed Only)
      const allIntervals: { start: number; end: number }[] = [];
      dayEntries.forEach(entry => {
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

        // Include entry-level interval for manual/completed records
        if (entry.status !== 'RUNNING' && entry.startTime && entry.endTime) {
          allIntervals.push({
            start: new Date(entry.startTime).getTime(),
            end: new Date(entry.endTime).getTime()
          });
        }
      });

      let totalSeconds = 0;
      if (allIntervals.length > 0) {
        // Merge overlapping intervals
        allIntervals.sort((a, b) => a.start - b.start);
        const merged: { start: number; end: number }[] = [];
        let current = allIntervals[0];

        for (let j = 1; j < allIntervals.length; j++) {
          const next = allIntervals[j];
          if (next.start <= current.end) {
            current.end = Math.max(current.end, next.end);
          } else {
            merged.push(current);
            current = next;
          }
        }
        merged.push(current);
        const totalMs = merged.reduce((sum, interval) => sum + (interval.end - interval.start), 0);
        totalSeconds = Math.floor(totalMs / 1000);
      }

      stats.push({ date, seconds: totalSeconds });
    }
    
    return stats;
  }, [entries]);

  const averageHours = useMemo(() => {
    const totalSeconds = dailyStats.reduce((acc, curr) => acc + curr.seconds, 0);
    const totalHours = totalSeconds / 3600;
    return (totalHours / 7).toFixed(1);
  }, [dailyStats]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text: string) => dayjs(text).format("ddd, MMM D"),
    },
    {
      title: "Time",
      dataIndex: "seconds",
      key: "seconds",
      align: 'right' as const,
      render: (val: number) => <Text strong>{formatDuration(val)}</Text>,
    },
  ];

  return (
    <Card 
      title={<Space><Text strong>7-Day History</Text><Tag color="blue" style={{ marginLeft: 12 }}>Last 7 Days Avg: {averageHours} Hours</Tag></Space>}
      style={{ height: '100%', background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <Table
          dataSource={dailyStats}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="date"
          locale={{ emptyText: "No data for the last 7 days" }}
        />
      )}
    </Card>
  );
}
