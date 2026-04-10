"use client";

import React from 'react';
import { Typography } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '@/services/calendarService';

const { Text, Title } = Typography;

interface DayViewProps {
    currentDate: Dayjs;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent, occurrenceDate?: Dayjs) => void;
    onTimeSlotClick: (date: Dayjs) => void;
}

export default function DayView({ currentDate, events, onEventClick, onTimeSlotClick }: DayViewProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getDayEvents = () => {
        const dayEvents = events.filter(e => {
            const start = dayjs(e.startTime);
            return start.isSame(currentDate, 'day');
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
            {/* Day Header */}
            <div style={{ 
                padding: '24px', 
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                background: '#fff',
                position: 'sticky',
                top: 0,
                zIndex: 20
            }}>
                <div style={{
                    width: '56px',
                    height: '56px',
                    background: currentDate.isSame(dayjs(), 'day') ? '#3b82f6' : '#f8fafc',
                    color: currentDate.isSame(dayjs(), 'day') ? '#fff' : '#1e293b',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 800,
                    border: currentDate.isSame(dayjs(), 'day') ? 'none' : '1px solid #e2e8f0',
                    boxShadow: currentDate.isSame(dayjs(), 'day') ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}>
                    {currentDate.date()}
                </div>
                <div>
                    <Text strong style={{ 
                        fontSize: '14px', 
                        color: currentDate.isSame(dayjs(), 'day') ? '#3b82f6' : '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '2px'
                    }}>
                        {currentDate.format('dddd')}
                    </Text>
                    <Title level={4} style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>
                        {currentDate.format('MMMM YYYY')}
                    </Title>
                </div>
            </div>

            {/* Time Grid */}
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', paddingBottom: '100px' }}>
                <div style={{ width: '80px', borderRight: '1px solid #f1f5f9', background: '#f8fafc', flexShrink: 0 }}>
                    {hours.map(hour => (
                        <div key={hour} style={{ height: '80px', padding: '12px 0', textAlign: 'center', position: 'relative' }}>
                            <Text style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                {dayjs().hour(hour).format('h A')}
                            </Text>
                        </div>
                    ))}
                </div>

                <div style={{ flex: 1, position: 'relative', minHeight: '1920px' }}>
                    {hours.map(hour => (
                        <div
                            key={hour}
                            onClick={() => onTimeSlotClick(currentDate.hour(hour).minute(0))}
                            style={{ 
                                height: '80px', 
                                borderBottom: '1px solid #f1f5f9', 
                                cursor: 'pointer',
                                transition: 'background 0.1s'
                            }}
                            className="time-slot-hover"
                        />
                    ))}

                    {/* Current time indicator */}
                    {currentDate.isSame(dayjs(), 'day') && (
                        <div style={{
                            position: 'absolute',
                            top: `${(dayjs().hour() + dayjs().minute() / 60) * 80}px`,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: '#ef4444',
                            zIndex: 5,
                            pointerEvents: 'none'
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: '-5px',
                                top: '-4px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#ef4444',
                                boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)'
                            }} />
                        </div>
                    )}

                    {getDayEvents().map((event, idx) => {
                        const start = dayjs(event.startTime);
                        const occurrenceStart = currentDate.hour(start.hour()).minute(start.minute()).second(start.second()).millisecond(start.millisecond());
                        
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
                                    top: `${(start.hour() + start.minute() / 60) * 80}px`,
                                    height: `${dayjs(event.endTime).diff(start, 'hour', true) * 80}px`,
                                    background: eventColors.bg,
                                    borderLeft: `5px solid ${eventColors.border}`,
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                }}
                                className="event-card-hover"
                            >
                                <div style={{ 
                                    fontWeight: 700, 
                                    fontSize: '15px',
                                    color: eventColors.text,
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px'
                                }}>
                                    {event.meetingLink && <VideoCameraOutlined style={{ fontSize: '18px' }} />}
                                    {event.title}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: eventColors.text, opacity: 0.8 }}>
                                    {dayjs(event.startTime).format('h:mm A')} - {dayjs(event.endTime).format('h:mm A')}
                                </div>
                                {event.description && (
                                    <Text ellipsis={true} style={{ fontSize: '13px', color: eventColors.text, opacity: 0.6, marginTop: '4px' }}>
                                        {event.description}
                                    </Text>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx global>{`
                .time-slot-hover:hover {
                    background: #f8fafc !important;
                }
                .event-card-hover:hover {
                    transform: scale(1.005);
                    box-shadow: 0 12px 20px rgba(0,0,0,0.1);
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
