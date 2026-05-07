"use client";

import React from 'react';
import { Button, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, PlusOutlined, CheckCircleFilled } from '@ant-design/icons';

interface CalendarToolbarProps {
    view: 'month' | 'week' | 'day';
    onViewChange: (view: 'month' | 'week' | 'day') => void;
    onNavigate: (direction: 'prev' | 'next' | 'today') => void;
    currentDateRange: string;
    onCreateEvent: () => void;
    provider?: string | null;
    providerName?: string;
    providerIcon?: React.ReactNode;
    providerColor?: string;
    eventCount?: number;
}

export default function CalendarToolbar({
    view,
    onViewChange,
    onNavigate,
    currentDateRange,
    onCreateEvent,
    provider,
    providerName,
    providerIcon,
    providerColor,
    eventCount = 0,
}: CalendarToolbarProps) {
    const views: Array<'month' | 'week' | 'day'> = ['day', 'week', 'month'];

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px 12px',
                background: 'transparent',
                gap: 16,
                flexWrap: 'wrap',
            }}
        >
            {/* Left: Title + connection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: 'var(--cal-text-strong)',
                            letterSpacing: '-0.02em',
                        }}>
                            Calendar
                        </span>
                        <ProviderPill
                            provider={provider}
                            name={providerName}
                            icon={providerIcon}
                            color={providerColor}
                        />
                    </div>
                    <div style={{ marginTop: 2, color: 'var(--cal-text-muted)', fontSize: 13 }}>
                        {provider
                            ? <>
                                <span style={{ fontWeight: 500, color: 'var(--cal-text-secondary)' }}>{eventCount}</span> event{eventCount === 1 ? '' : 's'} this view
                            </>
                            : 'Connect a calendar to begin'}
                    </div>
                </div>
            </div>

            {/* Center: Date navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Button
                    onClick={() => onNavigate('today')}
                    style={{ height: 36, borderRadius: 8, fontWeight: 500 }}
                >
                    Today
                </Button>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--cal-surface)',
                        border: '1px solid var(--cal-border)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        height: 36,
                    }}
                >
                    <Tooltip title="Previous">
                        <Button
                            icon={<LeftOutlined style={{ fontSize: 12 }} />}
                            onClick={() => onNavigate('prev')}
                            type="text"
                            style={{ height: 34, width: 34, border: 'none' }}
                        />
                    </Tooltip>
                    <div style={{ width: 1, height: 18, background: 'var(--cal-border)' }} />
                    <Tooltip title="Next">
                        <Button
                            icon={<RightOutlined style={{ fontSize: 12 }} />}
                            onClick={() => onNavigate('next')}
                            type="text"
                            style={{ height: 34, width: 34, border: 'none' }}
                        />
                    </Tooltip>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--cal-text-strong)' }}>
                    {currentDateRange}
                </span>
            </div>

            {/* Right: View switcher + CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SegmentedSwitcher value={view} onChange={onViewChange} options={views} />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onCreateEvent}
                    style={{
                        height: 36,
                        padding: '0 16px',
                        borderRadius: 8,
                        background: 'var(--cal-brand)',
                        borderColor: 'var(--cal-brand)',
                        boxShadow: '0 1px 2px rgba(79, 70, 229, 0.25), 0 4px 10px -3px rgba(79, 70, 229, 0.4)',
                        fontWeight: 600,
                    }}
                >
                    New event
                </Button>
            </div>
        </div>
    );
}

function SegmentedSwitcher({
    value,
    onChange,
    options,
}: {
    value: 'month' | 'week' | 'day';
    onChange: (v: 'month' | 'week' | 'day') => void;
    options: Array<'month' | 'week' | 'day'>;
}) {
    return (
        <div
            style={{
                display: 'inline-flex',
                background: 'var(--cal-segmented-bg)',
                padding: 3,
                borderRadius: 9,
                height: 36,
                border: '1px solid var(--cal-border)',
            }}
        >
            {options.map((opt) => {
                const active = value === opt;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        style={{
                            background: active ? 'var(--cal-segmented-thumb)' : 'transparent',
                            color: active ? 'var(--cal-text-strong)' : 'var(--cal-text-muted)',
                            border: 'none',
                            outline: 'none',
                            padding: '0 14px',
                            borderRadius: 7,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            boxShadow: active
                                ? '0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)'
                                : 'none',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

function ProviderPill({
    provider,
    name,
    icon,
    color,
}: {
    provider?: string | null;
    name?: string;
    icon?: React.ReactNode;
    color?: string;
}) {
    if (!provider) {
        return (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: 'var(--cal-danger-bg)',
                    color: 'var(--cal-danger-text)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    border: '1px solid var(--cal-danger-border)',
                }}
            >
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'currentColor',
                    }}
                />
                NOT CONNECTED
            </span>
        );
    }
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 999,
                background: 'var(--cal-success-bg)',
                color: 'var(--cal-success-text)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.02em',
                border: '1px solid var(--cal-success-border)',
            }}
        >
            <CheckCircleFilled style={{ color: 'currentColor', fontSize: 11 }} />
            <span style={{ color, display: 'inline-flex', alignItems: 'center', fontSize: 11 }}>
                {icon}
            </span>
            {name?.toUpperCase()}
        </span>
    );
}
