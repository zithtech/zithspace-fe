"use client";

import React, { useMemo } from 'react';
import { Calendar, Button, Tooltip } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { SyncOutlined, SettingOutlined, LeftOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { CalendarEvent } from '@/services/calendarService';

interface CalendarSidebarProps {
    onDateSelect: (date: Dayjs) => void;
    selectedDate: Dayjs;
    selectedCalendars: string[];
    onCalendarChange: (calendars: string[]) => void;
    provider?: string | null;
    onSync: () => Promise<void>;
    syncing: boolean;
    eventsForMonth?: CalendarEvent[];
}

const CALENDARS: Array<{ id: string; name: string; color: string }> = [
    { id: '1', name: 'Personal Calendar', color: '#6366F1' },
    { id: '2', name: 'Team Calendar', color: '#A855F7' },
    { id: '3', name: 'Company Holidays', color: '#F87171' },
    { id: '4', name: 'Approved Leaves', color: '#34D399' },
    { id: '5', name: 'Project Milestones', color: '#38BDF8' },
];

export default function CalendarSidebar({
    onDateSelect,
    selectedDate,
    selectedCalendars,
    onCalendarChange,
    provider,
    onSync,
    syncing,
    eventsForMonth = [],
}: CalendarSidebarProps) {
    const router = useRouter();

    const eventDays = useMemo(() => {
        const set = new Set<string>();
        eventsForMonth.forEach(e => {
            set.add(dayjs(e.startTime).format('YYYY-MM-DD'));
        });
        return set;
    }, [eventsForMonth]);

    const eventCountByCalendar = useMemo(() => {
        const counts: Record<string, number> = {};
        eventsForMonth.forEach(e => {
            const key = e.calendar || 'Personal Calendar';
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }, [eventsForMonth]);

    const handleToggleCalendar = (name: string) => {
        if (selectedCalendars.includes(name)) {
            onCalendarChange(selectedCalendars.filter(c => c !== name));
        } else {
            onCalendarChange([...selectedCalendars, name]);
        }
    };

    const providerLabel = provider
        ? provider === 'MICROSOFT'
            ? 'Outlook'
            : provider.charAt(0) + provider.slice(1).toLowerCase()
        : 'All';

    return (
        <div
            style={{
                padding: '20px 18px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                background: 'var(--cal-surface)',
            }}
        >
            {/* Mini calendar */}
            <div
                className="mini-calendar"
                style={{
                    border: '1px solid var(--cal-border)',
                    borderRadius: 14,
                    padding: 12,
                    background: 'var(--cal-surface)',
                    boxShadow: 'var(--cal-card-shadow)',
                }}
            >
                <Calendar
                    fullscreen={false}
                    value={selectedDate}
                    onSelect={onDateSelect}
                    headerRender={({ value, onChange }) => {
                        const month = value.format('MMMM');
                        const year = value.format('YYYY');
                        return (
                            <div style={{ padding: '2px 0 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button
                                    shape="circle"
                                    icon={<LeftOutlined style={{ fontSize: 11 }} />}
                                    size="small"
                                    onClick={() => onChange(value.clone().subtract(1, 'month'))}
                                    style={{
                                        border: 'none',
                                        background: 'var(--cal-segmented-bg)',
                                        color: 'var(--cal-text-muted)',
                                        width: 26,
                                        height: 26,
                                        minWidth: 26,
                                    }}
                                />
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cal-text-strong)' }}>
                                    {month} {year}
                                </span>
                                <Button
                                    shape="circle"
                                    icon={<RightOutlined style={{ fontSize: 11 }} />}
                                    size="small"
                                    onClick={() => onChange(value.clone().add(1, 'month'))}
                                    style={{
                                        border: 'none',
                                        background: 'var(--cal-segmented-bg)',
                                        color: 'var(--cal-text-muted)',
                                        width: 26,
                                        height: 26,
                                        minWidth: 26,
                                    }}
                                />
                            </div>
                        );
                    }}
                    fullCellRender={(date: Dayjs) => {
                        const isCurrentMonth = date.month() === selectedDate.month();
                        const isToday = date.isSame(dayjs(), 'day');
                        const isSelected = date.isSame(selectedDate, 'day');
                        const hasEvents = eventDays.has(date.format('YYYY-MM-DD'));

                        let background = 'transparent';
                        let color = isCurrentMonth ? 'var(--cal-text-secondary)' : 'var(--cal-text-disabled)';
                        if (isSelected) {
                            background = 'var(--cal-brand)';
                            color = '#FFFFFF';
                        } else if (isToday) {
                            background = 'var(--cal-brand-soft)';
                            color = 'var(--cal-brand)';
                        }

                        return (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDateSelect(date);
                                }}
                                style={{
                                    margin: '2px auto',
                                    width: 28,
                                    height: 28,
                                    lineHeight: '28px',
                                    textAlign: 'center',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    background,
                                    color,
                                    fontSize: 12,
                                    fontWeight: isSelected || isToday ? 600 : 500,
                                    position: 'relative',
                                    transition: 'background 0.15s ease',
                                }}
                            >
                                {date.date()}
                                {hasEvents && isCurrentMonth && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            bottom: 2,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: 4,
                                            height: 4,
                                            borderRadius: '50%',
                                            background: isSelected ? '#FFFFFF' : 'var(--cal-brand)',
                                            opacity: isSelected ? 0.9 : 0.85,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    }}
                    style={{ border: 'none', background: 'transparent' }}
                />
            </div>

            {/* Sync actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Button
                    block
                    icon={<SyncOutlined spin={syncing} />}
                    onClick={() => onSync()}
                    loading={syncing}
                    disabled={!provider}
                    style={{
                        height: 38,
                        borderRadius: 9,
                        background: 'var(--cal-brand-soft)',
                        borderColor: 'var(--cal-brand-soft-border)',
                        color: 'var(--cal-brand)',
                        fontWeight: 600,
                    }}
                >
                    Sync {providerLabel}
                </Button>
                <Button
                    block
                    icon={<SettingOutlined />}
                    onClick={() => router.push('/integrations')}
                    style={{
                        height: 38,
                        borderRadius: 9,
                        fontWeight: 500,
                    }}
                >
                    Manage integrations
                </Button>
            </div>

            {/* My calendars */}
            <div>
                <div
                    style={{
                        fontSize: 11,
                        color: 'var(--cal-text-faint)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: 12,
                        paddingLeft: 4,
                    }}
                >
                    My Calendars
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {CALENDARS.map((cal) => {
                        const checked = selectedCalendars.includes(cal.name);
                        const count = eventCountByCalendar[cal.name] || 0;
                        return (
                            <button
                                key={cal.id}
                                type="button"
                                onClick={() => handleToggleCalendar(cal.name)}
                                className="cal-list-item"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '8px 10px',
                                    borderRadius: 9,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                    transition: 'background 0.12s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cal-surface-hover)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                                <span
                                    style={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: 5,
                                        background: checked ? cal.color : 'transparent',
                                        border: `1.5px solid ${checked ? cal.color : 'var(--cal-text-disabled)'}`,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {checked && <CheckOutlined style={{ color: '#FFFFFF', fontSize: 9 }} />}
                                </span>
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: checked ? 'var(--cal-text-strong)' : 'var(--cal-text-muted)',
                                        fontWeight: 500,
                                        flex: 1,
                                    }}
                                >
                                    {cal.name}
                                </span>
                                {count > 0 && (
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: 'var(--cal-text-muted)',
                                            background: 'var(--cal-segmented-bg)',
                                            padding: '1px 7px',
                                            borderRadius: 999,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Subtle tip card */}
            <Tooltip title="Drag any time slot to create an event quickly">
                <div
                    style={{
                        marginTop: 'auto',
                        padding: 14,
                        borderRadius: 12,
                        background: 'var(--cal-tip-grad)',
                        border: '1px solid var(--cal-brand-soft-border)',
                    }}
                >
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cal-text-strong)', marginBottom: 4 }}>
                        Pro tip
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cal-text-muted)', lineHeight: 1.5 }}>
                        Click any day to schedule an event in seconds.
                    </div>
                </div>
            </Tooltip>
        </div>
    );
}
