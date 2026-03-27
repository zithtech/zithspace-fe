"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Table, Typography, Card, Tag, Space, Skeleton } from "antd";
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import dayjs from "dayjs";

import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { calculateNetDuration } from "@/utils/timeTrackingUtils";

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
      
      const totalSeconds = calculateNetDuration(dayEntries);

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
      title={<Space><Text strong style={{ color: '#1e293b' }}>7-Day History</Text><Tag color="blue" style={{ marginLeft: 12, borderRadius: 6 }}>Last 7 Days Avg: {averageHours} Hours</Tag></Space>}
      style={{ height: '100%', background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", overflow: 'hidden' }}
      styles={{ body: { padding: '0px' } }}
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
