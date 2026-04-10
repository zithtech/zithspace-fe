"use client";

import React from 'react';
import { Calendar, Badge, Checkbox, Typography, Divider, Button, Spin, Tag, Space } from 'antd';
import type { CalendarMode } from 'antd/es/calendar/generateCalendar';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { SyncOutlined, SettingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface CalendarSidebarProps {
    onDateSelect: (date: Dayjs) => void;
    selectedDate: Dayjs;
    selectedCalendars: string[];
    onCalendarChange: (calendars: string[]) => void;
    // Provider-specific props
    provider?: string | null;
}

export default function CalendarSidebar({
    onDateSelect,
    selectedDate,
    selectedCalendars,
    onCalendarChange,
    provider,
}: CalendarSidebarProps) {
    const router = useRouter();
    const calendars = [
        { id: '1', name: 'Personal Calendar', color: '#1677ff' },
        { id: '2', name: 'Team Calendar', color: '#722ed1' },
        { id: '3', name: 'Company Holidays', color: '#f5222d' },
        { id: '4', name: 'Approved Leaves', color: '#52c41a' },
        { id: '5', name: 'Project Milestones', color: '#1890ff' },
    ];

    const handleToggleCalendar = (name: string, checked: boolean) => {
        if (checked) {
            onCalendarChange([...selectedCalendars, name]);
        } else {
            onCalendarChange(selectedCalendars.filter(c => c !== name));
        }
    };

    return (
        <div className="no-scrollbar" style={{ padding: '16px 12px', background: 'transparent', height: '100%', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto' }}>
            <div className="mini-calendar" style={{
                padding: '4px',
            }}>
                <Calendar
                    fullscreen={false}
                    value={selectedDate}
                    onSelect={onDateSelect}
                    headerRender={({ value, onChange }) => {
                        const month = value.format('MMMM');
                        const year = value.format('YYYY');
                        return (
                            <div style={{ padding: '0 8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong style={{ fontSize: '15px', color: '#1e293b' }}>{month} {year}</Text>
                                <Space size={4}>
                                    <Button
                                        shape="circle"
                                        icon={<span style={{ fontSize: '10px' }}>&lt;</span>}
                                        size="small"
                                        onClick={() => onChange(value.clone().subtract(1, 'month'))}
                                        style={{ border: 'none', background: 'transparent', color: '#64748b' }}
                                        className="hover-bg"
                                    />
                                    <Button
                                        shape="circle"
                                        icon={<span style={{ fontSize: '10px' }}>&gt;</span>}
                                        size="small"
                                        onClick={() => onChange(value.clone().add(1, 'month'))}
                                        style={{ border: 'none', background: 'transparent', color: '#64748b' }}
                                        className="hover-bg"
                                    />
                                </Space>
                            </div>
                        );
                    }}
                    fullCellRender={(date: Dayjs) => {
                        const isCurrentMonth = date.month() === selectedDate.month();
                        const isToday = date.isSame(dayjs(), 'day');
                        const isSelected = date.isSame(selectedDate, 'day');
                        
                        return (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDateSelect(date);
                                }}
                                style={{
                                    margin: '0 auto',
                                    width: '32px',
                                    height: '32px',
                                    lineHeight: '32px',
                                    textAlign: 'center',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: isSelected ? '#3b82f6' : 'transparent',
                                    color: isSelected ? '#fff' : (isToday ? '#3b82f6' : (isCurrentMonth ? '#475569' : '#cbd5e1')),
                                    fontWeight: isSelected || isToday ? 600 : 400,
                                    fontSize: '13px',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                                className={!isSelected ? "calendar-day-hover" : ""}
                            >
                                {date.date()}
                                {isToday && !isSelected && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '4px',
                                        height: '4px',
                                        borderRadius: '50%',
                                        background: '#3b82f6'
                                    }} />
                                )}
                            </div>
                        );
                    }}
                    style={{ border: 'none', background: 'transparent' }}
                />
            </div>

            <style jsx global>{`
                .mini-calendar .ant-picker-calendar-header {
                    padding: 0;
                }
                .mini-calendar .ant-picker-content th {
                    color: #94a3b8;
                    font-weight: 600;
                    font-size: 11px;
                    padding-bottom: 12px !important;
                }
                .hover-bg:hover {
                    background: #f1f5f9 !important;
                }
                .calendar-day-hover:hover {
                    background: #f8fafc;
                    color: #1e293b;
                }
                .ant-checkbox-checked .ant-checkbox-inner {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Title level={5} style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        My Calendars
                    </Title>
                    <SettingOutlined style={{ color: '#94a3b8', cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {calendars.map(cal => (
                        <div key={cal.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                            <Checkbox
                                checked={selectedCalendars.includes(cal.name)}
                                onChange={(e) => handleToggleCalendar(cal.name, e.target.checked)}
                                style={{
                                    '--antd-wave-shadow-color': cal.color,
                                } as any}
                            />
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cal.color, flexShrink: 0 }} />
                            <Text style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>{cal.name}</Text>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
