"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import {
  ClockCircleOutlined,
  ThunderboltFilled,
  RiseOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import StatCards from "@/components/common/StatCards";
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { calculateNetDuration } from "@/utils/timeTrackingUtils";

const WEEK_GOAL_SECONDS = 40 * 3600;

const fmt = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return { h, m, label: `${h}h ${String(m).padStart(2, "0")}m` };
};

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    const min = Math.min(...data);
    const max = Math.max(...data, min + 1);
    const range = max - min;
    const width = 72;
    const height = 28;
    const bottomPadding = 4;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        let y = height - bottomPadding;
        if (max > min) {
            y = height - bottomPadding - ((d - min) / range) * (height - bottomPadding - 2);
        }
        return { x, y };
    });

    let pathD = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x},${points[i].y}`;
    }

    const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

    const isFlat = data.every(d => d === data[0]);
    const flatY = 2;
    const flatPathD = `M 0,${flatY} L ${width},${flatY}`;
    const flatFillD = `${flatPathD} L ${width},${height} L 0,${height} Z`;

    const gradId = `spark-grad-${color.replace('#', '')}`;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
            </defs>
            <path d={isFlat ? flatFillD : fillD} fill={`url(#${gradId})`} />
            <path d={isFlat ? flatPathD : pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export function MyTimeStatsStrip({ refreshKey }: { refreshKey?: number }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TimeTrackingEntry[]>([]);
  const { refreshTrigger } = useTimeTrackerStore();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const start = dayjs().subtract(13, "day").startOf("day").toISOString();
        const end = dayjs().endOf("day").toISOString();
        const data = await TimeTrackingService.getEntries({ startDate: start, endDate: end });
        if (!cancelled) setEntries(data || []);
      } catch (e) {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, refreshTrigger]);

  const stats = useMemo(() => {
    const todayKey = dayjs().format("YYYY-MM-DD");
    const yesterdayKey = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    const dayBuckets = new Map<string, TimeTrackingEntry[]>();
    entries.forEach((e) => {
      const k = dayjs(e.startTime).format("YYYY-MM-DD");
      if (!dayBuckets.has(k)) dayBuckets.set(k, []);
      dayBuckets.get(k)!.push(e);
    });

    const todaySec = calculateNetDuration(dayBuckets.get(todayKey) || []);
    const yesterdaySec = calculateNetDuration(dayBuckets.get(yesterdayKey) || []);

    const days: Date[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - (6 - i));
        return d;
    });
    const dayKeyFn = (d: Date) => dayjs(d).format("YYYY-MM-DD");

    const dailyHoursTrend = days.map((d) => calculateNetDuration(dayBuckets.get(dayKeyFn(d)) || []) / 3600);
    const sessionsTrend = days.map((d) => (dayBuckets.get(dayKeyFn(d)) || []).length);
    
    let cum = 0;
    const cumulativeHoursTrend = days.map((d) => {
        cum += calculateNetDuration(dayBuckets.get(dayKeyFn(d)) || []) / 3600;
        return cum;
    });

    let weekSec = 0;
    let daysWithWork = 0;
    for (let i = 0; i < 7; i++) {
      const k = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      const s = calculateNetDuration(dayBuckets.get(k) || []);
      if (s > 0) daysWithWork++;
      weekSec += s;
    }
    const avgSec = Math.round(weekSec / 7);

    const activeRunning = entries.filter((e) => e.status === "RUNNING").length;
    const activePaused = entries.filter((e) => e.status === "PAUSED").length;
    const totalActive = activeRunning + activePaused;

    return [
        {
            key: 'today',
            title: "Today's Hours",
            value: fmt(todaySec),
            deltaText: yesterdaySec > 0 ? `${todaySec > yesterdaySec ? '+' : ''}${Math.round((todaySec - yesterdaySec) / yesterdaySec * 100)}%` : null,
            deltaColor: todaySec >= yesterdaySec ? '#10b981' : '#f43f5e',
            icon: <ClockCircleOutlined />,
            color: '#3B82F6',
            trend: dailyHoursTrend,
            footerText: 'today'
        },
        {
            key: 'sessions',
            title: 'Active Sessions',
            value: totalActive.toString(),
            deltaText: activeRunning > 0 ? `+${activeRunning} running` : null,
            deltaColor: '#10b981',
            icon: <ThunderboltFilled />,
            color: '#10B981',
            trend: sessionsTrend,
            footerText: 'active'
        },
        {
            key: 'week',
            title: 'This Week',
            value: fmt(weekSec),
            deltaText: null,
            deltaColor: '#3b82f6',
            icon: <CalendarOutlined />,
            color: '#3B82F6',
            trend: cumulativeHoursTrend,
            footerText: 'this week'
        },
        {
            key: 'avg',
            title: 'Daily Average',
            value: fmt(avgSec),
            deltaText: null,
            deltaColor: '#64748b',
            icon: <RiseOutlined />,
            color: '#64748B',
            trend: dailyHoursTrend,
            footerText: `${daysWithWork} active days`
        }
    ];
  }, [entries]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="px-4 py-3.5"
            style={{
                border: '1px solid var(--border-slate-200)',
                background: 'var(--bg-pure-white)',
            }}
          >
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
          </div>
        ))}
      </div>
    );
  }

  const statCards = stats.map((s) => ({
    label: s.title,
    value:
      typeof s.value === "string"
        ? s.value
        : `${s.value.h}h ${String(s.value.m).padStart(2, "0")}m`,
    icon: s.icon,
    color: s.color,
  }));

  return <StatCards cards={statCards} />;
}
