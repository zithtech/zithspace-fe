'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentHubService } from '@/services/documentHub'
import MainLayout from '@/components/layout/MainLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useCreateBlockNote } from '@blocknote/react'
import DocumentEditor from '@/components/common/DocumentEditor'
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { FloatButton, Tooltip } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'

function PreviewContent({ content, title }: { content: any, title: string }) {
    const editor = useCreateBlockNote({
        initialContent: content ? (Array.isArray(content) ? content : []) : undefined
    })
    const contentRef = useRef<HTMLDivElement>(null);

    const handleExportPdf = async () => {
        if (!contentRef.current) return;

        const html2pdf = (await import('html2pdf.js')).default;

        // Clone the element to modify styles for PDF generation without affecting UI
        const element = contentRef.current.cloneNode(true) as HTMLElement;


        // Apply PDF-specific styles to the clone
        element.style.width = '100%';
        element.style.maxWidth = '800px'; // A4 width approx
        element.style.margin = '0';
        element.style.padding = '0px';
        element.style.background = 'white';
        element.style.border = 'none';
        element.style.boxShadow = 'none';
        element.style.height = 'auto';
        element.style.overflow = 'visible';
        element.style.zoom = '1'; // Reset zoom

        // Create a temporary container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.appendChild(element);
        document.body.appendChild(container);

        const opt = {
            margin: [1, 1, 1, 1], // top, left, bottom, right
            filename: `${title || 'document'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        try {
            await (html2pdf() as any).set(opt).from(element).save();
        } finally {
            // Clean up
            document.body.removeChild(container);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative" style={{ background: 'var(--bg-slate-50)' }}>
            {/* <div className="px-8 py-6 bg-white border-b border-gray-200 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div> */}
            <div className="flex-1 overflow-hidden px-8 pb-8">
                <div style={{ zoom: "80%", background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)' }} className="h-full bg-white my-auto w-[60%]  mx-auto  rounded-lg shadow-sm border  border-gray-200 overflow-hidden">
                    <div ref={contentRef} className="overflow-y-scroll h-full no-scrollbar">
                        <DocumentEditor editor={editor} viewMode="preview" />
                    </div>
                </div>
            </div>
            <Tooltip title="Export to PDF">
                <FloatButton
                    icon={<FilePdfOutlined />}
                    type="primary"
                    style={{ right: 24, top: '50%', transform: 'translateY(-50%)' }}
                    onClick={handleExportPdf}
                />
            </Tooltip>
        </div>
    )
}

export default function DocumentPreviewPage({ params }: { params: Promise<{ documentId: string }> }) {
    const { documentId } = use(params)

    const { data: document, isLoading, error } = useQuery({
        queryKey: ['document', documentId],
        queryFn: () => documentHubService.getDocument(documentId)
    })

    if (isLoading) {
        return (
            <MainLayout>
                <LoadingSpinner message="Loading document..." />
            </MainLayout>
        )
    }

    if (error || !document) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-slate-900" style={{ color: 'var(--text-slate-900)' }}>Document not found</h2>
                        <p className="text-slate-500 mt-2" style={{ color: 'var(--text-slate-400)' }}>The document you are looking for does not exist or you do not have permission to view it.</p>
                    </div>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <PreviewContent content={document.content} title={document.title} />
        </MainLayout>
    )
}
