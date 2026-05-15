'use client';

import React, { useMemo } from 'react';
import { Skeleton, Tooltip } from 'antd';
import {
    FileTextOutlined,
    FolderOutlined,
    ProjectOutlined,
    UserOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import { DocumentHub } from '@/services/documentHub';

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
    const size = 44;
    const stroke = 4;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = total > 0 ? Math.min(weekCount / total, 1) : 0;
    const dash = c * pct;
    const display = weekCount > 99 ? '99+' : weekCount;

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
                    style={{ fontSize: 9.5, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.62)' }}
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
                                    background: v === 0 ? 'rgba(255,255,255,0.10)' : color,
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
                            color: i === peakIdx ? color : 'rgba(255,255,255,0.45)',
                        }}
                    >
                        {d}
                    </span>
                ))}
            </div>
            <div
                className="mt-2 text-center font-medium"
                style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.78)' }}
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
                style={{ borderTop: '1px solid rgba(255,255,255,0.10)', fontSize: 10.5 }}
            >
                <span style={{ color: 'rgba(255,255,255,0.62)' }}>Total</span>
                <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
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
                background: 'rgba(15, 23, 42, 0.96)',
                backdropFilter: 'blur(8px)',
                borderRadius: 10,
                padding: '10px 12px',
                boxShadow: '0 10px 32px rgba(15,23,42,0.28), 0 0 0 1px rgba(255,255,255,0.06)',
            }}
        >
            <div className="relative cursor-default" style={{ width: size, height: size }}>
                <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeOpacity={0.14}
                        strokeWidth={stroke}
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${c - dash}`}
                        style={{ transition: 'stroke-dasharray 400ms ease' }}
                    />
                </svg>
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ lineHeight: 1 }}
                >
                    <span
                        className="font-bold tracking-tight"
                        style={{ fontSize: 12, color, letterSpacing: '-0.02em' }}
                    >
                        {display}
                    </span>
                    <span
                        className="font-semibold uppercase"
                        style={{ fontSize: 7, color: 'var(--text-slate-400)', letterSpacing: '0.06em', marginTop: 1 }}
                    >
                        7d
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
                icon: <UserOutlined />,
                color: '#F59E0B',
                tint: 'rgba(245, 158, 11, 0.10)',
                trend: days.map((d) => usersByDay[dayKey(d)]),
            },
        ];
    }, [documentHubs]);

    if (isLoading) {
        return (
            <div
                className="flex items-center gap-0 mb-3 rounded-2xl overflow-hidden"
                style={{
                    border: '1px solid var(--border-slate-200)',
                    background: 'var(--bg-pure-white)',
                }}
            >
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-1 px-5 py-3" style={{ borderRight: i < 4 ? '1px solid var(--border-slate-200)' : 'none' }}>
                        <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            className="dh-stats-strip flex flex-col sm:flex-row items-stretch mb-3 rounded-2xl overflow-hidden"
            style={{
                border: '1px solid var(--border-slate-200)',
                background: 'var(--bg-pure-white)',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
        >
            {stats.map((s, i) => (
                <div
                    key={s.key}
                    className={`dh-stats-cell flex-1 flex items-center gap-2 lg:gap-3 px-3 lg:px-5 py-3 transition-colors ${i < stats.length - 1 ? 'dh-stats-cell-divider' : ''}`}
                    style={{ minWidth: 0 }}
                >
                    <div
                        className="flex items-center justify-center shrink-0 rounded-xl"
                        style={{
                            width: 38,
                            height: 38,
                            background: s.tint,
                            color: s.color,
                            fontSize: 16,
                        }}
                    >
                        {s.icon}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span
                            className="text-[9.5px] lg:text-[10.5px] font-semibold uppercase tracking-[0.08em] truncate"
                            style={{ color: 'var(--text-slate-400)' }}
                        >
                            {s.title}
                        </span>
                        <div className="flex flex-wrap items-baseline gap-1.5 lg:gap-2">
                            <span
                                className="text-[16px] lg:text-[22px] font-bold leading-none tracking-tight"
                                style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}
                            >
                                {s.value}
                            </span>
                            {'delta' in s && (s as any).delta > 0 && (
                                <Tooltip title="New this week">
                                    <span
                                        className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-[1px] rounded-full"
                                        style={{ background: s.tint, color: s.color }}
                                    >
                                        <RiseOutlined style={{ fontSize: 8 }} />+{(s as any).delta}
                                    </span>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                    <div className="shrink-0 hidden lg:block">
                        <WeekRing
                            title={s.title}
                            weekCount={s.trend.reduce((a, b) => a + b, 0)}
                            total={s.value}
                            color={s.color}
                            trend={s.trend}
                        />
                    </div>
                </div>
            ))}
            <style jsx>{`
                .dh-stats-cell:hover {
                    background: var(--bg-slate-50, #f8fafc);
                }
                :global([data-theme='dark']) .dh-stats-cell:hover {
                    background: rgba(255, 255, 255, 0.02);
                }
                /* Divider switches direction with the flex axis: vertical (right edge) on
                 * desktop row layout, horizontal (bottom edge) on mobile column layout. */
                .dh-stats-cell-divider {
                    border-bottom: 1px solid var(--border-slate-200);
                }
                @media (min-width: 640px) {
                    .dh-stats-cell-divider {
                        border-bottom: none;
                        border-right: 1px solid var(--border-slate-200);
                    }
                }
            `}</style>
        </div>
    );
};

export default DocumentHubDashboard;
