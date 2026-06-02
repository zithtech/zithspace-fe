"use client";

import React from 'react';
import { VideoCameraOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '@/services/calendarService';

interface MonthViewProps {
    currentDate: Dayjs;
    events: CalendarEvent[];
    onTimeSlotClick?: (date: Dayjs) => void;
    onEventClick: (event: CalendarEvent, occurrenceDate?: Dayjs) => void;
    onMoreClick?: (date: Dayjs) => void;
}

const PALETTE_KEYS = [1, 2, 3, 4, 5, 6] as const;
const colorIndex = (e: CalendarEvent) => {
    const key = (e.calendar || e.id || 'x').toString();
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return PALETTE_KEYS[hash % PALETTE_KEYS.length];
};

export default function MonthView({ currentDate, events, onTimeSlotClick, onEventClick, onMoreClick }: MonthViewProps) {
    const startOfMonth = currentDate.startOf('month');
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const rows: Dayjs[][] = [];
    let currentRow: Dayjs[] = [];
    const firstDayOfMonth = startOfMonth.day();
    const daysToShift = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const gridStart = startOfMonth.subtract(daysToShift, 'day');

    let d = gridStart;
    for (let i = 0; i < 42; i++) {
        currentRow.push(d);
        if (currentRow.length === 7) {
            rows.push(currentRow);
            currentRow = [];
        }
        d = d.add(1, 'day');
    }

    const formatTime = (iso: string) => dayjs(iso).format('h:mm A');

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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--cal-surface)' }}>
            {/* Weekday header */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    background: 'var(--cal-surface-2)',
                    borderBottom: '1px solid var(--cal-border)',
                }}
            >
                {dayNames.map((name, idx) => (
                    <div
                        key={name}
                        style={{
                            padding: '12px 0',
                            textAlign: 'center',
                            borderRight: idx < 6 ? '1px solid var(--cal-border-soft)' : 'none',
                        }}
                    >
                        <span style={{
                            fontSize: 11,
                            color: 'var(--cal-text-muted)',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                        }}>
                            {name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {rows.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                            borderBottom: rowIndex < 5 ? '1px solid var(--cal-border-soft)' : 'none',
                            minHeight: 110,
                        }}
                    >
                        {row.map((date, colIndex) => {
                            const isCurrentMonth = date.isSame(currentDate, 'month');
                            const isToday = date.isSame(dayjs(), 'day');
                            const isWeekend = date.day() === 0 || date.day() === 6;
                            const dayEvents = getEventsForDay(date);
                            const visible = dayEvents.length > 3 ? dayEvents.slice(0, 2) : dayEvents.slice(0, 3);
                            const overflow = dayEvents.length - visible.length;

                            const cellBg = isCurrentMonth
                                ? (isWeekend ? 'var(--cal-surface-3)' : 'var(--cal-surface)')
                                : 'var(--cal-surface-2)';

                            return (
                                <div
                                    key={date.toString()}
                                    onClick={() => onTimeSlotClick?.(date)}
                                    className="month-cell"
                                    style={{
                                        borderRight: colIndex < 6 ? '1px solid var(--cal-border-soft)' : 'none',
                                        padding: '8px 8px 6px',
                                        background: cellBg,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4,
                                        position: 'relative',
                                        transition: 'background 0.15s ease',
                                        overflow: 'hidden',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cal-surface-hover)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = cellBg)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                                        <div
                                            onClick={(ev) => {
                                                ev.stopPropagation();
                                                onMoreClick?.(date);
                                            }}
                                            style={{
                                                minWidth: 24,
                                                height: 24,
                                                padding: '0 7px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 999,
                                                background: isToday ? 'var(--cal-brand)' : 'transparent',
                                                color: isToday
                                                    ? '#FFFFFF'
                                                    : (isCurrentMonth ? 'var(--cal-text-strong)' : 'var(--cal-text-disabled)'),
                                                fontSize: 12,
                                                fontWeight: isToday ? 700 : 600,
                                                boxShadow: isToday ? '0 2px 6px -1px rgba(79, 70, 229, 0.5)' : 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {date.date()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'relative', zIndex: 2 }}>
                                        {visible.map((e, idx) => {
                                            const start = dayjs(e.startTime);
                                            const occurrenceDate = date
                                                .hour(start.hour())
                                                .minute(start.minute())
                                                .second(start.second())
                                                .millisecond(start.millisecond());
                                            const ci = colorIndex(e);

                                            return (
                                                <div
                                                    key={`${e.id}-${idx}`}
                                                    onClick={(ev) => {
                                                        ev.stopPropagation();
                                                        onEventClick(e, occurrenceDate);
                                                    }}
                                                    style={{
                                                        background: `var(--cal-ev${ci}-bg)`,
                                                        borderLeft: `3px solid var(--cal-ev${ci}-bar)`,
                                                        borderRadius: 6,
                                                        padding: '3px 7px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 5,
                                                        overflow: 'hidden',
                                                        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                                                    }}
                                                    onMouseEnter={(ev) => {
                                                        ev.currentTarget.style.transform = 'translateX(1px)';
                                                        ev.currentTarget.style.boxShadow = 'var(--cal-event-shadow)';
                                                    }}
                                                    onMouseLeave={(ev) => {
                                                        ev.currentTarget.style.transform = 'translateX(0)';
                                                        ev.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    {e.meetingLink && (
                                                        <VideoCameraOutlined
                                                            onClick={(ev) => {
                                                                ev.stopPropagation();
                                                                if (typeof e.meetingLink === "string") {
                                                                    window.open(e.meetingLink, "_blank", "noopener,noreferrer");
                                                                }
                                                            }}
                                                            style={{ fontSize: 10, color: `var(--cal-ev${ci}-bar)`, flexShrink: 0 }}
                                                        />
                                                    )}
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            color: `var(--cal-ev${ci}-text)`,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            fontWeight: 600,
                                                        }}
                                                        className="event-tag"
                                                    >
                                                        <span style={{ opacity: 0.7, fontWeight: 500 }}>
                                                            {formatTime(e.startTime)}
                                                        </span>
                                                        {' '}
                                                        {e.title}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {overflow > 0 && (
                                            <div
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    onMoreClick?.(date);
                                                }}
                                                style={{
                                                    fontSize: 11,
                                                    color: 'var(--cal-brand)',
                                                    fontWeight: 700,
                                                    padding: '2px 7px',
                                                    cursor: 'pointer',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                                            >
                                                +{overflow} more
                                            </div>
                                        )}
                                    </div>

                                    </div>
                                    
                                    
                                );
                            })}
                        </div>
                    ))}
                </div>
         

            <style jsx global>{`
                .month-cell:hover {
                    background: var(--cal-surface-hover) !important;
                }
                .event-tag:hover {
                    transform: scale(1.02);
                    filter: brightness(0.98);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
