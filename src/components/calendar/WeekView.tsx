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
            {/* Week Header */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '80px repeat(7, 1fr)', 
                borderBottom: '1px solid #f1f5f9',
                background: '#fff',
                position: 'sticky',
                top: 0,
                zIndex: 20
            }}>
                <div style={{ borderRight: '1px solid #f1f5f9' }} />
                {days.map(day => {
                    const isToday = day.isSame(dayjs(), 'day');
                    return (
                        <div key={day.toString()} style={{ 
                            padding: '16px 8px', 
                            textAlign: 'center', 
                            borderRight: '1px solid #f1f5f9',
                            background: isToday ? '#eff6ff' : 'transparent'
                        }}>
                            <Text strong style={{ 
                                fontSize: '11px', 
                                color: isToday ? '#3b82f6' : '#64748b', 
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                {day.format('ddd')}
                            </Text>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: isToday ? '#3b82f6' : '#1e293b',
                                marginTop: '4px',
                                lineHeight: 1
                            }}>
                                {day.date()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Grid */}
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', position: 'relative', paddingBottom: '100px' }}>
                <div style={{ borderRight: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    {hours.map(hour => (
                        <div key={hour} style={{ height: '60px', padding: '8px 0', textAlign: 'center', position: 'relative' }}>
                            <Text style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                {dayjs().hour(hour).format('h A')}
                            </Text>
                        </div>
                    ))}
                </div>

                {days.map(day => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = day.isSame(dayjs(), 'day');
                    
                    return (
                        <div key={day.toString()} style={{ 
                            borderRight: '1px solid #f1f5f9', 
                            position: 'relative', 
                            minHeight: '1440px',
                            background: isToday ? '#fcfdff' : 'transparent'
                        }}>
                            {/* Hour horizontal lines */}
                            {hours.map(hour => (
                                <div
                                    key={hour}
                                    onClick={() => onTimeSlotClick(day.hour(hour).minute(0))}
                                    style={{ 
                                        height: '60px', 
                                        borderBottom: '1px solid #f1f5f9', 
                                        cursor: 'pointer',
                                        transition: 'background 0.1s'
                                    }}
                                    className="time-slot-hover"
                                />
                            ))}

                            {/* Current time indicator */}
                            {isToday && (
                                <div style={{
                                    position: 'absolute',
                                    top: `${(dayjs().hour() + dayjs().minute() / 60) * 60}px`,
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: '#ef4444',
                                    zIndex: 5,
                                    pointerEvents: 'none'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: '-4px',
                                        top: '-3px',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#ef4444'
                                    }} />
                                </div>
                            )}

                            {dayEvents.map((event, idx) => {
                                const start = dayjs(event.startTime);
                                const occurrenceStart = day.hour(start.hour()).minute(start.minute()).second(start.second()).millisecond(start.millisecond());
                                
                                const eventColors = {
                                    bg: '#eff6ff',
                                    border: '#3b82f6',
                                    text: '#1d4ed8'
                                };

                                return (
                                    <div
                                        key={`${event.id}-${idx}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event, occurrenceStart);
                                        }}
                                        style={{
                                            ...getEventStyle(event),
                                            background: eventColors.bg,
                                            borderLeft: `4px solid ${eventColors.border}`,
                                            borderRadius: '6px',
                                            padding: '6px 10px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            transition: 'all 0.1s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '2px'
                                        }}
                                        className="event-card-hover"
                                    >
                                        <div style={{ 
                                            fontWeight: 700, 
                                            fontSize: '12px',
                                            color: eventColors.text,
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '4px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {event.meetingLink && <VideoCameraOutlined style={{ fontSize: '12px' }} />}
                                            {event.title}
                                        </div>
                                        <div style={{ fontSize: '10px', fontWeight: 500, color: eventColors.text, opacity: 0.8 }}>
                                            {dayjs(event.startTime).format('h:mm A')} - {dayjs(event.endTime).format('h:mm A')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            <style jsx global>{`
                .time-slot-hover:hover {
                    background: #f8fafc !important;
                }
                .event-card-hover:hover {
                    transform: translateX(2px);
                    filter: brightness(0.98);
                    z-index: 10;
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
