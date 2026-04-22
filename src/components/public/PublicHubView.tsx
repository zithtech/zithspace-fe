'use client';

import React, { useEffect, useState } from 'react';
import { Spin, Typography, Tag, Divider, Empty, Tree, Layout, ConfigProvider, Button } from 'antd';
import {
    GlobalOutlined,
    UserOutlined,
    CalendarOutlined,
    FolderOutlined,
    FileTextOutlined,
    ProductOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import { documentHubService as DocumentHubService } from '@/services/documentHub';
import dynamic from 'next/dynamic';

const { Title, Text } = Typography;
const { Sider, Content } = Layout;

// Dynamically import the editor component to avoid SSR issues with BlockNote
const BlockNoteRenderer = dynamic(() => import('@/components/public/BlockNoteRenderer'), {
    ssr: false,
    loading: () => <Spin style={{ display: 'block', margin: '40px auto' }} />,
});

interface PublicHubViewProps {
    shareToken: string;
}

const PublicHubView: React.FC<PublicHubViewProps> = ({ shareToken }) => {
    const [hub, setHub] = useState<any>(null);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [docLoading, setDocLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const fetchHub = async () => {
            try {
                setLoading(true);
                const data = await DocumentHubService.getPublicDocumentHub(shareToken);
                setHub(data);

                // Automatically load the first file if available
                const firstFile = data.treeNodes?.find((n: any) => n.type === 'file' && n.documentId);
                if (firstFile) {
                    loadDocument(firstFile.documentId);
                }
            } catch (err: any) {
                console.error(err);
                if (err?.response?.status === 404) {
                    setError('This sharing hub is not available or the link has expired.');
                } else {
                    setError('Failed to load the document hub. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchHub();
    }, [shareToken]);

    const loadDocument = async (documentId: string) => {
        try {
            setDocLoading(true);
            const data = await DocumentHubService.getPublicHubDocumentContent(shareToken, documentId);
            setSelectedDoc(data);
        } catch (err) {
            console.error("Failed to fetch document content:", err);
        } finally {
            setDocLoading(false);
        }
    };

    const handleSelectNode = (selectedKeys: any[], info: any) => {
        const node = info.node;
        if (node.type === 'file' && node.documentId) {
            loadDocument(node.documentId);
        }
    };

    const buildTreeData = (nodes: any[]) => {
        if (!nodes) return [];
        const map = new Map();
        nodes.forEach(node => map.set(node.id, { ...node, key: node.id, children: [] }));

        const tree: any[] = [];
        nodes.forEach(node => {
            const mappedNode = map.get(node.id);
            mappedNode.icon = node.type === 'file' ? <FileTextOutlined style={{ color: '#1890ff' }} /> : <FolderOutlined style={{ color: '#faad14' }} />;
            mappedNode.title = <span style={{ fontSize: '14px', fontWeight: node.type === 'file' ? 400 : 500 }}>{node.title}</span>;

            if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId).children.push(mappedNode);
            } else {
                tree.push(mappedNode);
            }
        });
        return tree;
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 gap-4">
                <Spin size="large" />
                <Text type="secondary">Preparing your document workspace...</Text>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <div className="text-center max-w-md p-8 rounded-2xl shadow-xl bg-white border border-slate-100">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="mt-4">
                                <Title level={4} className="mb-2">Access Limited</Title>
                                <Text type="secondary">{error}</Text>
                            </div>
                        }
                    />
                    <Button type="primary" className="mt-6 rounded-full px-8" onClick={() => window.location.reload()}>Try Again</Button>
                </div>
            </div>
        );
    }

    return (
        <ConfigProvider
            theme={{
                token: { borderRadius: 8, colorPrimary: '#1677ff', fontFamily: 'Inter, -apple-system, sans-serif' },
                components: {
                    Layout: { colorBgHeader: 'rgba(255, 255, 255, 0.9)', colorBgBody: '#fff' },
                    Tree: { colorBgContainer: 'transparent' }
                }
            }}
        >
            <Layout style={{ height: '100vh', background: '#fff', }}>
                <Layout.Header style={{
                    padding: '0 16px',
                    height: 56,
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10,
                    position: 'sticky',
                    top: 0
                }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <ProductOutlined style={{ fontSize: 16, color: '#fff' }} />
                        </div>
                        <div>
                            <Title level={5} style={{ margin: 0, letterSpacing: '-0.01em' }}>{hub?.name}</Title>
                            <div className="flex items-center gap-1.5" style={{ marginTop: -2 }}>
                                <Tag bordered={false} color="processing" style={{ margin: 0, fontSize: '9px', padding: '0 4px', lineHeight: '14px' }}>Public</Tag>
                                <Text type="secondary" style={{ fontSize: 10 }}>Document Hub</Text>
                            </div>
                        </div>
                    </div>
                </Layout.Header>

                <Layout>
                    <Sider
                        width={300}
                        theme="light"
                        collapsible
                        collapsed={collapsed}
                        onCollapse={(value) => setCollapsed(value)}
                        style={{
                            borderRight: '1px solid rgba(0,0,0,0.06)',
                            overflowY: 'auto',
                            background: '#fafafa'
                        }}
                    >
                        <div style={{ padding: '16px 12px' }}>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <Text strong style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Explore</Text>
                            </div>
                            <Tree
                                showIcon
                                defaultExpandAll
                                treeData={buildTreeData(hub?.treeNodes)}
                                onSelect={handleSelectNode}
                                blockNode
                                className="premium-tree"
                                style={{ background: 'transparent' }}
                            />
                        </div>
                    </Sider>

                    <Content style={{ overflowY: 'auto', background: '#fff', position: 'relative', width: "100%" }}>
                        {docLoading ? (
                            <div className="flex flex-col justify-center items-center h-full gap-4">
                                <Spin size="large" />
                                <Text type="secondary" style={{ fontStyle: 'italic' }}>Fetching latest version...</Text>
                            </div>
                        ) : selectedDoc ? (
                            <div className="animate-in fade-in duration-500" style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
                                <div style={{ marginBottom: 24 }}>
                                    <Title style={{ fontSize: '28px', fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>{selectedDoc.title}</Title>
                                    <div className="flex items-center gap-4 text-slate-400 text-xs">
                                        <span className="flex items-center gap-1.5"><UserOutlined /> <Text style={{ fontSize: '12px' }}>{selectedDoc.createdBy?.name || 'Authorized'}</Text></span>
                                        <span className="flex items-center gap-1.5"><CalendarOutlined /> {new Date(selectedDoc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <Divider style={{ margin: '24px 0 0' }} />
                                </div>
                                <div className="prose-container">
                                    <BlockNoteRenderer content={selectedDoc.content} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col justify-center items-center h-full text-slate-300">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <FileTextOutlined style={{ fontSize: 40, opacity: 0.5 }} />
                                </div>
                                <Title level={4} style={{ color: '#d1d5db' }}>Nothing Selected</Title>
                                <Text type="secondary" style={{ maxWidth: 280, textAlign: 'center' }}>Choose a document from the sidebar to begin reading.</Text>
                            </div>
                        )}

                        {/* CSS for Premium Tree */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .premium-tree .ant-tree-node-content-wrapper {
                                height: 30px !important;
                                display: flex !important;
                                alignItems: center !important;
                                border-radius: 6px !important;
                                transition: all 0.1s ease !important;
                                margin: 1px 0 !important;
                            }
                            .premium-tree .ant-tree-node-selected {
                                background-color: #f0f7ff !important;
                                color: #1677ff !important;
                            }
                            .prose-container {
                                font-size: 15px;
                                line-height: 1.7;
                                color: #262626;
                            }
                        ` }} />
                    </Content>
                </Layout>

                <Layout.Footer style={{
                    textAlign: 'center',
                    background: '#fff',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    padding: '20px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>Standard Documentation Hub • </Text>
                    <Text strong style={{ color: '#1677ff' }}>ZithSpace</Text>
                </Layout.Footer>
            </Layout>
        </ConfigProvider>
    );
};

export default PublicHubView;
