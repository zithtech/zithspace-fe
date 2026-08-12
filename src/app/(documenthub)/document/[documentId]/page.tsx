'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentHubService } from '@/services/documentHub'
import MainLayout from '@/components/layout/MainLayout'
import { useCreateBlockNote } from '@blocknote/react'
import DocumentEditor from '@/components/common/DocumentEditor'
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { FloatButton, Tooltip, message } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'

import { useAuth } from '@/context/AuthContext'
import ZukvoLoader from '@/components/common/ZukvoLoader'

function PreviewContent({ content, title, documentData }: { content: any, title: string, documentData?: any }) {
    const { user } = useAuth();
    const editor = useCreateBlockNote({
        initialContent: content ? (Array.isArray(content) ? content : []) : undefined
    })
    const contentRef = useRef<HTMLDivElement>(null);

    const handleExportPdf = async () => {
        if (!documentData?.id) {
            message.error('Document ID not found');
            return;
        }

        const hide = message.loading('Generating PDF...', 0);
        try {
            const blob = await documentHubService.downloadDocumentPdf(documentData.id);
            const url = window.URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = `${title || 'document'}.pdf`;
            window.document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            hide();
            message.success('PDF generated successfully');
        } catch (error) {
            console.error('PDF generation failed:', error);
            hide();
            message.error('Failed to generate PDF');
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
                <ZukvoLoader message="Loading document..." />
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
            <PreviewContent content={document.content} title={document.title} documentData={document} />
        </MainLayout>
    )
}
