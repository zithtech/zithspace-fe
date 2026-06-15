"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Skeleton, Tooltip } from "antd";
import {
  BarChartOutlined,
  TrophyFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import dayjs from "dayjs";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { calculateNetDuration } from "@/utils/timeTrackingUtils";

const formatDurationShort = (seconds: number) => {
  if (!seconds) return "0h 0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatDurationCompact = (seconds: number) => {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
};

export function TimeSummary7Days({ refreshKey }: { refreshKey?: number }) {
  const [entries, setEntries] = useState<TimeTrackingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshTrigger } = useTimeTrackerStore();

  const fetchLast7Days = async () => {
    try {
      setLoading(true);
      const today = dayjs().endOf("day");
      const sevenDaysAgo = dayjs().subtract(6, "day").startOf("day");
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
    const todayKey = dayjs().format("YYYY-MM-DD");
    const stats: { date: string; seconds: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = dayjs().subtract(i, "day");
      const date = day.format("YYYY-MM-DD");
      const dayEntries = entries.filter(
        (e) => dayjs(e.startTime).format("YYYY-MM-DD") === date
      );
      const totalSeconds = calculateNetDuration(dayEntries);
      stats.push({ date, seconds: totalSeconds, isToday: date === todayKey });
    }
    return stats;
  }, [entries]);

  const summary = useMemo(() => {
    const totalSec = dailyStats.reduce((acc, d) => acc + d.seconds, 0);
    const avgSec = totalSec / 7;
    const maxSec = Math.max(...dailyStats.map((d) => d.seconds), 1);
    const best = [...dailyStats].sort((a, b) => b.seconds - a.seconds)[0];
    const activeDays = dailyStats.filter((d) => d.seconds > 0).length;
    return { totalSec, avgSec, maxSec, best, activeDays };
  }, [dailyStats]);

  return (
    <div 
      className="mtt-week-card flex flex-col"
      style={{
        background: 'var(--bg-pure-white)',
        borderRadius: 0,
        border: '1px solid var(--border-slate-200)',
        padding: '16px',
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div 
          className="flex items-center justify-center rounded-md"
          style={{ width: 32, height: 32, background: 'rgba(59, 130, 246, 0.10)', color: '#3b82f6' }}
        >
          <BarChartOutlined />
        </div>
        <div>
          <div className="text-[13px] font-bold text-slate-800 leading-tight">7-Day Activity</div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Last 7 days · {summary.activeDays} active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total</div>
          <div className="text-sm font-semibold text-slate-700">{formatDurationShort(summary.totalSec)}</div>
        </div>
        <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Daily Avg</div>
          <div className="text-sm font-semibold text-slate-700">{formatDurationShort(summary.avgSec)}</div>
        </div>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} title={false} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {dailyStats.map((d) => {
            const widthPct = summary.maxSec
              ? Math.max(d.seconds > 0 ? 4 : 0, (d.seconds / summary.maxSec) * 100)
              : 0;
            return (
              <Tooltip
                key={d.date}
                title={
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600 }}>
                      {dayjs(d.date).format("dddd, MMM D")}
                    </div>
                    <div style={{ marginTop: 2 }}>{formatDurationShort(d.seconds)}</div>
                  </div>
                }
                placement="right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-[30px] shrink-0 text-right">
                    <span className={`text-[11px] font-bold ${d.isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                      {dayjs(d.date).format("ddd")}
                    </span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${d.isToday ? 'bg-blue-500' : 'bg-slate-300'}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <div className="w-[42px] shrink-0 text-left">
                    <span className={`text-[11px] font-semibold ${d.seconds === 0 ? 'text-slate-300' : 'text-slate-600'}`}>
                      {formatDurationCompact(d.seconds)}
                    </span>
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      )}

      {!loading && summary.totalSec === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-xs gap-2">
          <ClockCircleOutlined style={{ fontSize: 20 }} />
          <span>No time logged in 7 days</span>
        </div>
      )}
    </div>
  );
}
