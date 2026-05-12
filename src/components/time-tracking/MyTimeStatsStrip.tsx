"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Skeleton } from "antd";
import {
  ClockCircleOutlined,
  ThunderboltFilled,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  PlayCircleFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { calculateNetDuration } from "@/utils/timeTrackingUtils";

const WEEK_GOAL_SECONDS = 40 * 3600;

const fmt = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return { h, m, label: `${h}h ${String(m).padStart(2, "0")}m` };
};

interface KPIProps {
  tone: "violet" | "emerald" | "blue" | "amber";
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  footer?: React.ReactNode;
}

const KPITile: React.FC<KPIProps> = ({ tone, icon, label, value, sub, footer }) => (
  <div className={`mtt-kpi mtt-kpi--${tone}`}>
    <div className="mtt-kpi__head">
      <div className="mtt-kpi__icon">{icon}</div>
      <span className="mtt-kpi__label">{label}</span>
    </div>
    <div className="mtt-kpi__value">{value}</div>
    {sub && <div className="mtt-kpi__sub">{sub}</div>}
    {footer && <div className="mtt-kpi__footer">{footer}</div>}
  </div>
);

export function MyTimeStatsStrip({ refreshKey }: { refreshKey?: number }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TimeTrackingEntry[]>([]);
  const { activeEntry, refreshTrigger } = useTimeTrackerStore();

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

    let trendPct = 0;
    let trendDir: "up" | "down" | "flat" = "flat";
    if (yesterdaySec > 0) {
      const diff = todaySec - yesterdaySec;
      trendPct = Math.round((diff / yesterdaySec) * 100);
      trendDir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    } else if (todaySec > 0) {
      trendDir = "up";
      trendPct = 100;
    }

    return {
      todaySec,
      yesterdaySec,
      weekSec,
      avgSec,
      daysWithWork,
      activeRunning,
      activePaused,
      trendPct,
      trendDir,
    };
  }, [entries]);

  if (loading) {
    return (
      <div className="mtt-kpi-strip">
        <Row gutter={16}>
          {[0, 1, 2, 3].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <div className="mtt-kpi mtt-kpi--skeleton">
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
              </div>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  const today = fmt(stats.todaySec);
  const week = fmt(stats.weekSec);
  const avg = fmt(stats.avgSec);
  const weekProgress = Math.min(100, Math.round((stats.weekSec / WEEK_GOAL_SECONDS) * 100));
  const totalActive = stats.activeRunning + stats.activePaused;

  return (
    <div className="mtt-kpi-strip">
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <KPITile
            tone="violet"
            icon={<ClockCircleOutlined />}
            label="Today's Hours"
            value={
              <>
                <span className="mtt-kpi__main">{today.h}</span>
                <span className="mtt-kpi__unit">h</span>
                <span className="mtt-kpi__main mtt-kpi__main--sm">{String(today.m).padStart(2, "0")}</span>
                <span className="mtt-kpi__unit">m</span>
              </>
            }
            sub={
              stats.trendDir === "flat" ? (
                <span className="mtt-trend mtt-trend--flat">No change vs yesterday</span>
              ) : (
                <span className={`mtt-trend mtt-trend--${stats.trendDir}`}>
                  {stats.trendDir === "up" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(stats.trendPct)}% vs yesterday
                </span>
              )
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <KPITile
            tone="emerald"
            icon={<ThunderboltFilled />}
            label="Active Sessions"
            value={
              <>
                <span className="mtt-kpi__main">{totalActive}</span>
                <span className="mtt-kpi__unit">{totalActive === 1 ? "session" : "sessions"}</span>
              </>
            }
            sub={
              totalActive > 0 ? (
                <span className="mtt-trend mtt-trend--running">
                  <PlayCircleFilled /> {stats.activeRunning} running
                  {stats.activePaused > 0 ? ` · ${stats.activePaused} paused` : ""}
                </span>
              ) : (
                <span className="mtt-trend mtt-trend--flat">No active timers</span>
              )
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <KPITile
            tone="blue"
            icon={<CalendarOutlined />}
            label="This Week"
            value={
              <>
                <span className="mtt-kpi__main">{week.h}</span>
                <span className="mtt-kpi__unit">h</span>
                <span className="mtt-kpi__main mtt-kpi__main--sm">{String(week.m).padStart(2, "0")}</span>
                <span className="mtt-kpi__unit">m</span>
              </>
            }
            footer={
              <div className="mtt-progress">
                <div className="mtt-progress__bar">
                  <div className="mtt-progress__fill" style={{ width: `${weekProgress}%` }} />
                </div>
                <div className="mtt-progress__meta">
                  <span>{weekProgress}% of 40h goal</span>
                </div>
              </div>
            }
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <KPITile
            tone="amber"
            icon={<RiseOutlined />}
            label="Daily Average"
            value={
              <>
                <span className="mtt-kpi__main">{avg.h}</span>
                <span className="mtt-kpi__unit">h</span>
                <span className="mtt-kpi__main mtt-kpi__main--sm">{String(avg.m).padStart(2, "0")}</span>
                <span className="mtt-kpi__unit">m</span>
              </>
            }
            sub={
              <span className="mtt-trend mtt-trend--flat">
                {stats.daysWithWork} of 7 active days
              </span>
            }
          />
        </Col>
      </Row>
    </div>
  );
}
