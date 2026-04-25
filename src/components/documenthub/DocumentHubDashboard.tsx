'use client';

import React from 'react';
import { Card, Typography, Tag, Tooltip, Empty, Skeleton } from 'antd';
import {
    FileTextOutlined,
    FolderOutlined,
    ShareAltOutlined,
    ClockCircleOutlined,
    ProjectOutlined,
    UserOutlined,
    ArrowRightOutlined,
} from '@ant-design/icons';
import { DocumentHub } from '@/services/documentHub';
import { format, formatDistanceToNow } from 'date-fns';

const { Text, Title } = Typography;

interface DocumentHubDashboardProps {
    documentHubs: DocumentHub[];
    isLoading: boolean;
    onHubClick: (hubId: string) => void;
    onShareHub: (e: React.MouseEvent, hub: DocumentHub) => void;
}

const DocumentHubDashboard: React.FC<DocumentHubDashboardProps> = ({
    documentHubs,
    isLoading,
    onHubClick,
    onShareHub,
}) => {
    // Compute stats from the data
    const totalHubs = documentHubs.length;
    const totalDocuments = documentHubs.reduce(
        (acc, hub) => acc + (hub.treeNodes?.filter((n) => n.type === 'file').length || 0),
        0
    );
    const projectLinked = documentHubs.filter((h) => h.projectId).length;

    // Recent hubs (last 5, sorted by updatedAt)
    const recentHubs = [...documentHubs]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6);

    // Unique contributors
    const uniqueCreators = new Set(documentHubs.map((h) => h.createdById)).size;

    const statCards = [
        {
            title: 'Document Hubs',
            value: totalHubs,
            icon: <FolderOutlined />,
            color: 'var(--text-sky-500)',
            bg: 'var(--bg-blue-50)',
        },
        {
            title: 'Total Documents',
            value: totalDocuments,
            icon: <FileTextOutlined />,
            color: 'var(--text-holiday)',
            bg: 'var(--bg-green-50)',
        },
        {
            title: 'Project Linked',
            value: projectLinked,
            icon: <ProjectOutlined />,
            color: '#722ed1',
            bg: 'var(--bg-purple-50)',
        },
        {
            title: 'Contributors',
            value: uniqueCreators,
            icon: <UserOutlined />,
            color: '#fa8c16',
            bg: 'var(--bg-orange-50)',
        },
    ];

    if (isLoading) {
        return (
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} size="small">
                            <Skeleton active paragraph={{ rows: 1 }} />
                        </Card>
                    ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {[1, 2, 3].map((i) => (
                        <Card key={i} size="small">
                            <Skeleton active paragraph={{ rows: 2 }} />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Stats Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16,
                    marginBottom: 16,
                }}
            >
                {statCards.map((stat) => (
                    <Card
                        key={stat.title}
                        size="small"
                        style={{
                            borderRadius: 12,
                            border: '1px solid var(--border-slate-200)',
                            cursor: 'default',
                            background: 'var(--bg-pure-white)'
                        }}
                        styles={{ body: { padding: '16px 20px' } }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                                    {stat.title}
                                </Text>
                                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1 }}>
                                    {stat.value}
                                </span>
                            </div>
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: stat.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 20,
                                    color: stat.color,
                                }}
                            >
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Recent Document Hubs */}
            <div style={{ marginBottom: 6 }}>
                <Text strong style={{ fontSize: 15 }}>
                    <ClockCircleOutlined style={{ marginRight: 6 }} />
                    Recently Updated
                </Text>
            </div>

            {recentHubs.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No document hubs yet. Create one to get started!"
                    style={{ padding: '24px 0' }}
                />
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 12,
                    }}
                >
                    {recentHubs.map((hub) => {
                        const fileCount = hub.treeNodes?.filter((n) => n.type === 'file').length || 0;
                        const folderCount = hub.treeNodes?.filter((n) => n.type === 'folder').length || 0;

                        return (
                            <Card
                                key={hub.id}
                                size="small"
                                hoverable
                                onClick={() => onHubClick(hub.id)}
                                style={{
                                    borderRadius: 12,
                                    border: '1px solid var(--border-slate-200)',
                                    transition: 'all 0.2s',
                                    background: 'var(--bg-pure-white)'
                                }}
                                styles={{ body: { padding: '14px 18px' } }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                        <FolderOutlined style={{ color: '#1677ff', fontSize: 16, flexShrink: 0 }} />
                                        <Tooltip title={hub.name} mouseEnterDelay={0.5}>
                                            <Text
                                                strong
                                                ellipsis
                                                style={{ fontSize: 14, maxWidth: '180px', color: 'var(--text-slate-900)' }}
                                            >
                                                {hub.name}
                                            </Text>
                                        </Tooltip>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                        <Tooltip title="Share Hub">
                                            <div
                                                onClick={(e) => onShareHub(e, hub)}
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--text-blue-500)',
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-blue-50)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                <ShareAltOutlined style={{ fontSize: 14 }} />
                                            </div>
                                        </Tooltip>
                                        <ArrowRightOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#8c8c8c', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                        {hub.project && (
                                            <Text ellipsis style={{ fontSize: 12, color: '#1677ff', fontWeight: 500, maxWidth: '80px' }}>
                                                {hub.project.name}
                                            </Text>
                                        )}
                                        {hub.ticket && (
                                            <Tag color="orange" style={{ margin: 0, fontSize: 10, borderRadius: 4, padding: '0 4px', lineHeight: '16px' }}>
                                                {hub.ticket.ticketNumber}
                                            </Tag>
                                        )}
                                        <span style={{ flexShrink: 0 }}>
                                            <FileTextOutlined style={{ marginRight: 3 }} />
                                            {fileCount}
                                        </span>
                                    </div>
                                    <Tooltip title={format(new Date(hub.updatedAt), 'PPp')}>
                                        <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                                            {formatDistanceToNow(new Date(hub.updatedAt), { addSuffix: true })}
                                        </Text>
                                    </Tooltip>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DocumentHubDashboard;
