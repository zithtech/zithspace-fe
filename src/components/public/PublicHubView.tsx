'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Spin, Empty, Button, Tooltip, message } from 'antd';
import {
    UserOutlined,
    CalendarOutlined,
    FolderOutlined,
    FileTextOutlined,
    ProductOutlined,
    DownOutlined,
    RightOutlined,
    GlobalOutlined,
    FilePdfOutlined,
} from '@ant-design/icons';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { documentHubService as DocumentHubService } from '@/services/documentHub';
import dynamic from 'next/dynamic';

const BlockNoteRenderer = dynamic(
    () => import('@/components/public/BlockNoteRenderer'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center py-16">
                <Spin />
            </div>
        ),
    },
);

interface PublicHubViewProps {
    shareToken: string;
}

interface TreeItem {
    id: string;
    parentId: string | null;
    title: string;
    type: 'file' | 'folder' | 'section';
    documentId: string | null;
    children?: TreeItem[];
}

// Strip the first block of a document if it's a heading whose text matches the
// page title — prevents the visible duplicate-title artifact.
const stripDuplicateLeadingHeading = (content: any, title: string): any => {
    if (!Array.isArray(content) || !title) return content;
    const first = content[0];
    if (!first || first.type !== 'heading') return content;
    const text =
        typeof first.content === 'string'
            ? first.content
            : Array.isArray(first.content)
                ? first.content
                      .map((n: any) => (typeof n === 'string' ? n : n?.text ?? ''))
                      .join('')
                : '';
    if (text.trim().toLowerCase() === title.trim().toLowerCase()) {
        return content.slice(1);
    }
    return content;
};

