'use client';

import React, { useMemo } from 'react';
import { Skeleton, Tooltip } from 'antd';
import {
    FileTextOutlined,
    FolderOutlined,
    ProjectOutlined,
    TeamOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import { DocumentHub } from '@/services/documentHub';
import { useTheme } from '@/context/ThemeContext';

interface DocumentHubDashboardProps {
    documentHubs: DocumentHub[];
    isLoading: boolean;
    onHubClick: (hubId: string) => void;
    onShareHub: (e: React.MouseEvent, hub: DocumentHub) => void;
}

const WeekRing: React.FC<{
    title: string;
    weekCount: number;
    total: number;
    color: string;
    trend: number[];
}> = ({ title, weekCount, total, color, trend }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const size = 44;
    const stroke = 4;
    const r = (size - stroke) / 2;
    const pct = total > 0 ? Math.min(weekCount / total, 1) : 0;

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date().getDay();
    const labels = Array.from({ length: trend.length }, (_, i) => {
        const idx = (today - (trend.length - 1 - i) + 7) % 7;
        return dayLabels[idx];
    });
    const maxDay = Math.max(...trend, 1);
    const peakIdx = trend.indexOf(Math.max(...trend));
    const activeDays = trend.filter((v) => v > 0).length;
    const summary =
        weekCount === 0
            ? 'No activity in the last 7 days'
            : `In ${activeDays} day${activeDays === 1 ? '' : 's'}, ${weekCount} added`;

    const tooltipBody = (
        <div style={{ minWidth: 188, padding: '2px 0' }}>
            <div className="flex items-center justify-between gap-3 mb-2">
                <span
                    className="font-semibold uppercase"
                    style={{
                        fontSize: 9.5,
                        letterSpacing: '0.08em',
                        color: isDark ? 'rgba(255,255,255,0.62)' : 'var(--text-slate-400, #94a3b8)',
                    }}
                >
                    {title}
                </span>
                <span
                    className="inline-flex items-center gap-1 font-bold px-1.5 py-[1px] rounded-full"
                    style={{ fontSize: 10, background: `${color}28`, color }}
                >
                    +{weekCount} · 7d
                </span>
            </div>
            <div className="flex items-end gap-[3px]" style={{ height: 28 }}>
                {trend.map((v, i) => {
                    const h = v === 0 ? 2 : Math.max(2, (v / maxDay) * 28);
                    const isPeak = i === peakIdx && v > 0;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    width: '100%',
                                    height: h,
                                    background: v === 0 ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15, 23, 42, 0.08)') : color,
                                    opacity: v === 0 ? 1 : isPeak ? 1 : 0.55,
                                    borderRadius: 2,
                                }}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-[3px] mt-1">
                {labels.map((d, i) => (
                    <span
                        key={i}
                        className="flex-1 text-center font-semibold"
                        style={{
                            fontSize: 9,
                            color: i === peakIdx ? color : (isDark ? 'rgba(255,255,255,0.45)' : 'var(--text-slate-400, #94a3b8)'),
                        }}
                    >
                        {d}
                    </span>
                ))}
            </div>
            <div
                className="mt-2 text-center font-medium"
                style={{
                    fontSize: 10.5,
                    color: isDark ? 'rgba(255,255,255,0.78)' : 'var(--text-slate-600, #475569)',
                }}
            >
                {weekCount === 0 ? (
                    summary
                ) : (
                    <>
                        In <span style={{ color, fontWeight: 700 }}>{activeDays} day{activeDays === 1 ? '' : 's'}</span>
                        ,{' '}
                        <span style={{ color, fontWeight: 700 }}>{weekCount}</span> added
                    </>
                )}
            </div>
            <div
                className="flex items-center justify-between mt-2 pt-2"
                style={{
                    borderTop: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid var(--border-slate-200, #e2e8f0)',
                    fontSize: 10.5,
                }}
            >
                <span style={{ color: isDark ? 'rgba(255,255,255,0.62)' : 'var(--text-slate-500, #64748b)' }}>Total</span>
                <span className="font-semibold" style={{ color: isDark ? 'rgba(255,255,255,0.92)' : 'var(--text-slate-800, #1e293b)' }}>
                    {total.toLocaleString()}
                    {total > 0 && (
                        <span style={{ color, marginLeft: 6 }}>
                            · {Math.round(pct * 100)}%
                        </span>
                    )}
                </span>
            </div>
        </div>
    );

    return (
        <Tooltip
            title={tooltipBody}
            placement="bottom"
            mouseEnterDelay={0.15}
            overlayInnerStyle={{
                background: isDark ? 'rgba(15, 23, 42, 0.96)' : '#ffffff',
                backdropFilter: 'blur(8px)',
                borderRadius: 10,
                padding: '10px 12px',
                boxShadow: isDark
                    ? '0 10px 32px rgba(15,23,42,0.28), 0 0 0 1px rgba(255,255,255,0.06)'
                    : '0 10px 32px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.08)',
            }}
        >
            <div className="relative cursor-default" style={{ width: size, height: size }}>
                <svg width={size} height={size} style={{ display: 'block' }}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke={isDark ? 'rgba(255,255,255,0.16)' : '#e2e8f0'}
                        strokeWidth={stroke}
                    />
                </svg>
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ lineHeight: 1 }}
                >
                    <span
                        className="font-semibold"
                        style={{
                            fontSize: 11,
                            color: isDark ? 'rgba(255,255,255,0.55)' : 'var(--text-slate-400, #94a3b8)',
                            letterSpacing: '0.02em',
                        }}
                    >
                        7D
                    </span>
                </div>
            </div>
        </Tooltip>
    );
};

