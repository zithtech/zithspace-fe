import React, { useMemo } from 'react';
import { Typography, Tag, Empty, Spin, Avatar, Tooltip } from 'antd';
import {
    ClockCircleOutlined,
    EditOutlined,
    MessageOutlined,
    PlusCircleOutlined,
    CheckCircleOutlined,
    UserOutlined,
    FileOutlined,
    LinkOutlined,
    HistoryOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useTicketActivityLog } from '@/hooks/useTicketDetails';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';

const { Text } = Typography;

interface ActivityTimelineProps {
    ticketId: string;
}

interface ActionStyle {
    color: string;
    bg: string;
    icon: React.ReactNode;
    label: string;
}

const getActionStyle = (action: string): ActionStyle => {
    const iconStyle = { fontSize: 13 };
    if (action.includes('Created')) {
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: <PlusCircleOutlined style={iconStyle} />, label: 'Created' };
    }
    if (action.includes('Comment')) {
        return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: <MessageOutlined style={iconStyle} />, label: 'Commented' };
    }
    if (action.includes('Completed') || action.includes('Resolved')) {
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: <CheckCircleOutlined style={iconStyle} />, label: 'Completed' };
    }
    if (action.includes('Attachment')) {
        return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', icon: <FileOutlined style={iconStyle} />, label: 'Attachment' };
    }
    if (action.includes('Link')) {
        return { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', icon: <LinkOutlined style={iconStyle} />, label: 'Link' };
    }
    if (action.includes('Updated')) {
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', icon: <EditOutlined style={iconStyle} />, label: 'Updated' };
    }
    return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', icon: <ClockCircleOutlined style={iconStyle} />, label: action };
};

