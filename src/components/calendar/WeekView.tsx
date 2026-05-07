"use client";

import React, { useEffect, useRef, useState } from 'react';
import { VideoCameraOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '@/services/calendarService';

interface WeekViewProps {
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

const HOUR_HEIGHT = 56;

export default function WeekView({ currentDate, events, onEventClick, onTimeSlotClick }: WeekViewProps) {
    const startOfWeek = currentDate.startOf('week').add(1, 'day');
    const days = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
    const hours = Array.from({ length: 24 }, (_, i) => i);
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

    const getEventsForDay = (date: Dayjs) => {
        const dayEvents = events.filter(e => dayjs(e.startTime).isSame(date, 'day'));
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
            height: `${duration * HOUR_HEIGHT - 2}px`,
            left: 4,
            right: 4,
            position: 'absolute',
            background: `var(--cal-ev${ci}-bg)`,
            borderLeft: `3px solid var(--cal-ev${ci}-bar)`,
            borderRadius: 7,
            padding: '5px 8px',
            fontSize: 11,
            overflow: 'hidden',
            cursor: 'pointer',
            zIndex: 2,
            color: `var(--cal-ev${ci}-text)`,
            transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        };
    };

    const nowMinutes = now.hour() * 60 + now.minute();
    const nowTop = (nowMinutes / 60) * HOUR_HEIGHT;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--cal-surface)' }}>
            {/* Day header */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '64px repeat(7, 1fr)',
                    borderBottom: '1px solid var(--cal-border)',
                    background: 'var(--cal-surface-2)',
                }}
            >
                <div style={{ borderRight: '1px solid var(--cal-border-soft)' }} />
                {days.map((day, idx) => {
                    const isToday = day.isSame(dayjs(), 'day');
                    return (
                        <div
                            key={day.toString()}
                            style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                borderRight: idx < 6 ? '1px solid var(--cal-border-soft)' : 'none',
                            }}
                        >
                            <div style={{
                                fontSize: 11,
                                color: 'var(--cal-text-muted)',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                            }}>
                                {day.format('ddd').toUpperCase()}
                            </div>
                            <div
                                style={{
                                    marginTop: 6,
                                    width: 30,
                                    height: 30,
                                    margin: '6px auto 0',
                                    borderRadius: 999,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isToday ? 'var(--cal-brand)' : 'transparent',
                                    color: isToday ? '#FFFFFF' : 'var(--cal-text-strong)',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    boxShadow: isToday ? '0 2px 6px -1px rgba(79, 70, 229, 0.5)' : 'none',
                                }}
                            >
                                {day.date()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time grid */}
            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: '64px repeat(7, 1fr)',
                    position: 'relative',
                }}
            >
                <div style={{ borderRight: '1px solid var(--cal-border-soft)', position: 'relative' }}>
                    {hours.map(hour => (
                        <div
                            key={hour}
                            style={{
                                height: HOUR_HEIGHT,
                                position: 'relative',
                                paddingTop: 4,
                                textAlign: 'right',
                                paddingRight: 8,
                            }}
                        >
                            <span style={{ fontSize: 10, color: 'var(--cal-text-faint)', fontWeight: 600 }}>
                                {hour === 0 ? '' : dayjs().hour(hour).format('h A')}
                            </span>
                        </div>
                    ))}
                </div>

                {days.map((day, dayIdx) => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = day.isSame(dayjs(), 'day');
                    const colBg = isToday ? 'var(--cal-surface-3)' : 'var(--cal-surface)';
                    return (
                        <div
                            key={day.toString()}
                            style={{
                                borderRight: dayIdx < 6 ? '1px solid var(--cal-border-soft)' : 'none',
                                position: 'relative',
                                minHeight: HOUR_HEIGHT * 24,
                                background: colBg,
                            }}
                        >
                            {hours.map(hour => (
                                <div
                                    key={hour}
                                    onClick={() => onTimeSlotClick(day.hour(hour).minute(0))}
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

                            {/* Now line */}
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
                                            left: -5,
                                            top: -5,
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: '#EF4444',
                                            boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.18)',
                                        }}
                                    />
                                </div>
                            )}

                            {dayEvents.map((event, idx) => {
                                const start = dayjs(event.startTime);
                                const occurrenceStart = day
                                    .hour(start.hour())
                                    .minute(start.minute())
                                    .second(start.second())
                                    .millisecond(start.millisecond());
                                const ci = colorIndex(event);
                                return (
                                    <div
                                        key={`${event.id}-${idx}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event, occurrenceStart);
                                        }}
                                        style={getEventStyle(event)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = 'var(--cal-event-hover-shadow)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <div style={{
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            color: `var(--cal-ev${ci}-text)`,
                                        }}>
                                            {event.meetingLink && (
                                                <VideoCameraOutlined style={{ color: `var(--cal-ev${ci}-bar)`, fontSize: 11 }} />
                                            )}
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {event.title}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 10, opacity: 0.75, marginTop: 1 }}>
                                            {dayjs(event.startTime).format('h:mm')} – {dayjs(event.endTime).format('h:mm A')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
