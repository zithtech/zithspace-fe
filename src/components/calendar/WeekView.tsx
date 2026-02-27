"use client";

import React from 'react';
import { Typography } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '@/services/calendarService';

const { Text } = Typography;

interface WeekViewProps {
    currentDate: Dayjs;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent, occurrenceDate?: Dayjs) => void;
    onTimeSlotClick: (date: Dayjs) => void;
}

export default function WeekView({ currentDate, events, onEventClick, onTimeSlotClick }: WeekViewProps) {
    const startOfWeek = currentDate.startOf('week').add(1, 'day'); // Monday start
    const days = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getEventsForDay = (date: Dayjs) => {
        return events.filter(e => {
            const start = dayjs(e.startTime);

            // 1. Exclusion check ALWAYS happens first
            if (e.exdate) {
                const excludedDates = Array.isArray(e.exdate) ? e.exdate : (typeof e.exdate === 'string' ? e.exdate.split(',') : []);
                if (excludedDates.some(ex => {
                    const cleanEx = ex.replace(/[^0-9TZ]/g, '');
                    let exDate;
                    if (cleanEx.length === 8) {
                        exDate = dayjs(cleanEx.replace(/^(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"));
                    } else {
                        const iso = cleanEx.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/, "$1-$2-$3T$4:$5:$6Z");
                        exDate = dayjs(iso);
                    }
                    return exDate.isValid() && exDate.isSame(date, 'day');
                })) {
                    return false;
                }
            }

            // 2. Direct match
            if (start.isSame(date, 'day')) return true;

            // 3. Recurrence check
            if (e.isRecurring || e.rrule?.includes('DAILY')) {
                const isAfterStart = date.isAfter(start, 'day');
                if (!isAfterStart) return false;

                if (e.rrule?.includes('UNTIL=')) {
                    const untilStr = e.rrule.split('UNTIL=')[1].split(';')[0];
                    const untilDate = dayjs(untilStr);
                    return date.isBefore(untilDate, 'day') || date.isSame(untilDate, 'day');
                }
                return true;
            }
            return false;
        });
    };

    const getEventStyle = (event: CalendarEvent) => {
        const start = dayjs(event.startTime);
        const end = dayjs(event.endTime);
        const startHour = start.hour() + start.minute() / 60;
        const duration = end.diff(start, 'hour', true);

        return {
            top: `${startHour * 60}px`,
            height: `${duration * 60}px`,
            left: '4px',
            right: '4px',
            position: 'absolute' as const,
            background: '#e6f4ff',
            borderLeft: '3px solid #1677ff',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '11px',
            overflow: 'hidden',
            cursor: 'pointer',
            zIndex: 2,
        };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ borderRight: '1px solid #f0f0f0' }} />
                {days.map(day => (
                    <div key={day.toString()} style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                        <Text type="secondary" strong style={{ fontSize: '12px' }}>{day.format('ddd').toUpperCase()}</Text>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            color: day.isSame(dayjs(), 'day') ? '#1677ff' : '#262626',
                            marginTop: '4px'
                        }}>
                            {day.date()}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', position: 'relative' }}>
                <div style={{ borderRight: '1px solid #f0f0f0' }}>
                    {hours.map(hour => (
                        <div key={hour} style={{ height: '60px', padding: '12px 0', textAlign: 'center', position: 'relative' }}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>{dayjs().hour(hour).format('h A')}</Text>
                        </div>
                    ))}
                </div>

                {days.map(day => {
                    const dayEvents = getEventsForDay(day);
                    return (
                        <div key={day.toString()} style={{ borderRight: '1px solid #f0f0f0', position: 'relative', minHeight: '1440px' }}>
                            {hours.map(hour => (
                                <div
                                    key={hour}
                                    onClick={() => onTimeSlotClick(day.hour(hour).minute(0))}
                                    style={{ height: '60px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                                />
                            ))}

                            {dayEvents.map((event, idx) => {
                                const start = dayjs(event.startTime);
                                const occurrenceStart = day.hour(start.hour()).minute(start.minute()).second(start.second()).millisecond(start.millisecond());
                                return (
                                    <div
                                        key={`${event.id}-${idx}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event, occurrenceStart);
                                        }}
                                        style={getEventStyle(event)}
                                    >
                                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {event.meetingLink && <VideoCameraOutlined style={{ color: '#1677ff' }} />}
                                            {event.title}
                                        </div>
                                        <div style={{ fontSize: '10px', opacity: 0.7 }}>
                                            {dayjs(event.startTime).format('HH:mm')} - {dayjs(event.endTime).format('HH:mm')}
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