const PublicHubView: React.FC<PublicHubViewProps> = ({ shareToken }) => {
    const [hub, setHub] = useState<any>(null);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [docLoading, setDocLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);

    const handleExportPdf = async () => {
        if (!contentRef.current || !selectedDoc) return;

        try {
            setExporting(true);
            const html2pdf = (await import('html2pdf.js')).default;

            const element = contentRef.current.cloneNode(true) as HTMLElement;

            // Wait for all images in the cloned element to load completely
            const images = Array.from(element.getElementsByTagName('img'));
            await Promise.all(
                images.map((img) => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                })
            );

            // Apply PDF-specific styles to the clone
            element.style.width = '100%';
            element.style.maxWidth = '800px'; // A4 width approx
            element.style.margin = '0';
            element.style.padding = '20px 40px';
            element.style.background = 'white';
            element.style.border = 'none';
            element.style.boxShadow = 'none';
            element.style.height = 'auto';
            element.style.overflow = 'visible';

            // Create a temporary container that holds the clone with all proper BlockNote context classes
            const container = document.createElement('div');
            container.className = 'bn-container bn-editor'; // Supply BlockNote global stylesheet styles
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '800px';
            container.style.background = 'white';
            container.appendChild(element);
            document.body.appendChild(container);

            const opt = {
                margin: [10, 10, 10, 10], // top, left, bottom, right in mm
                filename: `${selectedDoc.title || 'document'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    letterRendering: true
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            await (html2pdf() as any).set(opt).from(element).save();
            document.body.removeChild(container);
            message.success('PDF downloaded successfully');
        } catch (error) {
            console.error('Failed to export PDF:', error);
            message.error('Failed to generate PDF. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        const fetchHub = async () => {
            try {
                setLoading(true);
                const data = await DocumentHubService.getPublicDocumentHub(shareToken);
                setHub(data);

                // Expand every folder by default for a top-down read.
                const folderIds = (data.treeNodes || [])
                    .filter((n: any) => n.type === 'folder' || n.type === 'section')
                    .map((n: any) => n.id);
                setExpandedIds(new Set(folderIds));

                // Resolve target page from URL query param '?page=[documentId]' or '?page=[nodeId]'
                const params = new URLSearchParams(window.location.search);
                const targetPageId = params.get('page');

                let targetFile = null;
                if (targetPageId) {
                    targetFile = data.treeNodes?.find(
                        (n: any) => n.type === 'file' && (n.documentId === targetPageId || n.id === targetPageId)
                    );
                }

                // Fallback to first file
                if (!targetFile) {
                    targetFile = data.treeNodes?.find(
                        (n: any) => n.type === 'file' && n.documentId,
                    );
                }

                if (targetFile) {
                    setSelectedNodeId(targetFile.id);
                    loadDocument(targetFile.documentId);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shareToken]);

    const loadDocument = async (documentId: string) => {
        try {
            setDocLoading(true);
            const data = await DocumentHubService.getPublicHubDocumentContent(
                shareToken,
                documentId,
            );
            setSelectedDoc(data);
        } catch (err) {
            console.error('Failed to fetch document content:', err);
        } finally {
            setDocLoading(false);
        }
    };

    const tree = useMemo<TreeItem[]>(() => {
        const nodes: TreeItem[] = (hub?.treeNodes || []).map((n: any) => ({
            ...n,
            children: [],
        }));
        const map = new Map<string, TreeItem>();
        const roots: TreeItem[] = [];
        nodes.forEach((n) => map.set(n.id, n));
        nodes.forEach((n) => {
            if (n.parentId && map.has(n.parentId)) {
                map.get(n.parentId)!.children!.push(n);
            } else {
                roots.push(n);
            }
        });
        return roots;
    }, [hub?.treeNodes]);

    const toggleExpand = (id: string) =>
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const handleSelectNode = (node: TreeItem) => {
        setSelectedNodeId(node.id);
        if (node.type === 'file' && node.documentId) {
            loadDocument(node.documentId);
            // Deep-linking URL update: rewrite URL search params without page reload
            const url = new URL(window.location.href);
            url.searchParams.set('page', node.documentId);
            window.history.replaceState(null, '', url.pathname + url.search);
        } else if (node.children && node.children.length > 0) {
            toggleExpand(node.id);
        }
    };

    const renderNode = (node: TreeItem, depth: number): React.ReactNode => {
        const hasChildren = !!node.children && node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const isSelected = selectedNodeId === node.id;
        const isFile = node.type === 'file';

        return (
            <div key={node.id}>
                <div
                    role="button"
                    onClick={() => handleSelectNode(node)}
                    className="group flex items-center gap-1.5 cursor-pointer rounded-lg transition-colors"
                    style={{
                        padding: '7px 8px',
                        paddingLeft: 8 + depth * 14,
                        backgroundColor: isSelected
                            ? 'rgba(59, 130, 246, 0.08)'
                            : 'transparent',
                        color: isSelected ? '#1d4ed8' : '#334155',
                        boxShadow: isSelected ? 'inset 2px 0 0 #3b82f6' : 'none',
                    }}
                    onMouseEnter={(e) => {
                        if (!isSelected) {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor =
                                'rgba(15, 23, 42, 0.04)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isSelected) {
                            (e.currentTarget as HTMLDivElement).style.backgroundColor =
                                'transparent';
                        }
                    }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(node.id);
                            }}
                            className="shrink-0 flex items-center justify-center"
                            style={{
                                width: 16,
                                height: 16,
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                            }}
                        >
                            {isExpanded ? (
                                <DownOutlined style={{ fontSize: 9 }} />
                            ) : (
                                <RightOutlined style={{ fontSize: 9 }} />
                            )}
                        </button>
                    ) : (
                        <span style={{ width: 16, display: 'inline-block' }} />
                    )}
                    {isFile ? (
                        <FileTextOutlined
                            style={{
                                fontSize: 13,
                                color: isSelected ? '#3b82f6' : '#94a3b8',
                                flexShrink: 0,
                            }}
                        />
                    ) : (
                        <FolderOutlined
                            style={{
                                fontSize: 13,
                                color: isSelected ? '#3b82f6' : '#f59e0b',
                                flexShrink: 0,
                            }}
                        />
                    )}
                    <Tooltip title={node.title} placement="right" mouseEnterDelay={0.5}>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: isSelected || !isFile ? 600 : 400,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            {node.title}
                        </span>
                    </Tooltip>
                </div>
                {hasChildren && isExpanded && (
                    <div>
                        {node.children!.map((child) => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div
                className="flex flex-col justify-center items-center min-h-screen gap-4"
                style={{ background: '#f8fafc' }}
            >
                <Spin size="large" />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>
                    Preparing your document workspace…
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen" style={{ background: '#f8fafc' }}>
                <div
                    className="text-center max-w-md p-8 rounded-2xl"
                    style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
                    }}
                >
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1e293b' }}>
                                    Access limited
                                </h3>
                                <p className="text-sm" style={{ color: '#64748b' }}>{error}</p>
                            </div>
                        }
                    />
                    <Button
                        type="primary"
                        className="mt-6"
                        onClick={() => window.location.reload()}
                        style={{
                            borderRadius: 9,
                            paddingInline: 18,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                            border: 'none',
                        }}
                    >
                        Try again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                height: '100vh',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                color: '#1e293b',
            }}
        >
            {/* Hero header */}
            <header
                style={{
                    height: 60,
                    flexShrink: 0,
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={() => setCollapsed((c) => !c)}
                        className="flex items-center justify-center rounded-lg transition-colors"
                        style={{
                            width: 32,
                            height: 32,
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9')
                        }
                        onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')
                        }
                        aria-label="Toggle sidebar"
                    >
                        {collapsed ? <PanelLeft /> : <PanelLeftClose />}
                    </button>
                    <div
                        className="flex items-center justify-center text-white shrink-0"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                            boxShadow:
                                '0 4px 12px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
                        }}
                    >
                        <ProductOutlined style={{ fontSize: 16 }} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1
                            className="m-0 truncate"
                            style={{
                                fontSize: 15,
                                fontWeight: 700,
                                letterSpacing: '-0.015em',
                                color: '#0f172a',
                            }}
                        >
                            {hub?.name}
                        </h1>
                        <div className="flex items-center gap-1.5" style={{ marginTop: 2 }}>
                            <span
                                className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full"
                                style={{
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: '#1d4ed8',
                                }}
                            >
                                <GlobalOutlined style={{ fontSize: 9 }} />
                                Public
                            </span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Document hub</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {selectedDoc && (
                        <Button
                            type="primary"
                            icon={<FilePdfOutlined />}
                            onClick={handleExportPdf}
                            loading={exporting}
                            style={{
                                borderRadius: 8,
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                borderColor: 'transparent',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.filter = 'none';
                            }}
                        >
                            Download PDF
                        </Button>
                    )}
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {/* Sidebar */}
                <aside
                    style={{
                        width: collapsed ? 0 : 280,
                        flexShrink: 0,
                        overflow: 'hidden',
                        transition: 'width 240ms ease',
                        background: '#fafafa',
                        borderRight: collapsed ? 'none' : '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {!collapsed && (
                        <>
                            <div
                                style={{
                                    padding: '14px 16px 8px',
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: '#94a3b8',
                                }}
                            >
                                Explore
                            </div>
                            <div
                                className="flex-1 overflow-y-auto"
                                style={{ padding: '0 8px 12px' }}
                            >
                                {tree.length === 0 ? (
                                    <div
                                        style={{
                                            padding: 24,
                                            textAlign: 'center',
                                            color: '#94a3b8',
                                            fontSize: 12,
                                        }}
                                    >
                                        No documents in this hub.
                                    </div>
                                ) : (
                                    tree.map((node) => renderNode(node, 0))
                                )}
                            </div>
                        </>
                    )}
                </aside>

                {/* Content */}
                <main
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        background: '#fff',
                        position: 'relative',
                    }}
                >
                    {docLoading ? (
                        <div className="flex flex-col justify-center items-center h-full gap-3 py-20">
                            <Spin size="large" />
                            <span style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                                Fetching latest version…
                            </span>
                        </div>
                    ) : selectedDoc ? (
                        <div
                            ref={contentRef}
                            style={{
                                maxWidth: 820,
                                margin: '0 auto',
                                padding: '40px 28px 80px',
                            }}
                        >
                            <header style={{ marginBottom: 28 }}>
                                <h1
                                    style={{
                                        fontSize: 30,
                                        fontWeight: 800,
                                        margin: 0,
                                        marginBottom: 12,
                                        letterSpacing: '-0.025em',
                                        color: '#0f172a',
                                        lineHeight: 1.15,
                                    }}
                                >
                                    {selectedDoc.title}
                                </h1>
                                <div
                                    className="flex items-center gap-3"
                                    style={{ color: '#94a3b8', fontSize: 12 }}
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        <UserOutlined style={{ fontSize: 11 }} />
                                        <span style={{ color: '#64748b', fontWeight: 500 }}>
                                            {selectedDoc.createdBy?.name || 'Authorized'}
                                        </span>
                                    </span>
                                    <span style={{ color: '#cbd5e1' }}>·</span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <CalendarOutlined style={{ fontSize: 11 }} />
                                        {new Date(selectedDoc.updatedAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        marginTop: 24,
                                        height: 1,
                                        background: '#e2e8f0',
                                    }}
                                />
                            </header>
                            <div className="prose-container">
                                <BlockNoteRenderer
                                    content={stripDuplicateLeadingHeading(
                                        selectedDoc.content,
                                        selectedDoc.title || '',
                                    )}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-slate-300">
                            <div
                                className="flex items-center justify-center mb-5"
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 999,
                                    background: '#f1f5f9',
                                    color: '#94a3b8',
                                }}
                            >
                                <FileTextOutlined style={{ fontSize: 30 }} />
                            </div>
                            <h3
                                style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: '#475569',
                                    margin: 0,
                                }}
                            >
                                Nothing selected
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
                                Choose a document from the sidebar to begin reading.
                            </p>
                        </div>
                    )}
                </main>
            </div>

            {/* Footer */}
            <footer
                style={{
                    flexShrink: 0,
                    padding: '14px 20px',
                    background: '#fff',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                }}
            >
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Shared via
                </span>
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    Zukvo
                </span>
            </footer>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    .prose-container {
                        font-size: 15px;
                        line-height: 1.7;
                        color: #1e293b;
                    }
                `,
                }}
            />
        </div>
    );
};

export default PublicHubView;
