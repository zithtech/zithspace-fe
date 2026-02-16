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
                <Spin tip="Loading history..." />
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
        const style = { fontSize: 16 };
        if (action.includes('Created')) return <PlusCircleOutlined style={{ ...style, color: '#52c41a' }} />; // Green
        if (action.includes('Comment')) return <MessageOutlined style={{ ...style, color: '#1890ff' }} />; // Blue
        if (action.includes('Updated')) return <EditOutlined style={{ ...style, color: '#faad14' }} />; // Orange
        if (action.includes('Completed') || action.includes('Resolved')) return <CheckCircleOutlined style={{ ...style, color: '#52c41a' }} />; // Green
        if (action.includes('Attachment')) return <FileOutlined style={{ ...style, color: '#722ed1' }} />; // Purple
        if (action.includes('Link')) return <LinkOutlined style={{ ...style, color: '#13c2c2' }} />; // Cyan
        return <ClockCircleOutlined style={{ ...style, color: '#bfbfbf' }} />; // Grey
    };

    const getColor = (action: string) => {
        if (action.includes('Created')) return 'green';
        if (action.includes('Comment')) return 'blue';
        if (action.includes('Updated')) return 'orange';
        if (action.includes('Attachment')) return 'purple';
        if (action.includes('Link')) return 'cyan';
        return 'gray';
    };

    const renderDetails = (activity: any) => {
        const { action, details } = activity;

        if (action === 'Ticket Created') {
            return (
                <div className="text-sm text-gray-500 mt-1">
                    Ticket created with status <Tag>{details.status}</Tag> and priority <Tag>{details.priority}</Tag>
                </div>
            )
        }

        if (action === 'Comment Added') {
            return (
                <div className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3 mt-2 bg-gray-50 py-1 rounded-r">
                    "{details.contentPreview || 'Attachment only'}"
                </div>
            )
        }

        if (action === 'Ticket Updated' && details.changes) {
            return (
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1 pl-1">
                    {details.changes.map((change: string, idx: number) => (
                        <li key={idx}>{change}</li>
                    ))}
                </ul>
            )
        }

        if (Object.keys(details).length > 0) {
            // Clean formatted details for file uploads/links if applicable, 
            // but fallback to JSON if complex.
            // For simple updates not caught above:
            return (
                <div className="text-sm text-gray-500 mt-1">
                    {JSON.stringify(details).replace(/["{}]/g, '').replace(/:/g, ': ').replace(/,/g, ', ')}
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
            label: (
                <div style={{ marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </Text>
                </div>
            ),
            children: (
                <div className={`pb-6 ${isLatest ? 'opacity-100' : 'opacity-80 hover:opacity-100 transition-opacity'}`}>
                    <div className="flex flex-col">
                        <Space align="center" className="mb-1">
                            <Avatar
                                size={24}
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: activity.performedBy?.name ? '#1890ff' : '#d9d9d9',
                                    fontSize: 12
                                }}
                            >
                                {activity.performedBy?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Text strong style={{ fontSize: 14 }}>
                                {activity.performedBy?.name || 'System'}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {activity.action}
                            </Text>
                        </Space>
                        <div style={{ paddingLeft: 32 }}>
                            {renderDetails(activity)}
                        </div>
                    </div>
                </div>
            )
        };
    });

    return (
        <div className="p-6 bg-white rounded-lg">
            <Timeline
                mode="alternate"
                items={items}
                className="activity-timeline-custom"
            />
            <style jsx global>{`
                .activity-timeline-custom .ant-timeline-item-label {
                    width: 120px !important; // Adjust label width for timestamp
                }
                .activity-timeline-custom .ant-timeline-item-content {
                    min-height: 60px;
                }
            `}</style>
        </div>
    );
};

export default ActivityTimeline;
