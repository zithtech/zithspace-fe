"use client";

import React from "react";
import { Progress, Empty } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  FileTextOutlined,
  CalendarOutlined,
  WarningOutlined,
  RocketOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { SprintCompletionSummary } from "@/services/sprintCompletionService";
import dayjs from "dayjs";

interface SummaryTabProps {
  summary: SprintCompletionSummary;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ summary }) => {
  const { sprint, statistics } = summary;
  const destinations = summary?.availableDestinations || { sprints: [], buckets: [] };

  const velocity =
    statistics.totalPoints > 0
      ? Math.round((statistics.completedPoints / statistics.totalPoints) * 100)
      : 0;

  const duration = dayjs(sprint.endDate).diff(dayjs(sprint.startDate), "days");
  const daysRemaining = dayjs(sprint.endDate).diff(dayjs(), "days");

  const stats = [
    {
      key: 'total',
      label: 'Total Tickets',
      value: statistics.totalTickets,
      icon: <FileTextOutlined />,
      color: 'var(--sc-info)',
    },
    {
      key: 'completed',
      label: 'Completed',
      value: statistics.completedTickets,
      suffix: `/ ${statistics.totalTickets}`,
      icon: <CheckCircleOutlined />,
      color: 'var(--sc-success)',
    },
    {
      key: 'pending',
      label: 'Pending',
      value: statistics.pendingTickets,
      icon: <ClockCircleOutlined />,
      color: statistics.pendingTickets > 0 ? 'var(--sc-warning)' : 'var(--sc-success)',
    },
    {
      key: 'velocity',
      label: 'Sprint Velocity',
      value: velocity,
      suffix: '%',
      icon: <FireOutlined />,
      color: velocity >= 80 ? 'var(--sc-success)' : velocity >= 50 ? 'var(--sc-warning)' : 'var(--sc-danger)',
    },
  ];

  const checklist = [
    {
      label: 'All tickets resolved',
      status: statistics.pendingTickets === 0,
      detail:
        statistics.pendingTickets === 0
          ? 'All sprint items have been resolved'
          : `${statistics.pendingTickets} ticket${statistics.pendingTickets > 1 ? 's' : ''} still pending`,
    },
    {
      label: 'Velocity target met',
      status: velocity >= 70,
      detail: `Velocity is ${velocity}% (target: 70%+)`,
    },
    {
      label: 'Sprint duration valid',
      status: duration > 0,
      detail: `Sprint ran for ${duration} day${duration === 1 ? '' : 's'}`,
    },
  ];

  const ready = statistics.pendingTickets === 0;

  return (
    <div className="sc-tab sc-tab-summary">
      {/* Hero */}
      <div className="sc-hero">
        <div className="sc-hero-left">
          <div className="sc-hero-badge">
            <RocketOutlined />
          </div>
          <div className="sc-hero-info">
            <div className="sc-hero-eyebrow">Sprint Focus</div>
            <h3 className="sc-hero-name">{sprint.name}</h3>
            <div className="sc-hero-meta">
              <span className="sc-hero-meta-item">
                <CalendarOutlined />
                {dayjs(sprint.startDate).format('MMM D')} – {dayjs(sprint.endDate).format('MMM D, YYYY')}
              </span>
              <span className="sc-hero-dot" />
              <span className="sc-hero-meta-item">{duration} day{duration === 1 ? '' : 's'}</span>

              {daysRemaining > 0 && (
                <span className="sc-hero-chip">
                  {daysRemaining} day{daysRemaining === 1 ? '' : 's'} left
                </span>
              )}
              {daysRemaining === 0 && <span className="sc-hero-chip sc-hero-chip-warn">Ends today</span>}
              {daysRemaining < 0 && (
                <span className="sc-hero-chip sc-hero-chip-danger">
                  Overdue by {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) === 1 ? '' : 's'}
                </span>
              )}
              {ready && <span className="sc-hero-chip sc-hero-chip-success">Ready to complete</span>}
            </div>
          </div>
        </div>

        <div className="sc-hero-right">
          <div className="sc-hero-progress-text">
            <span className="sc-hero-progress-label">Completion</span>
            <span className="sc-hero-progress-sub">
              {statistics.completedTickets}/{statistics.totalTickets} resolved
            </span>
          </div>
          <Progress
            type="circle"
            percent={statistics.completionPercentage}
            size={56}
            strokeWidth={11}
            strokeColor={{ '0%': '#2563EB', '100%': '#10B981' }}
            trailColor="var(--sc-border-soft)"
            format={(percent) => (
              <span style={{ color: 'var(--sc-text)', fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em' }}>
                {percent}%
              </span>
            )}
          />
        </div>
      </div>

      {/* Stat tiles */}
      <div className="sc-stats-grid">
        {stats.map((stat) => (
          <div key={stat.key} className="sc-stat" style={{ ['--sc-stat-color' as any]: stat.color }}>
            <div className="sc-stat-icon">{stat.icon}</div>
            <div className="sc-stat-body">
              <span className="sc-stat-label">{stat.label}</span>
              <div className="sc-stat-value-row">
                <span className="sc-stat-value">{stat.value}</span>
                {stat.suffix && <span className="sc-stat-suffix">{stat.suffix}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two column section */}
      <div className="sc-grid-2 sc-summary-cols">
        {/* Destinations */}
        <div className="sc-card">
          <div className="sc-card-head">
            <span className="sc-card-title">
              <RocketOutlined />
              Available Destinations
            </span>
          </div>
          <div className="sc-card-body">
            <div className="sc-grid-2" style={{ gap: 14 }}>
              <div className="sc-dest-section">
                <div className="sc-dest-head">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <RocketOutlined style={{ color: 'var(--sc-brand)' }} />
                    Next Sprints
                  </span>
                  <span className="sc-dest-count">{destinations?.sprints?.length || 0}</span>
                </div>
                {destinations?.sprints && destinations.sprints.length > 0 ? (
                  <div className="sc-dest-list">
                    {destinations.sprints.map((s) => (
                      <div className="sc-dest-item" key={s.id}>
                        <span className="sc-dest-mini-tag">{s.status}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.version || s.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sc-dest-empty">No upcoming sprints</div>
                )}
              </div>

              <div className="sc-dest-section">
                <div className="sc-dest-head">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FolderOpenOutlined style={{ color: 'var(--sc-success)' }} />
                    Buckets
                  </span>
                  <span className="sc-dest-count">{destinations?.buckets?.length || 0}</span>
                </div>
                {destinations?.buckets && destinations.buckets.length > 0 ? (
                  <div className="sc-dest-list">
                    {destinations.buckets.map((b) => (
                      <div className="sc-dest-item" key={b.id}>
                        <span className="sc-dest-dot" style={{ background: b.color || 'var(--sc-text-faint)' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sc-dest-empty">No buckets configured</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="sc-card">
          <div className="sc-card-head">
            <span className="sc-card-title">
              <CheckCircleOutlined />
              Completion Checklist
            </span>
          </div>
          <div className="sc-card-body">
            <div className="sc-check-list">
              {checklist.map((item) => (
                <div className="sc-check-row" key={item.label}>
                  <span className={`sc-check-icon ${item.status ? 'sc-check-icon-ok' : 'sc-check-icon-wait'}`}>
                    {item.status ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                  </span>
                  <div className="sc-check-body">
                    <div className="sc-check-label">{item.label}</div>
                    <div className="sc-check-detail">{item.detail}</div>
                  </div>
                  <span className={`sc-check-tag ${item.status ? 'sc-check-tag-ok' : 'sc-check-tag-wait'}`}>
                    {item.status ? 'Done' : 'Wait'}
                  </span>
                </div>
              ))}
            </div>

            <div className={`sc-banner ${ready ? 'sc-banner-ok' : 'sc-banner-warn'}`}>
              <span className={`sc-banner-icon ${ready ? 'sc-banner-icon-ok' : 'sc-banner-icon-warn'}`}>
                {ready ? <CheckCircleOutlined /> : <WarningOutlined />}
              </span>
              <div>
                <div className="sc-banner-title">{ready ? 'Ready to complete' : 'Attention required'}</div>
                <div className="sc-banner-detail">
                  {ready
                    ? 'All requirements met — safe to proceed with sprint completion.'
                    : `Resolve ${statistics.pendingTickets} pending ticket${statistics.pendingTickets > 1 ? 's' : ''} before completing this sprint.`}
                </div>
              </div>
            </div>

            {/* Empty fallback in case stats hide */}
            {!checklist.length && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No checklist data" />
            )}
          </div>
        </div>
      </div>

      {/* Trophy footer hint when ready */}
      {ready && statistics.completedTickets > 0 && (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '11px 14px',
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.20)',
          }}
        >
          <TrophyOutlined style={{ fontSize: 22, color: 'var(--sc-success)' }} />
          <div style={{ fontSize: 13, color: 'var(--sc-text)' }}>
            <strong style={{ fontWeight: 800 }}>Strong sprint!</strong>{' '}
            <span style={{ color: 'var(--sc-text-muted)' }}>
              {statistics.completedTickets} ticket{statistics.completedTickets > 1 ? 's' : ''} delivered, {statistics.completedPoints} point{statistics.completedPoints === 1 ? '' : 's'} resolved.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryTab;
