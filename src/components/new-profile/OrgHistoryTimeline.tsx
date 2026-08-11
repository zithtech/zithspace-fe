import React, { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import dayjs from 'dayjs';
import { api } from '@/lib/axios';
import { useTheme } from '@/context/ThemeContext';
import {
  TrendingUp,
  CheckCircle2,
  Clock3,
  User,
  CalendarDays,
  Briefcase,
} from 'lucide-react';

interface OrgHistoryTimelineProps {
  employeeId: string;
}

type EventType = 'role_current' | 'role_past' | 'onboarding' | 'pipeline';

interface TimelineEvent {
  type: EventType;
  title: string;
  subtitle: string;
  dateRange: string;
}

export default function OrgHistoryTimeline({ employeeId }: OrgHistoryTimelineProps) {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<any>(null);

  // Theme tokens
  const surface     = dark ? '#0d1117' : '#ffffff';
  const cardBg      = dark ? '#111827' : '#ffffff';
  const cardBorder  = dark ? '#1e2d40' : '#f1f5f9';
  const cardBorderCurrent = dark ? '#3730a3' : '#c7d2fe';
  const cardBgCurrent     = dark ? 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.10) 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)';
  const textPrimary   = dark ? '#e6e8ee' : '#1e293b';
  const textSecondary = dark ? '#7a8ba0' : '#94a3b8';
  const textLabel     = dark ? '#4b6280' : '#94a3b8';
  const datePillBg    = dark ? '#1a2536' : '#f8fafc';
  const datePillBorder= dark ? '#2d3f55' : '#e2e8f0';
  const emptyBg       = dark ? '#0d1117' : '#f8fafc';
  const emptyBorder   = dark ? '#1e2d40' : '#e2e8f0';
  const lineColor     = dark ? 'linear-gradient(to bottom, #6366f1, #1e2d40)' : 'linear-gradient(to bottom, #6366f1, #e2e8f0)';
  const headerIconBg  = dark ? 'rgba(99,102,241,0.15)' : undefined;

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    api
      .get(`/api/onboarding/${employeeId}/org-history`)
      .then((data: any) => setHistoryData(data))
      .catch(() => message.error('Error fetching Org History'))
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!historyData) return null;

  const events: TimelineEvent[] = [];

  if (historyData.roles?.length > 0) {
    historyData.roles.forEach((role: any) => {
      const isPresent = !role.endDate;
      events.push({
        type: isPresent ? 'role_current' : 'role_past',
        title: role.roleName,
        subtitle: isPresent ? 'Current Role' : 'Previous Role',
        dateRange: isPresent
          ? `${dayjs(role.startDate).format('MMM D, YYYY')} – Present`
          : `${dayjs(role.startDate).format('MMM D, YYYY')} – ${dayjs(role.endDate).format('MMM D, YYYY')}`,
      });
    });
  }

  if (historyData.onboarding?.onboardingDate) {
    events.push({
      type: 'onboarding',
      title: 'Completed Onboarding',
      subtitle: 'Onboarding',
      dateRange: dayjs(historyData.onboarding.onboardingDate).format('MMM D, YYYY'),
    });
  }

  if (historyData.pipeline?.interviewDate) {
    events.push({
      type: 'pipeline',
      title: 'Interview Selected',
      subtitle: 'Hiring Pipeline',
      dateRange: dayjs(historyData.pipeline.interviewDate).format('MMM D, YYYY'),
    });
  }

  const iconConfig: Record<EventType, { icon: React.ReactNode; bg: string; dotBorder: string; iconColor: string }> = {
    role_current: {
      icon: <TrendingUp size={15} />,
      bg: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      dotBorder: dark ? '#0d1117' : '#fff',
      iconColor: '#fff',
    },
    role_past: {
      icon: <Briefcase size={15} />,
      bg: dark ? '#1e2d40' : '#f1f5f9',
      dotBorder: dark ? '#0d1117' : '#fff',
      iconColor: dark ? '#7a8ba0' : '#64748b',
    },
    onboarding: {
      icon: <CheckCircle2 size={15} />,
      bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      dotBorder: dark ? '#0d1117' : '#fff',
      iconColor: '#fff',
    },
    pipeline: {
      icon: <Clock3 size={15} />,
      bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      dotBorder: dark ? '#0d1117' : '#fff',
      iconColor: '#fff',
    },
  };

  if (events.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '60px 24px',
        background: emptyBg, borderRadius: 16,
        border: `2px dashed ${emptyBorder}`, marginTop: 16, gap: 12,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: dark ? 'rgba(99,102,241,0.15)' : 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={24} color="#6366f1" />
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, color: textPrimary }}>No Org History Yet</div>
        <div style={{ fontSize: 13, color: textSecondary, textAlign: 'center', maxWidth: 280 }}>
          The employee's career timeline will appear here once a role is assigned or a promotion is recorded.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: headerIconBg ?? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: dark ? 'none' : '0 4px 12px rgba(99,102,241,0.3)',
          border: dark ? '1px solid rgba(99,102,241,0.4)' : 'none',
        }}>
          <CalendarDays size={18} color={dark ? '#818cf8' : '#fff'} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: textPrimary }}>Career Timeline</div>
          <div style={{ fontSize: 12, color: textSecondary, marginTop: 1 }}>
            {events.length} milestone{events.length !== 1 ? 's' : ''} recorded
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 17, top: 8, bottom: 8,
          width: 2, background: lineColor, borderRadius: 2,
        }} />

        {events.map((event, idx) => {
          const cfg = iconConfig[event.type];
          const isLast = idx === events.length - 1;
          const isCurrent = event.type === 'role_current';

          return (
            <div key={idx} style={{ position: 'relative', display: 'flex', gap: 16, paddingBottom: isLast ? 0 : 24 }}>
              {/* Icon dot */}
              <div style={{
                position: 'absolute', left: -28, top: 4,
                width: 32, height: 32, borderRadius: '50%',
                background: cfg.bg,
                border: `3px solid ${cfg.dotBorder}`,
                boxShadow: isCurrent
                  ? `0 0 0 3px rgba(99,102,241,0.3), 0 4px 12px rgba(99,102,241,0.35)`
                  : dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: cfg.iconColor, zIndex: 1, flexShrink: 0,
              }}>
                {cfg.icon}
              </div>

              {/* Card */}
              <div style={{
                flex: 1, marginLeft: 12, padding: '13px 16px',
                background: isCurrent ? cardBgCurrent : cardBg,
                border: `1.5px solid ${isCurrent ? cardBorderCurrent : cardBorder}`,
                borderRadius: 12,
                boxShadow: dark
                  ? isCurrent ? '0 4px 16px rgba(99,102,241,0.12)' : '0 1px 6px rgba(0,0,0,0.3)'
                  : isCurrent ? '0 4px 16px rgba(99,102,241,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: textPrimary }}>
                        {event.title}
                      </span>
                      {isCurrent && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                          padding: '2px 8px', borderRadius: 999,
                          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                          color: '#fff', textTransform: 'uppercase',
                        }}>
                          Present
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: textLabel, marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {event.subtitle}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12, color: textSecondary, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: datePillBg, padding: '4px 10px', borderRadius: 8,
                    border: `1px solid ${datePillBorder}`,
                  }}>
                    <CalendarDays size={11} color={textSecondary} />
                    {event.dateRange}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
