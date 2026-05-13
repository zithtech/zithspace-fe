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
    <div className="mtt-week-card">
      <div className="mtt-week-card__head">
        <div className="mtt-week-card__title-wrap">
          <div className="mtt-week-card__icon">
            <BarChartOutlined />
          </div>
          <div>
            <div className="mtt-week-card__title">7-Day Activity</div>
            <div className="mtt-week-card__subtitle">
              Last 7 days · {summary.activeDays} active
            </div>
          </div>
        </div>
      </div>

      <div className="mtt-week-card__metrics">
        <div className="mtt-week-card__metric">
          <span className="mtt-week-card__metric-label">Total</span>
          <span className="mtt-week-card__metric-value">
            {formatDurationShort(summary.totalSec)}
          </span>
        </div>
        <div className="mtt-week-card__metric">
          <span className="mtt-week-card__metric-label">Daily Avg</span>
          <span className="mtt-week-card__metric-value">
            {formatDurationShort(summary.avgSec)}
          </span>
        </div>
        {summary.best && summary.best.seconds > 0 && (
          <div className="mtt-week-card__metric mtt-week-card__metric--best">
            <span className="mtt-week-card__metric-label">
              <TrophyFilled /> Best
            </span>
            <span className="mtt-week-card__metric-value">
              {dayjs(summary.best.date).format("ddd")}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mtt-week-card__chart-wrap">
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
      ) : (
        <div className="mtt-week-card__chart-wrap">
          <div className="mtt-week-card__chart">
            {dailyStats.map((d) => {
              const heightPct = summary.maxSec
                ? Math.max(d.seconds > 0 ? 8 : 0, (d.seconds / summary.maxSec) * 100)
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
                >
                  <div
                    className={`mtt-week-card__col ${d.isToday ? "is-today" : ""} ${
                      d.seconds === 0 ? "is-empty" : ""
                    }`}
                  >
                    <div className="mtt-week-card__col-value">
                      {formatDurationCompact(d.seconds)}
                    </div>
                    <div className="mtt-week-card__col-track">
                      <div
                        className="mtt-week-card__col-bar"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <div className="mtt-week-card__col-label">
                      <span className="mtt-week-card__col-day">
                        {dayjs(d.date).format("ddd")}
                      </span>
                      <span className="mtt-week-card__col-date">
                        {dayjs(d.date).format("D")}
                      </span>
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}

      {!loading && summary.totalSec === 0 && (
        <div className="mtt-week-card__empty">
          <ClockCircleOutlined />
          <span>No time logged in the last 7 days</span>
        </div>
      )}
    </div>
  );
}
