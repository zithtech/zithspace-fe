"use client";

import React, { useEffect, useRef, useState } from 'react';
import { VideoCameraOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '@/services/calendarService';

interface DayViewProps {
    currentDate: Dayjs;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent, occurrenceDate?: Dayjs) => void;
    onTimeSlotClick: (date: Dayjs) => void;
}

const PALETTE_KEYS = [1, 2, 3, 4, 5, 6] as const;
const colorIndex = (e: CalendarEvent) => {
    const key = (e.calendar || e.id || 'x').toString();
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return PALETTE_KEYS[hash % PALETTE_KEYS.length];
};

const HOUR_HEIGHT = 64;

export default function DayView({ currentDate, events, onEventClick, onTimeSlotClick }: DayViewProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const isToday = currentDate.isSame(dayjs(), 'day');
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const [now, setNow] = useState(dayjs());
    useEffect(() => {
        const id = setInterval(() => setNow(dayjs()), 60_000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            const target = Math.max(0, (now.hour() - 1) * HOUR_HEIGHT);
            scrollRef.current.scrollTop = target;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getDayEvents = () => {
        const dayEvents = events.filter(e => dayjs(e.startTime).isSame(currentDate, 'day'));
        return dayEvents.filter(e => {
            const isMaster = e.isRecurring && e.rrule && !e.rrule.includes('seriesMasterId');
            if (isMaster) {
                const hasOccurrence = dayEvents.some(occ =>
                    occ.rrule && occ.rrule.includes(e.externalId)
                );
                return !hasOccurrence;
            }
            return true;
        });
    };

    const getEventStyle = (event: CalendarEvent): React.CSSProperties => {
        const start = dayjs(event.startTime);
        const end = dayjs(event.endTime);
        const startHour = start.hour() + start.minute() / 60;
        const duration = Math.max(0.5, end.diff(start, 'hour', true));
        const ci = colorIndex(event);

        return {
            top: `${startHour * HOUR_HEIGHT}px`,
            height: `${duration * HOUR_HEIGHT - 4}px`,
            left: 16,
            right: 16,
            position: 'absolute',
            background: `var(--cal-ev${ci}-bg)`,
            borderLeft: `4px solid var(--cal-ev${ci}-bar)`,
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13,
            overflow: 'hidden',
            cursor: 'pointer',
            zIndex: 2,
            color: `var(--cal-ev${ci}-text)`,
            boxShadow: 'var(--cal-event-shadow)',
            transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        };
    };

    const dayEvents = getDayEvents();
    const nowMinutes = now.hour() * 60 + now.minute();
    const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--cal-surface)' }}>
            {/* Day header */}
            <div
                style={{
                    padding: '20px 28px',
                    borderBottom: '1px solid var(--cal-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--cal-surface-2)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            background: isToday
                                ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
                                : 'var(--cal-surface)',
                            color: isToday ? '#FFFFFF' : 'var(--cal-text-strong)',
                            border: isToday ? 'none' : '1px solid var(--cal-border)',
                            borderRadius: 14,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isToday
                                ? '0 8px 16px -4px rgba(79, 70, 229, 0.4)'
                                : 'var(--cal-card-shadow)',
                        }}
                    >
                        <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, letterSpacing: '0.06em' }}>
                            {currentDate.format('MMM').toUpperCase()}
                        </span>
                        <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
                            {currentDate.date()}
                        </span>
                    </div>
                    <div>
                        <div style={{
                            margin: 0,
                            color: 'var(--cal-text-strong)',
                            fontWeight: 700,
                            letterSpacing: '-0.01em',
                            fontSize: 20,
                        }}>
                            {currentDate.format('dddd')}
                        </div>
                        <div style={{ color: 'var(--cal-text-muted)', fontSize: 13 }}>
                            {currentDate.format('MMMM D, YYYY')} · {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
                        </div>
                    </div>
                </div>
                {isToday && (
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--cal-success-text)',
                            background: 'var(--cal-success-bg)',
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: '1px solid var(--cal-success-border)',
                            letterSpacing: '0.04em',
                        }}
                    >
                        TODAY
                    </span>
                )}
            </div>

            {/* Time grid */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex' }}>
                <div style={{ width: 72, borderRight: '1px solid var(--cal-border-soft)', flexShrink: 0 }}>
                    {hours.map(hour => (
                        <div
                            key={hour}
                            style={{
                                height: HOUR_HEIGHT,
                                paddingTop: 4,
                                textAlign: 'right',
                                paddingRight: 10,
                            }}
                        >
                            <span style={{ fontSize: 10, color: 'var(--cal-text-faint)', fontWeight: 600 }}>
                                {hour === 0 ? '' : dayjs().hour(hour).format('h A')}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ flex: 1, position: 'relative', minHeight: HOUR_HEIGHT * 24 }}>
                    {hours.map(hour => (
                        <div
                            key={hour}
                            onClick={() => onTimeSlotClick(currentDate.hour(hour).minute(0))}
                            style={{
                                height: HOUR_HEIGHT,
                                borderBottom: '1px solid var(--cal-border-soft)',
                                cursor: 'pointer',
                                transition: 'background 0.12s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cal-surface-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        />
                    ))}

                    {isToday && (
                        <div
                            style={{
                                position: 'absolute',
                                top: nowTop,
                                left: 0,
                                right: 0,
                                height: 0,
                                borderTop: '2px solid #EF4444',
                                zIndex: 3,
                                pointerEvents: 'none',
                            }}
                        >
                            <span
                                style={{
                                    position: 'absolute',
                                    left: -6,
                                    top: -6,
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    background: '#EF4444',
                                    boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.18)',
                                }}
                            />
                            <span
                                style={{
                                    position: 'absolute',
                                    left: 16,
                                    top: -10,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#EF4444',
                                    background: 'var(--cal-surface)',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    letterSpacing: '0.03em',
                                }}
                            >
                                {now.format('h:mm A')}
                            </span>
                        </div>
                    )}

                    {dayEvents.map((event, idx) => {
                        const start = dayjs(event.startTime);
                        const occurrenceStart = currentDate
                            .hour(start.hour())
                            .minute(start.minute())
                            .second(start.second())
                            .millisecond(start.millisecond());
                        const ci = colorIndex(event);
                        return (
                            <div
                                key={`${event.id}-${idx}`}
                                style={getEventStyle(event)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEventClick(event, occurrenceStart);
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = 'var(--cal-event-hover-shadow-strong)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'var(--cal-event-shadow)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    {event.meetingLink && (
                                        <VideoCameraOutlined style={{ fontSize: 14, color: `var(--cal-ev${ci}-bar)` }} />
                                    )}
                                    <span style={{ fontSize: 14, color: `var(--cal-ev${ci}-text)`, fontWeight: 700 }}>
                                        {event.title}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: `var(--cal-ev${ci}-text)`, opacity: 0.85, fontWeight: 500 }}>
                                    {dayjs(event.startTime).format('h:mm A')} – {dayjs(event.endTime).format('h:mm A')}
                                </div>
                                {event.location && (
                                    <div style={{
                                        fontSize: 11,
                                        color: `var(--cal-ev${ci}-text)`,
                                        opacity: 0.8,
                                        marginTop: 6,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}>
                                        <EnvironmentOutlined style={{ fontSize: 11 }} />
                                        {event.location}
                                    </div>
                                )}
                                {event.meetingLink && (
                                    <a
                                        href={event.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            marginTop: 8,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: `var(--cal-ev${ci}-bar)`,
                                            background: 'var(--cal-meeting-btn-bg)',
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            border: `1px solid var(--cal-ev${ci}-bar)`,
                                        }}
                                    >
                                        <VideoCameraOutlined /> Join meeting
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
