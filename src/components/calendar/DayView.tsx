"use client";

import React from 'react';
import { Typography } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { ZohoEvent } from '@/services/zohoCalendarService';

const { Text, Title } = Typography;

interface DayViewProps {
    currentDate: Dayjs;
    events: ZohoEvent[];
    onEventClick: (event: ZohoEvent, occurrenceDate?: Dayjs) => void;
    onTimeSlotClick: (date: Dayjs) => void;
}

export default function DayView({ currentDate, events, onEventClick, onTimeSlotClick }: DayViewProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getDayEvents = () => {
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
                    return exDate.isValid() && exDate.isSame(currentDate, 'day');
                })) {
                    return false;
                }
            }

            // 2. Direct match
            if (start.isSame(currentDate, 'day')) return true;

            // 3. Recurrence check
            if (e.isRecurring || e.rrule?.includes('DAILY')) {
                const isAfterStart = currentDate.isAfter(start, 'day');
                if (!isAfterStart) return false;

                if (e.rrule?.includes('UNTIL=')) {
                    const untilStr = e.rrule.split('UNTIL=')[1].split(';')[0];
                    const untilDate = dayjs(untilStr);
                    return currentDate.isBefore(untilDate, 'day') || currentDate.isSame(untilDate, 'day');
                }
                return true;
            }
            return false;
        });
    };

    const getEventStyle = (event: ZohoEvent) => {
        const start = dayjs(event.startTime);
        const end = dayjs(event.endTime);
        const startHour = start.hour() + start.minute() / 60;
        const duration = end.diff(start, 'hour', true);

        return {
            top: `${startHour * 60}px`,
            height: `${duration * 60}px`,
            left: '12px',
            right: '12px',
            position: 'absolute' as const,
            background: '#e6f4ff',
            borderLeft: '4px solid #1677ff',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            overflow: 'hidden',
            cursor: 'pointer',
            zIndex: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    background: currentDate.isSame(dayjs(), 'day') ? '#1677ff' : '#f5f5f5',
                    color: currentDate.isSame(dayjs(), 'day') ? '#fff' : '#262626',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 600
                }}>
                    {currentDate.date()}
                </div>
                <div>
                    <Title level={4} style={{ margin: 0 }}>{currentDate.format('dddd')}</Title>
                    <Text type="secondary">{currentDate.format('MMMM D, YYYY')}</Text>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex' }}>
                <div style={{ width: '80px', borderRight: '1px solid #f0f0f0', flexShrink: 0 }}>
                    {hours.map(hour => (
                        <div key={hour} style={{ height: '60px', padding: '12px 0', textAlign: 'center', position: 'relative' }}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>{dayjs().hour(hour).format('h A')}</Text>
                        </div>
                    ))}
                </div>

                <div style={{ flex: 1, position: 'relative', minHeight: '1440px' }}>
                    {hours.map(hour => (
                        <div
                            key={hour}
                            onClick={() => onTimeSlotClick(currentDate.hour(hour).minute(0))}
                            style={{ height: '60px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                        />
                    ))}

                    {getDayEvents().map((event, idx) => {
                        const start = dayjs(event.startTime);
                        const occurrenceStart = currentDate.hour(start.hour()).minute(start.minute()).second(start.second()).millisecond(start.millisecond());
                        return (
                            <div key={`${event.id}-${idx}`} style={getEventStyle(event)} onClick={(e) => {
                                e.stopPropagation();
                                onEventClick(event, occurrenceStart);
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    {event.meetingLink && <VideoCameraOutlined style={{ fontSize: '16px', color: '#52c41a' }} />}
                                    <Text strong style={{ fontSize: '16px', color: '#003a8c' }}>{event.title}</Text>
                                </div>
                                <div style={{ fontSize: '13px', opacity: 0.8 }}>
                                    {dayjs(event.startTime).format('h:mm A')} - {dayjs(event.endTime).format('h:mm A')}
                                </div>
                                {event.meetingLink && (
                                    <div style={{ marginTop: '8px' }}>
                                        <a
                                            href={event.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: '#52c41a',
                                                fontWeight: 600,
                                                fontSize: '13px'
                                            }}
                                        >
                                            <VideoCameraOutlined /> Join Zoho Meeting
                                        </a>
                                    </div>
                                )}
                                {event.location && (
                                    <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '4px' }}>
                                        📍 {event.location}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
