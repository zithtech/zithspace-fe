import React from 'react';
import { Timeline, Typography, Tag, Empty, Spin, Avatar, Space } from 'antd';
import {
    ClockCircleOutlined,
    EditOutlined,
    MessageOutlined,
    PlusCircleOutlined,
    CheckCircleOutlined,
    UserOutlined,
    FileOutlined,
    LinkOutlined
} from '@ant-design/icons';
import { useTicketActivityLog } from '@/hooks/useTicketDetails';
import { format } from 'date-fns';

const { Text, Title } = Typography;

interface ActivityTimelineProps {
    ticketId: string;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ ticketId }) => {
    const { data: activities, isLoading, isError } = useTicketActivityLog(ticketId);

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
            <div style={{ padding: 20, textAlign: 'center' }}>
                <Spin tip="Loading history">
                    <div style={{ height: 40 }} />
                </Spin>
            </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center p-8 text-red-500">
                Failed to load activity history.
            </div>
        );
    }

    if (!activities || activities.length === 0) {
        return <Empty description="No activity recorded yet" />;
    }

    const getIcon = (action: string) => {
        const style = { fontSize: 14 };
        if (action.includes('Created')) return <div className="p-1 rounded-full bg-green-50 flex items-center justify-center"><PlusCircleOutlined style={{ ...style, color: '#52c41a' }} /></div>;
        if (action.includes('Comment')) return <div className="p-1 rounded-full bg-blue-50 flex items-center justify-center"><MessageOutlined style={{ ...style, color: '#1890ff' }} /></div>;
        if (action.includes('Updated')) return <div className="p-1 rounded-full bg-orange-50 flex items-center justify-center"><EditOutlined style={{ ...style, color: '#faad14' }} /></div>;
        if (action.includes('Completed') || action.includes('Resolved')) return <div className="p-1 rounded-full bg-green-50 flex items-center justify-center"><CheckCircleOutlined style={{ ...style, color: '#52c41a' }} /></div>;
        if (action.includes('Attachment')) return <div className="p-1 rounded-full bg-purple-50 flex items-center justify-center"><FileOutlined style={{ ...style, color: '#722ed1' }} /></div>;
        if (action.includes('Link')) return <div className="p-1 rounded-full bg-cyan-50 flex items-center justify-center"><LinkOutlined style={{ ...style, color: '#13c2c2' }} /></div>;
        return <div className="p-1 rounded-full bg-gray-50 flex items-center justify-center"><ClockCircleOutlined style={{ ...style, color: '#bfbfbf' }} /></div>;
    };

    const getColor = (action: string) => {
        if (action.includes('Created')) return '#52c41a';
        if (action.includes('Comment')) return '#1890ff';
        if (action.includes('Updated')) return '#faad14';
        if (action.includes('Attachment')) return '#722ed1';
        if (action.includes('Link')) return '#13c2c2';
        return '#bfbfbf';
    };

    const renderDetails = (activity: any) => {
        const { action, details } = activity;

        if (action === 'Ticket Created') {
            return (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <Tag bordered={false} color="blue" style={{ fontSize: 11, borderRadius: 4 }}>Status: {details.status}</Tag>
                    <Tag bordered={false} color="orange" style={{ fontSize: 11, borderRadius: 4 }}>Priority: {details.priority}</Tag>
                </div>
            )
        }

        if (action === 'Comment Added') {
            return (
                <div style={{
                    fontSize: 13,
                    color: '#595959',
                    fontStyle: 'italic',
                    padding: '8px 12px',
                    backgroundColor: '#fafafa',
                    borderRadius: '0 8px 8px 8px',
                    borderLeft: '3px solid #1890ff',
                    marginTop: 6,
                    lineHeight: 1.5
                }}>
                    {details.contentPreview || 'Attachment only'}
                </div>
            )
        }

        if (action === 'Ticket Updated' && details.changes && Array.isArray(details.changes)) {
            return (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {details.changes.map((change: string, idx: number) => {
                        // Try to highlight "from" and "to" patterns
                        const parts = change.split(' from ');
                        if (parts.length === 2) {
                            const [field, rest] = parts;
                            const restParts = rest.split(' to ');
                            if (restParts.length === 2) {
                                return (
                                    <div key={idx} style={{ fontSize: 13, color: '#595959', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Text strong style={{ fontSize: 12 }}>{field}:</Text>
                                        <Text delete type="secondary" style={{ fontSize: 12 }}>{restParts[0]}</Text>
                                        <Text style={{ fontSize: 12, color: '#8c8c8c' }}>→</Text>
                                        <Text style={{ fontSize: 12, color: '#262626', fontWeight: 500 }}>{restParts[1]}</Text>
                                    </div>
                                );
                            }
                        }
                        return <div key={idx} style={{ fontSize: 13, color: '#595959' }}>• {change}</div>;
                    })}
                </div>
            )
        }

        if (details && Object.keys(details).length > 0) {
            return (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(details).map(([key, value]: [string, any], idx) => {
                        if (key === 'changes' || key === 'status' && action === 'Ticket Created') return null;
                        return (
                            <div key={idx} style={{ fontSize: 12, color: '#8c8c8c' }}>
                                <span style={{ textTransform: 'capitalize' }}>{key}</span>: <span style={{ color: '#595959' }}>{String(value)}</span>
                            </div>
                        )
                    })}
                </div>
            )
        }

        return null;
    };

    const items = activities.map((activity: any, index: number) => {
        const isLatest = index === 0;
        return {
            key: activity.id,
            color: getColor(activity.action),
            dot: getIcon(activity.action),
            children: (
                <div style={{
                    paddingBottom: index === activities.length - 1 ? 8 : 24,
                    opacity: isLatest ? 1 : 0.85,
                    borderBottom: '1px solid #f9f9f9',
                    marginBottom: 16
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar
                                size={22}
                                icon={<UserOutlined />}
                                src={activity.performedBy?.avatar}
                                style={{
                                    backgroundColor: activity.performedBy?.name ? '#1890ff' : '#bfbfbf',
                                    fontSize: 11
                                }}
                            >
                                {activity.performedBy?.name?.charAt(0) || 'S'}
                            </Avatar>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Text strong style={{ fontSize: 13, color: '#262626' }}>
                                        {activity.performedBy?.name || 'System'}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {activity.action}
                                    </Text>
                                </div>
                            </div>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, color: '#bfbfbf' }}>
                            {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                        </Text>
                    </div>
                    <div style={{ paddingLeft: 30 }}>
                        {renderDetails(activity)}
                    </div>
                </div>
            )
        };
    });

    return (
        <div style={{ padding: '0 8px' }}>
            <Timeline
                items={items}
                className="activity-timeline-premium"
            />
            <style jsx global>{`
                .activity-timeline-premium {
                    padding-top: 12px;
                }
                .activity-timeline-premium .ant-timeline-item-tail {
                    left: 14px !important;
                    border-inline-start: 1.5px solid #f0f0f0 !important;
                }
                .activity-timeline-premium .ant-timeline-item-head {
                    left: 14px !important;
                    background: transparent !important;
                    border: none !important;
                    padding: 0 !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: auto !important;
                    height: auto !important;
                    margin-top: -2px;
                }
                .activity-timeline-premium .ant-timeline-item-content {
                    margin-inline-start: 32px !important;
                    padding-bottom: 0 !important;
                    top: -4px !important;
                }
            `}</style>
        </div>
    );
};

export default ActivityTimeline;
