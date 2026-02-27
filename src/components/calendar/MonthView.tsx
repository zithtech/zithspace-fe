"use client";

import React from 'react';
import { Typography, Badge, Space } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '@/services/calendarService';

const { Text } = Typography;

interface MonthViewProps {
    currentDate: Dayjs;
    events: CalendarEvent[];
    onDayClick: (date: Dayjs) => void;
    onEventClick: (event: CalendarEvent, occurrenceDate?: Dayjs) => void;
}

export default function MonthView({ currentDate, events, onDayClick, onEventClick }: MonthViewProps) {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startOfGrid = startOfMonth.startOf('week'); // Assumes Sunday start
    const endOfGrid = endOfMonth.endOf('week');

    const days = [];
    let day = startOfGrid;
    while (day.isBefore(endOfGrid) || day.isSame(endOfGrid, 'day')) {
        days.push(day);
        day = day.add(1, 'day');
    }

    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    // Re-adjust startOfGrid logic if week starts on Monday
    // In reference it seems week starts on Monday
    const adjustedStartOfGrid = startOfMonth.startOf('week').add(1, 'day');
    if (startOfMonth.day() === 0) { // If it's Sunday, startOf('week') gives Sunday. 
        // We want Monday.
    }

    // Let's use simplified grid for now and align with dayNames
    const rows = [];
    let currentRow = [];

    // Real logic for Monday-start week:
    const firstDayOfMonth = startOfMonth.day(); // 0=Sun, 1=Mon...
    const daysToShift = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const gridStart = startOfMonth.subtract(daysToShift, 'day');

    let d = gridStart;
    for (let i = 0; i < 42; i++) { // 6 weeks
        currentRow.push(d);
        if (currentRow.length === 7) {
            rows.push(currentRow);
            currentRow = [];
        }
        d = d.add(1, 'day');
    }

    const formatTime = (iso: string) => {
        return dayjs(iso).format('h:mm A');
    };

    const getEventsForDay = (date: Dayjs) => {
        return events.filter(e => {
            const start = dayjs(e.startTime);

            // 1. Exclusion check ALWAYS happens first (to handle deleting the first day of a series)
            if (e.exdate) {
                const excludedDates = Array.isArray(e.exdate) ? e.exdate : (typeof e.exdate === 'string' ? e.exdate.split(',') : []);
                // Check if matches the day exactly using dayjs to handle timezones
                if (excludedDates.some(ex => {
                    const cleanEx = ex.replace(/[^0-9TZ]/g, '');
                    let exDate;
                    if (cleanEx.length === 8) {
                        exDate = dayjs(cleanEx.replace(/^(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"));
                    } else {
                        // Extract T-part to form ISO: yyyyMMddTHHmmssZ -> yyyy-MM-ddTHH:mm:ssZ
                        const iso = cleanEx.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/, "$1-$2-$3T$4:$5:$6Z");
                        exDate = dayjs(iso);
                    }
                    const isMatch = exDate.isValid() && exDate.isSame(date, 'day');
                    if (isMatch) console.log(`[Calendar] Hiding excluded occurrence of "${e.title}" for ${date.format('YYYY-MM-DD')} (match: ${ex})`);
                    return isMatch;
                })) {
                    return false;
                }
            }

            // 2. Direct match on start time
            if (start.isSame(date, 'day')) return true;

            // 3. Handle recurrence expansion for DAILY events
            if (e.isRecurring || e.rrule?.includes('DAILY')) {
                const isAfterStart = date.isAfter(start, 'day');
                if (!isAfterStart) return false;

                // If rrule contains UNTIL, check it
                if (e.rrule?.includes('UNTIL=')) {
                    const untilStr = e.rrule.split('UNTIL=')[1].split(';')[0];
                    const untilDate = dayjs(untilStr);
                    return date.isBefore(untilDate, 'day') || date.isSame(untilDate, 'day');
                }

                // If not excluded and after start, show it
                return true;
            }
            return false;
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f0f2f5' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#fff' }}>
                {dayNames.map(name => (
                    <div key={name} style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                        <Text type="secondary" strong style={{ fontSize: '12px' }}>{name}</Text>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', flex: 1, background: '#fff' }}>
                {rows.map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '120px' }}>
                        {row.map((date, colIndex) => {
                            const isCurrentMonth = date.isSame(currentDate, 'month');
                            const isToday = date.isSame(dayjs(), 'day');
                            const dayEvents = getEventsForDay(date);

                            return (
                                <div
                                    key={date.toString()}
                                    onClick={() => onDayClick(date)}
                                    style={{
                                        borderRight: '1px solid #f0f0f0',
                                        borderBottom: '1px solid #f0f0f0',
                                        padding: '8px',
                                        background: isCurrentMonth ? '#fff' : '#fafafa',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    className="calendar-cell"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '4px' }}>
                                        <div style={{
                                            width: '28px',
                                            height: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            background: isToday ? '#1677ff' : 'transparent',
                                            color: isToday ? '#fff' : (isCurrentMonth ? '#262626' : '#bfbfbf'),
                                            fontSize: '14px',
                                            fontWeight: isToday ? 600 : 400
                                        }}>
                                            {date.date()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'hidden' }}>
                                        {getEventsForDay(date).map((e, idx) => {
                                            const start = dayjs(e.startTime);
                                            const occurrenceDate = date.hour(start.hour()).minute(start.minute()).second(start.second()).millisecond(start.millisecond());

                                            return (
                                                <div
                                                    key={`${e.id}-${idx}`}
                                                    onClick={(ev) => {
                                                        ev.stopPropagation();
                                                        onEventClick(e, occurrenceDate);
                                                    }}
                                                    style={{
                                                        background: '#e6f4ff',
                                                        borderLeft: '3px solid #1677ff',
                                                        borderRadius: '4px',
                                                        padding: '2px 6px',
                                                        marginBottom: '2px',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            overflow: 'hidden',
                                                            width: '100%',
                                                        }}
                                                    >
                                                        {e.meetingLink && (
                                                            <VideoCameraOutlined
                                                                style={{
                                                                    fontSize: '12px',
                                                                    color: '#52c41a',
                                                                    flexShrink: 0,
                                                                    cursor: 'pointer',
                                                                    transition: 'transform 0.2s',
                                                                }}
                                                                onClick={(ev) => {
                                                                    ev.stopPropagation();
                                                                    if (typeof e.meetingLink === "string") {
                                                                        window.open(e.meetingLink, "_blank", "noopener,noreferrer");
                                                                    }
                                                                }}
                                                                onMouseEnter={(ev) => (ev.currentTarget.style.transform = 'scale(1.2)')}
                                                                onMouseLeave={(ev) => (ev.currentTarget.style.transform = 'scale(1)')}
                                                            />
                                                        )}
                                                        <Text ellipsis style={{ fontSize: '11px', color: '#0958d9' }}>
                                                            {formatTime(e.startTime)} {e.title}
                                                        </Text>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
