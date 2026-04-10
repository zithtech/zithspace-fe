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
        const dayEvents = events.filter(e => {
            const start = dayjs(e.startTime);
            return start.isSame(date, 'day');
        });

        // Deduplicate: If an occurrence for a series exists, hide the master record
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
            {/* Header */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                {dayNames.map(name => (
                    <div key={name} style={{ padding: '12px', textAlign: 'center' }}>
                        <Text strong style={{ fontSize: '11px', color: '#64748b', letterSpacing: '0.05em' }}>{name}</Text>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px', minHeight: 0 }}>
                <div style={{ display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', flex: 1, minHeight: '100%' }}>
                    {rows.map((row, rowIndex) => (
                        <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '133px' }}>
                            {row.map((date: Dayjs, colIndex: number) => {
                                const isCurrentMonth = date.isSame(currentDate, 'month');
                                const isToday = date.isSame(dayjs(), 'day');
                                const dayEvents = getEventsForDay(date);

                                return (
                                    <div
                                        key={date.toString()}
                                        onClick={() => onDayClick(date)}
                                        style={{
                                            borderRight: '1px solid #f1f5f9',
                                            borderBottom: '1px solid #f1f5f9',
                                            padding: '10px',
                                            background: isCurrentMonth ? '#fff' : '#fafafa',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        className="month-cell"
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '6px',
                                                background: isToday ? '#3b82f6' : 'transparent',
                                                color: isToday ? '#fff' : (isCurrentMonth ? '#475569' : '#cbd5e1'),
                                                fontSize: '13px',
                                                fontWeight: isToday ? 700 : 500
                                            }}>
                                                {date.date()}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {dayEvents.map((e, idx) => {
                                                const start = dayjs(e.startTime);
                                                const occurrenceDate = date.hour(start.hour()).minute(start.minute()).second(start.second()).millisecond(start.millisecond());
                                                
                                                // Determine event color (SaaS palette)
                                                const eventColors = {
                                                    bg: '#eff6ff',
                                                    border: '#3b82f6',
                                                    text: '#1d4ed8'
                                                };

                                                return (
                                                    <div
                                                        key={`${e.id}-${idx}`}
                                                        onClick={(ev) => {
                                                            ev.stopPropagation();
                                                            onEventClick(e, occurrenceDate);
                                                        }}
                                                        style={{
                                                            background: eventColors.bg,
                                                            borderLeft: `3px solid ${eventColors.border}`,
                                                            borderRadius: '4px',
                                                            padding: '4px 8px',
                                                            cursor: 'pointer',
                                                            transition: 'transform 0.1s',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                        className="event-tag"
                                                    >
                                                        {e.meetingLink && (
                                                            <VideoCameraOutlined
                                                                style={{
                                                                    fontSize: '12px',
                                                                    color: eventColors.border,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        )}
                                                        <Text ellipsis style={{ 
                                                            fontSize: '11px', 
                                                            color: eventColors.text,
                                                            fontWeight: 600,
                                                            maxWidth: '100%'
                                                        }}>
                                                            {formatTime(e.startTime)} {e.title}
                                                        </Text>
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

            <style jsx global>{`
                .month-cell:hover {
                    background: #f8fafc !important;
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
