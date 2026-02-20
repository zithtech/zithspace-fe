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
}

const DocumentHubDashboard: React.FC<DocumentHubDashboardProps> = ({
    documentHubs,
    isLoading,
    onHubClick,
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
            color: '#1677ff',
            bg: '#e6f4ff',
        },
        {
            title: 'Total Documents',
            value: totalDocuments,
            icon: <FileTextOutlined />,
            color: '#52c41a',
            bg: '#f6ffed',
        },
        {
            title: 'Project Linked',
            value: projectLinked,
            icon: <ProjectOutlined />,
            color: '#722ed1',
            bg: '#f9f0ff',
        },
        {
            title: 'Contributors',
            value: uniqueCreators,
            icon: <UserOutlined />,
            color: '#fa8c16',
            bg: '#fff7e6',
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
                    marginBottom: 24,
                }}
            >
                {statCards.map((stat) => (
                    <Card
                        key={stat.title}
                        size="small"
                        style={{
                            borderRadius: 12,
                            border: '1px solid #f0f0f0',
                            cursor: 'default',
                        }}
                        styles={{ body: { padding: '16px 20px' } }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                                    {stat.title}
                                </Text>
                                <span style={{ fontSize: 28, fontWeight: 700, color: '#262626', lineHeight: 1 }}>
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
            <div style={{ marginBottom:10}}>
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
                                    border: '1px solid #f0f0f0',
                                    transition: 'all 0.2s',
                                }}
                                styles={{ body: { padding: '14px 18px' } }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                        <FolderOutlined style={{ color: '#1677ff', fontSize: 16, flexShrink: 0 }} />
                                        <Text
                                            strong
                                            ellipsis
                                            style={{ fontSize: 14 }}
                                        >
                                            {hub.name}
                                        </Text>
                                    </div>
                                    <ArrowRightOutlined style={{ color: '#bfbfbf', fontSize: 12, marginTop: 4 }} />
                                </div>

                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                    {hub.project && (
                                        <Tag color="blue" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>
                                            {hub.project.name}
                                        </Tag>
                                    )}
                                    {hub.ticket && (
                                        <Tag color="orange" style={{ margin: 0, fontSize: 11, borderRadius: 4 }}>
                                            {hub.ticket.ticketNumber}
                                        </Tag>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#8c8c8c' }}>
                                        <span>
                                            <FileTextOutlined style={{ marginRight: 3 }} />
                                            {fileCount} {fileCount === 1 ? 'file' : 'files'}
                                        </span>
                                        {folderCount > 0 && (
                                            <span>
                                                <FolderOutlined style={{ marginRight: 3 }} />
                                                {folderCount}
                                            </span>
                                        )}
                                    </div>
                                    <Tooltip title={format(new Date(hub.updatedAt), 'PPp')}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
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