const DocumentHubDashboard: React.FC<DocumentHubDashboardProps> = ({
    documentHubs,
    isLoading,
}) => {
    const stats = useMemo(() => {
        const totalHubs = documentHubs.length;
        const totalDocuments = documentHubs.reduce(
            (acc, hub) => acc + (hub.treeNodes?.filter((n) => n.type === 'file').length || 0),
            0
        );
        const projectLinked = documentHubs.filter((h) => h.projectId).length;
        const uniqueCreators = new Set(documentHubs.map((h) => h.createdById)).size;

        // Build 7-day creation trend per metric for sparklines.
        const days: Date[] = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - (6 - i));
            return d;
        });
        const dayKey = (d: Date) => d.toISOString().slice(0, 10);
        const hubsByDay = Object.fromEntries(days.map((d) => [dayKey(d), 0])) as Record<string, number>;
        const docsByDay = { ...hubsByDay };
        const projByDay = { ...hubsByDay };
        const usersByDay = { ...hubsByDay };
        documentHubs.forEach((hub) => {
            const k = dayKey(new Date(hub.updatedAt || hub.createdAt));
            if (k in hubsByDay) hubsByDay[k] += 1;
            if (k in projByDay && hub.projectId) projByDay[k] += 1;
            if (k in usersByDay) usersByDay[k] += 1;
            const docs = hub.treeNodes?.filter((n) => n.type === 'file').length || 0;
            if (k in docsByDay) docsByDay[k] += docs;
        });

        const weekHubs = days.reduce((s, d) => s + hubsByDay[dayKey(d)], 0);

        return [
            {
                key: 'hubs',
                title: 'Document Hubs',
                value: totalHubs,
                delta: weekHubs,
                icon: <FolderOutlined />,
                color: '#3B82F6',
                tint: 'rgba(59, 130, 246, 0.10)',
                trend: days.map((d) => hubsByDay[dayKey(d)]),
            },
            {
                key: 'docs',
                title: 'Total Documents',
                value: totalDocuments,
                icon: <FileTextOutlined />,
                color: '#10B981',
                tint: 'rgba(16, 185, 129, 0.10)',
                trend: days.map((d) => docsByDay[dayKey(d)]),
            },
            {
                key: 'projects',
                title: 'Project Linked',
                value: projectLinked,
                icon: <ProjectOutlined />,
                color: '#8B5CF6',
                tint: 'rgba(139, 92, 246, 0.10)',
                trend: days.map((d) => projByDay[dayKey(d)]),
            },
            {
                key: 'people',
                title: 'Contributors',
                value: uniqueCreators,
                icon: <TeamOutlined />,
                color: '#F59E0B',
                tint: 'rgba(245, 158, 11, 0.10)',
                trend: days.map((d) => usersByDay[dayKey(d)]),
            },
        ];
    }, [documentHubs]);

    if (isLoading) {
        return (
            <div className="dh-stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="rounded-xl px-4 py-3.5"
                        style={{
                            border: '1px solid var(--border-slate-200)',
                            background: 'var(--bg-pure-white)',
                        }}
                    >
                        <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="dh-stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {stats.map((s) => {
                const delta = s.trend.reduce((a, b) => a + b, 0);
                return (
                    <div
                        key={s.key}
                        className="dh-stats-card flex items-start gap-3 rounded-xl px-4 py-3.5 transition-all"
                        style={{
                            border: '1px solid var(--border-slate-200)',
                            background: 'var(--bg-pure-white)',
                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                        }}
                    >
                        <div
                            className="flex items-center justify-center shrink-0"
                            style={{
                                width: 34,
                                color: 'var(--text-slate-800, #1e293b)',
                                fontSize: 24,
                            }}
                        >
                            {s.icon}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span
                                className="text-[10px] lg:text-[10.5px] font-semibold uppercase tracking-[0.08em] truncate"
                                style={{ color: 'var(--text-slate-400)' }}
                            >
                                {s.title}
                            </span>
                            <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                                <span
                                    className="text-[20px] lg:text-[24px] font-bold leading-none tracking-tight"
                                    style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}
                                >
                                    {s.value}
                                </span>
                                {delta > 0 && (
                                    <Tooltip title="New this week">
                                        <span
                                            className="inline-flex items-center gap-0.5 text-[11px] font-bold"
                                            style={{ color: '#16a34a' }}
                                        >
                                            <RiseOutlined style={{ fontSize: 9 }} />+{delta}
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                        <div className="shrink-0">
                            <WeekRing
                                title={s.title}
                                weekCount={delta}
                                total={s.value}
                                color={s.color}
                                trend={s.trend}
                            />
                        </div>
                    </div>
                );
            })}
            <style jsx>{`
                .dh-stats-card:hover {
                    border-color: var(--border-slate-300, #cbd5e1);
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
                }
                :global([data-theme='dark']) .dh-stats-card:hover {
                    background: rgba(255, 255, 255, 0.02);
                }
            `}</style>
        </div>
    );
};

export default DocumentHubDashboard;
