'use client';

import React from 'react';
import { Tag, Tooltip, Empty, Skeleton } from 'antd';
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
    const totalHubs = documentHubs.length;
    const totalDocuments = documentHubs.reduce(
        (acc, hub) => acc + (hub.treeNodes?.filter((n) => n.type === 'file').length || 0),
        0
    );
    const projectLinked = documentHubs.filter((h) => h.projectId).length;
    const uniqueCreators = new Set(documentHubs.map((h) => h.createdById)).size;

    const recentHubs = [...documentHubs]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4);

    const statCards = [
        {
            title: 'Document Hubs',
            value: totalHubs,
            icon: <FolderOutlined />,
            gradient: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
            shadow: 'rgba(59, 130, 246, 0.25)',
        },
        {
            title: 'Total Documents',
            value: totalDocuments,
            icon: <FileTextOutlined />,
            gradient: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
            shadow: 'rgba(16, 185, 129, 0.25)',
        },
        {
            title: 'Project Linked',
            value: projectLinked,
            icon: <ProjectOutlined />,
            gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
            shadow: 'rgba(139, 92, 246, 0.25)',
        },
        {
            title: 'Contributors',
            value: uniqueCreators,
            icon: <UserOutlined />,
            gradient: 'linear-gradient(135deg, #F97316 0%, #F59E0B 100%)',
            shadow: 'rgba(249, 115, 22, 0.25)',
        },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col gap-5 mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="rounded-2xl p-5"
                            style={{
                                border: '1px solid var(--border-slate-200)',
                                background: 'var(--bg-pure-white)',
                            }}
                        >
                            <Skeleton active paragraph={{ rows: 1 }} />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="rounded-2xl p-4"
                            style={{
                                border: '1px solid var(--border-slate-200)',
                                background: 'var(--bg-pure-white)',
                            }}
                        >
                            <Skeleton active paragraph={{ rows: 2 }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.title}
                        className="group relative rounded-2xl px-5 py-4 transition-all duration-200 overflow-hidden"
                        style={{
                            border: '1px solid var(--border-slate-200)',
                            background: 'var(--bg-pure-white)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 8px 24px ${stat.shadow}`;
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = 'var(--border-slate-200)';
                        }}
                    >
                        {/* Decorative gradient blob */}
                        <div
                            className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.08] group-hover:opacity-[0.14] transition-opacity"
                            style={{ background: stat.gradient }}
                        />

                        <div className="relative flex items-center justify-between gap-3">
                            <div className="flex flex-col gap-1.5 min-w-0">
                                <span
                                    className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                                    style={{ color: 'var(--text-slate-400)' }}
                                >
                                    {stat.title}
                                </span>
                                <span
                                    className="text-[28px] font-bold leading-none tracking-tight"
                                    style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}
                                >
                                    {stat.value}
                                </span>
                            </div>
                            <div
                                className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 text-white text-[18px]"
                                style={{
                                    background: stat.gradient,
                                    boxShadow: `0 4px 12px ${stat.shadow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                                }}
                            >
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

          
        </div>
    );
};

export default DocumentHubDashboard;
