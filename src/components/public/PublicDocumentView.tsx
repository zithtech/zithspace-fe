'use client';

import React, { useEffect, useState } from 'react';
import { Empty, Button, message } from 'antd';
import {
    UserOutlined,
    CalendarOutlined,
    FileTextOutlined,
    ProductOutlined,
    GlobalOutlined,
    FolderOpenOutlined,
    FilePdfOutlined
} from '@ant-design/icons';
import { documentHubService as DocumentHubService } from '@/services/documentHub';
import dynamic from 'next/dynamic';
import ZukvoLoader from '../common/ZukvoLoader';


const BlockNoteRenderer = dynamic(
    () => import('@/components/public/BlockNoteRenderer'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center py-16">
                <ZukvoLoader size="md" />
            </div>
        )
    },
);

interface PublicDocumentViewProps {
    shareToken: string;
}

// Strip the first block of a document if it's a heading whose text matches the
// page title — prevents the duplicate-title artifact when AI-generated docs
// embed their own H1 at the top of the content.
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

const PublicDocumentView: React.FC<PublicDocumentViewProps> = ({ shareToken }) => {
    const [doc, setDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);

    const handleExportPdf = async () => {
        if (!contentRef.current || !doc) return;

        try {
            setExporting(true);
            const html2pdf = (await import('html2pdf.js')).default;

            // Clone the element to modify styles for PDF generation without affecting UI
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
                filename: `${doc.title || 'document'}.pdf`,
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
        const fetchDocument = async () => {
            try {
                setLoading(true);
                const data = await DocumentHubService.getPublicDocument(shareToken);
                setDoc(data);
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
                className="flex flex-col justify-center items-center min-h-screen gap-4"
                style={{ background: '#f8fafc' }}
            >
                <ZukvoLoader size="lg" />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>
                    Loading document…
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="flex justify-center items-center min-h-screen"
                style={{ background: '#f8fafc' }}
            >
                <div
                    className="text-center max-w-md p-8 rounded-2xl"
                    style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)'
                    }}
                >
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="mt-4">
                                <h3
                                    className="text-lg font-semibold mb-2"
                                    style={{ color: '#1e293b' }}
                                >
                                    Access limited
                                </h3>
                                <p className="text-sm" style={{ color: '#64748b' }}>
                                    {error}
                                </p>
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
                            border: 'none'
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
                color: '#1e293b'
            }}
        >
            {/* Hero header — matches PublicHubView so a doc shared from inside
                the hub looks identical to one shared from the main table. */}
            <header
                className="public-doc-header"
                style={{
                    height: 60,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="flex items-center justify-center text-white shrink-0"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                            boxShadow:
                                '0 4px 12px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)'
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
                                color: '#0f172a'
                            }}
                        >
                            {doc?.title || 'Untitled document'}
                        </h1>
                        <div
                            className="flex items-center gap-1.5"
                            style={{ marginTop: 2 }}
                        >
                            <span
                                className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full"
                                style={{
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: '#1d4ed8'
                                }}
                            >
                                <GlobalOutlined style={{ fontSize: 9 }} />
                                Public
                            </span>
                            {doc?.documentHub?.name ? (
                                <span
                                    className="inline-flex items-center gap-1 truncate public-hub-name"
                                    style={{
                                        fontSize: 11,
                                        color: '#64748b'
                                    }}
                                >
                                    <FolderOpenOutlined style={{ fontSize: 10 }} />
                                    <span className="truncate">{doc.documentHub.name}</span>
                                </span>
                            ) : (
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                    Shared document
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
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
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.filter = 'none';
                        }}
                    >
                        <span className="public-download-text">Download PDF</span>
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    background: '#fff',
                    position: 'relative'
                }}
            >
                {doc ? (
                    <div
                        ref={contentRef}
                        className="public-doc-container"
                        style={{
                            maxWidth: 820,
                            margin: '0 auto'
                        }}
                    >
                        <header style={{ marginBottom: 28 }}>
                            <h1
                                className="public-doc-title"
                                style={{
                                    fontWeight: 800,
                                    margin: 0,
                                    marginBottom: 12,
                                    letterSpacing: '-0.025em',
                                    color: '#0f172a',
                                    lineHeight: 1.15
                                }}
                            >
                                {doc.title}
                            </h1>
                            <div
                                className="flex items-center gap-3"
                                style={{ color: '#94a3b8', fontSize: 12 }}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <UserOutlined style={{ fontSize: 11 }} />
                                    <span style={{ color: '#64748b', fontWeight: 500 }}>
                                        {doc.createdBy?.name || 'Authorized'}
                                    </span>
                                </span>
                                {doc.updatedAt && (
                                    <>
                                        <span style={{ color: '#cbd5e1' }}>·</span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <CalendarOutlined style={{ fontSize: 11 }} />
                                            {new Date(doc.updatedAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div
                                style={{
                                    marginTop: 24,
                                    height: 1,
                                    background: '#e2e8f0'
                                }}
                            />
                        </header>
                        <div className="prose-container">
                            <BlockNoteRenderer
                                content={stripDuplicateLeadingHeading(
                                    doc.content,
                                    doc.title || '',
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
                                color: '#94a3b8'
                            }}
                        >
                            <FileTextOutlined style={{ fontSize: 30 }} />
                        </div>
                        <h3
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: '#475569',
                                margin: 0
                            }}
                        >
                            Document unavailable
                        </h3>
                    </div>
                )}
            </main>

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
                    gap: 6
                }}
            >
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Shared via</span>
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
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
                    .public-doc-header {
                        padding: 0 20px;
                    }
                    .public-hub-name {
                        max-width: 280px;
                    }
                    .public-doc-container {
                        padding: 40px 28px 80px;
                    }
                    .public-doc-title {
                        font-size: 30px;
                    }
                    @media (max-width: 768px) {
                        .public-doc-header {
                            padding: 0 12px;
                        }
                        .public-hub-name {
                            max-width: 120px;
                        }
                        .public-doc-container {
                            padding: 24px 16px 60px;
                        }
                        .public-doc-title {
                            font-size: 24px;
                        }
                    }
                    @media (max-width: 444px) {
                        .public-download-text {
                            display: none;
                        }
                        .public-hub-name {
                            display: none;
                        }
                    }
                ` }}
            />
        </div>
    );
};

export default PublicDocumentView;