const formatChangeValue = (val: string) => {
    if (!val) return '—';
    return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const dateGroupLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d, yyyy');
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ ticketId }) => {
    const { data: activities, isLoading, isError } = useTicketActivityLog(ticketId);

    const grouped = useMemo(() => {
        if (!activities) return [] as Array<{ label: string; items: any[] }>;
        const map = new Map<string, any[]>();
        activities.forEach((a: any) => {
            const date = new Date(a.timestamp);
            const key = dateGroupLabel(date);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(a);
        });
        return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
    }, [activities]);

    if (isLoading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Spin tip="Loading history">
                    <div style={{ height: 40 }} />
                </Spin>
            </div>
        );
    }

    if (isError) {
        return (
            <div style={{ textAlign: 'center', padding: 32, color: '#ef4444', fontSize: 13 }}>
                Failed to load activity history.
            </div>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <div style={{ padding: 32 }}>
                <Empty
                    image={
                        <div style={{
                            width: 56, height: 56, margin: '0 auto', borderRadius: 16,
                            background: 'rgba(148, 163, 184, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <HistoryOutlined style={{ fontSize: 24, color: '#94a3b8' }} />
                        </div>
                    }
                    description={<Text type="secondary" style={{ fontSize: 13 }}>No activity recorded yet</Text>}
                />
            </div>
        );
    }

    const renderDetails = (activity: any) => {
        const { action, details } = activity;

        if (action === 'Ticket Created') {
            return (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {details?.status && (
                        <Tag bordered={false} color="blue" style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, margin: 0 }}>
                            {formatChangeValue(details.status)}
                        </Tag>
                    )}
                    {details?.priority && (
                        <Tag bordered={false} color="orange" style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, margin: 0 }}>
                            {formatChangeValue(details.priority)}
                        </Tag>
                    )}
                </div>
            );
        }

        if (action === 'Comment Added') {
            return (
                <div className="activity-comment-card" style={{ marginTop: 8 }}>
                    <div className="activity-comment-card__quote" />
                    <Text style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        {details?.contentPreview || 'Attachment only'}
                    </Text>
                </div>
            );
        }

        if (action === 'Ticket Updated' && Array.isArray(details?.changes)) {
            return (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {details.changes.map((change: string, idx: number) => {
                        const fromMatch = change.split(' from ');
                        if (fromMatch.length === 2) {
                            const [field, rest] = fromMatch;
                            const toMatch = rest.split(' to ');
                            if (toMatch.length === 2) {
                                return (
                                    <div key={idx} className="activity-change-row">
                                        <Text className="activity-change-row__field">{field}</Text>
                                        <Tag bordered={false} className="activity-change-row__tag activity-change-row__tag--from">
                                            {formatChangeValue(toMatch[0])}
                                        </Tag>
                                        <ArrowRightOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
                                        <Tag bordered={false} className="activity-change-row__tag activity-change-row__tag--to">
                                            {formatChangeValue(toMatch[1])}
                                        </Tag>
                                    </div>
                                );
                            }
                        }
                        return (
                            <div key={idx} className="activity-change-row">
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>• {change}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (details && Object.keys(details).length > 0) {
            return (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Object.entries(details).map(([key, value]: [string, any], idx) => {
                        if (key === 'changes') return null;
                        if (key === 'status' && action === 'Ticket Created') return null;
                        return (
                            <div key={idx} style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                                <span style={{ textTransform: 'capitalize' }}>{key}</span>:{' '}
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{String(value)}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="activity-timeline-v2">
            {grouped.map((group, gIdx) => (
                <div key={group.label} className="activity-timeline-v2__group">
                    <div className="activity-timeline-v2__day-divider">
                        <span className="activity-timeline-v2__day-label">{group.label}</span>
                        <span className="activity-timeline-v2__day-line" />
                    </div>

                    <div className="activity-timeline-v2__rail">
                        {group.items.map((activity: any, idx: number) => {
                            const style = getActionStyle(activity.action);
                            const isLast = gIdx === grouped.length - 1 && idx === group.items.length - 1;
                            const date = new Date(activity.timestamp);
                            const userName = activity.performedBy?.name || 'System';

                            return (
                                <div key={activity.id} className={`activity-event ${isLast ? 'is-last' : ''}`}>
                                    <div
                                        className="activity-event__dot"
                                        style={{ background: style.bg, color: style.color, boxShadow: `0 0 0 4px var(--bg-primary), 0 0 0 5px ${style.bg}` }}
                                    >
                                        {style.icon}
                                    </div>

                                    <div className="activity-event__card" style={{ borderLeft: `2px solid ${style.color}` }}>
                                        <div className="activity-event__head">
                                            <div className="activity-event__user">
                                                <Avatar
                                                    size={22}
                                                    icon={<UserOutlined />}
                                                    src={activity.performedBy?.avatar}
                                                    style={{
                                                        backgroundColor: activity.performedBy?.name ? '#3b82f6' : '#94a3b8',
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {userName.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Text strong className="activity-event__name">{userName}</Text>
                                                <span className="activity-event__action-pill" style={{ background: style.bg, color: style.color }}>
                                                    {style.label}
                                                </span>
                                            </div>
                                            <Tooltip title={format(date, 'MMM d, yyyy h:mm a')}>
                                                <Text className="activity-event__time">
                                                    {formatDistanceToNow(date, { addSuffix: true })}
                                                </Text>
                                            </Tooltip>
                                        </div>
                                        {renderDetails(activity)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <style jsx global>{`
                .activity-timeline-v2 {
                    padding: 8px 4px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }
                .activity-timeline-v2__day-divider {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0 4px;
                    margin-bottom: 8px;
                }
                .activity-timeline-v2__day-label {
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--text-slate-500);
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    padding: 3px 10px;
                    border-radius: 999px;
                }
                .activity-timeline-v2__day-line {
                    flex: 1;
                    height: 1px;
                    background: linear-gradient(90deg, var(--border-color), transparent);
                }
                .activity-timeline-v2__rail {
                    position: relative;
                    padding-left: 44px;
                }
                .activity-timeline-v2__rail::before {
                    content: '';
                    position: absolute;
                    left: 17px;
                    top: 4px;
                    bottom: 4px;
                    width: 2px;
                    background: linear-gradient(180deg, var(--border-color), transparent);
                    border-radius: 2px;
                }
                .activity-event {
                    position: relative;
                    margin-bottom: 14px;
                }
                .activity-event:last-child { margin-bottom: 0; }
                .activity-event__dot {
                    position: absolute;
                    left: -40px;
                    top: 8px;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.18s ease;
                }
                .activity-event:hover .activity-event__dot {
                    transform: scale(1.08);
                }
                .activity-event__card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-left-width: 2px;
                    border-radius: 10px;
                    padding: 10px 12px;
                    transition: all 0.18s ease;
                }
                .activity-event:hover .activity-event__card {
                    transform: translateX(2px);
                    box-shadow: 0 6px 16px -8px rgba(15, 23, 42, 0.18);
                }
                .activity-event__head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .activity-event__user {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 0;
                }
                .activity-event__name {
                    font-size: 12.5px;
                    color: var(--text-primary);
                    font-weight: 700;
                }
                .activity-event__action-pill {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 999px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    line-height: 1.4;
                }
                .activity-event__time {
                    font-size: 11px;
                    color: var(--text-slate-400);
                    white-space: nowrap;
                    cursor: default;
                }

                .activity-change-row {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 5px 10px;
                }
                .activity-change-row__field {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-slate-500);
                    text-transform: capitalize;
                    margin-right: 2px;
                }
                .activity-change-row__tag.ant-tag {
                    margin: 0 !important;
                    font-size: 11px;
                    font-weight: 600;
                    border-radius: 6px;
                    padding: 0 8px;
                    line-height: 18px;
                }
                .activity-change-row__tag--from.ant-tag {
                    background: rgba(148, 163, 184, 0.15);
                    color: var(--text-slate-500);
                    text-decoration: line-through;
                    text-decoration-color: rgba(148, 163, 184, 0.7);
                }
                .activity-change-row__tag--to.ant-tag {
                    background: rgba(16, 185, 129, 0.14);
                    color: #059669;
                }

                .activity-comment-card {
                    position: relative;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 0 10px 10px 10px;
                    padding: 10px 12px 10px 14px;
                }
                .activity-comment-card__quote {
                    position: absolute;
                    left: -1px;
                    top: -1px;
                    bottom: -1px;
                    width: 3px;
                    background: #3b82f6;
                    border-radius: 3px 0 0 3px;
                }
            `}</style>
        </div>
    );
};

export default ActivityTimeline;
