"use client";

import React from 'react';
import { Calendar, Badge, Checkbox, Typography, Divider, Button, Spin, Tag } from 'antd';
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
    onSync: () => Promise<void>;
    syncing: boolean;
}

export default function CalendarSidebar({
    onDateSelect,
    selectedDate,
    selectedCalendars,
    onCalendarChange,
    provider,
    onSync,
    syncing
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
        <div style={{ padding: '16px', background: '#fff', height: '100%', borderRight: '1px solid #f0f0f0' }}>
            <div className="mini-calendar" style={{
                marginBottom: '16px',
                border: '1px solid #f0f0f0',
                borderRadius: '16px',
                padding: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <Calendar
                    fullscreen={false}
                    value={selectedDate}
                    onSelect={onDateSelect}
                    headerRender={({ value, onChange }) => {
                        const month = value.format('MMMM');
                        const year = value.format('YYYY');
                        return (
                            <div style={{ padding: '4px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button
                                    shape="circle"
                                    icon={<span>&lt;</span>}
                                    size="small"
                                    onClick={() => onChange(value.clone().subtract(1, 'month'))}
                                    style={{ border: 'none', background: '#f5f5f5', color: '#8c8c8c' }}
                                />
                                <Text strong style={{ fontSize: '14px' }}>{month} {year}</Text>
                                <Button
                                    shape="circle"
                                    icon={<span>&gt;</span>}
                                    size="small"
                                    onClick={() => onChange(value.clone().add(1, 'month'))}
                                    style={{ border: 'none', background: '#f5f5f5', color: '#8c8c8c' }}
                                />
                            </div>
                        );
                    }}
                    fullCellRender={(date: Dayjs) => {
                        const isCurrentMonth = date.month() === selectedDate.month();
                        if (!isCurrentMonth) return <div style={{ height: '28px' }} />;
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
                                    width: '28px',
                                    height: '28px',
                                    lineHeight: '28px',
                                    textAlign: 'center',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    background: isSelected ? '#2f69e3' : (isToday ? '#e6f4ff' : 'transparent'),
                                    color: isSelected ? '#fff' : (isToday ? '#1677ff' : '#262626'),
                                    fontWeight: isSelected || isToday ? 600 : 400
                                }}
                            >
                                {date.date()}
                            </div>
                        );
                    }}
                    style={{ border: 'none' }}
                />
            </div>

            <style jsx global>{`
                .mini-calendar .ant-picker-calendar-header {
                    padding: 0;
                }
                .mini-calendar .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-calendar-date {
                    background: #2f69e3 !important;
                    border-radius: 12px;
                    color: #fff !important;
                }
                .mini-calendar .ant-picker-calendar-date {
                    margin: 0 auto !important;
                    width: 32px !important;
                    height: 32px !important;
                    line-height: 32px !important;
                    border-top: none !important;
                }
                .mini-calendar .ant-picker-content th {
                    color: #8c8c8c;
                    font-weight: 500;
                    padding-bottom: 8px !important;
                }
            `}</style>


            <Divider />

            <div className="calendar-integrations" style={{ marginBottom: '24px' }}>
                <Title level={5} style={{ fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Calendar Integrations
                </Title>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button
                        block
                        icon={<SyncOutlined spin={syncing} />}
                        onClick={() => onSync()}
                        loading={syncing}
                    >
                        Sync {provider ? (provider === 'MICROSOFT' ? 'Outlook' : provider.charAt(0) + provider.slice(1).toLowerCase()) : 'All'}
                    </Button>
                    <Button
                        block
                        type="dashed"
                        icon={<SettingOutlined />}
                        onClick={() => router.push('/integrations')}
                    >
                        Manage Integrations
                    </Button>
                </div>
            </div>

            <Divider />
            <div className="calendar-list">
                <Title level={5} style={{ fontSize: '12px', color: '#8c8c8c', textTransform: 'uppercase', marginBottom: '16px' }}>
                    My Calendars
                </Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {calendars.map(cal => (
                        <div key={cal.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Checkbox
                                checked={selectedCalendars.includes(cal.name)}
                                onChange={(e) => handleToggleCalendar(cal.name, e.target.checked)}
                            />
                            <Badge color={cal.color} />
                            <Text style={{ fontSize: '14px' }}>{cal.name}</Text>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
