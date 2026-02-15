'use client';

import React, { useEffect, useState } from 'react';
import { Spin, Typography, Tag, Divider, Empty } from 'antd';
import {
    GlobalOutlined,
    UserOutlined,
    CalendarOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import { documentHubService as DocumentHubService } from '@/services/documentHub';
import dynamic from 'next/dynamic';

const { Title, Text } = Typography;

// Dynamically import the editor component to avoid SSR issues with BlockNote
const BlockNoteRenderer = dynamic(() => import('@/components/public/BlockNoteRenderer'), {
    ssr: false,
    loading: () => <Spin style={{ display: 'block', margin: '40px auto' }} />,
});

interface PublicDocumentViewProps {
    shareToken: string;
}

const PublicDocumentView: React.FC<PublicDocumentViewProps> = ({ shareToken }) => {
    const [document, setDocument] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                setLoading(true);
                const data = await DocumentHubService.getPublicDocument(shareToken);
                setDocument(data);
            } catch (err: any) {
                console.error(err);
                if (err?.response?.status === 404) {
                    setError('This document is not available or the link has expired.');
                } else {
                    setError('Failed to load the document. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [shareToken]);

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    background: '#fafafa',
                }}
            >
                <Spin size="large" tip="Loading document..." />
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    background: '#fafafa',
                }}
            >
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <div>
                            <Text type="secondary" style={{ fontSize: 16 }}>
                                {error}
                            </Text>
                        </div>
                    }
                />
            </div>
        );
    }

    return (
        <div
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#fafafa',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: '#fff',
                    borderBottom: '1px solid #f0f0f0',
                    padding: '16px 0',
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        maxWidth: 900,
                        margin: '0 auto',
                        padding: '0 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FileTextOutlined style={{ fontSize: 20, color: '#1677ff' }} />
                        <div>
                            <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
                                {document?.title || 'Untitled Document'}
                            </Title>
                            {document?.documentHub?.name && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {document.documentHub.name}
                                </Text>
                            )}
                        </div>
                    </div>
                    <Tag icon={<GlobalOutlined />} color="green">
                        Public Document
                    </Tag>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: 0,
                }}
            >
                {/* Meta Info */}
                <div
                    style={{
                        maxWidth: 900,
                        margin: '0 auto',
                        padding: '16px 24px 0',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: 16,
                            flexWrap: 'wrap',
                            fontSize: 13,
                            color: '#8c8c8c',
                        }}
                    >
                        {document?.createdBy?.name && (
                            <span>
                                <UserOutlined style={{ marginRight: 4 }} />
                                {document.createdBy.name}
                            </span>
                        )}
                        {document?.updatedAt && (
                            <span>
                                <CalendarOutlined style={{ marginRight: 4 }} />
                                Updated{' '}
                                {new Date(document.updatedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                        )}
                    </div>
                    <Divider style={{ margin: '16px 0' }} />
                </div>

                {/* Document Content */}
                <div
                    style={{
                        maxWidth: 900,
                        margin: '0 auto',
                        padding: '0 24px 64px',
                    }}
                >
                    {document?.content && (
                        <BlockNoteRenderer content={document.content} />
                    )}
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    borderTop: '1px solid #f0f0f0',
                    padding: '16px',
                    textAlign: 'center',
                    background: '#fff',
                    flexShrink: 0,
                }}
            >
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Shared via ZithSpace Document Hub
                </Text>
            </div>
        </div>
    );
};

export default PublicDocumentView;
