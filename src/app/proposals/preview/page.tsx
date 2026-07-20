'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { BlockRenderer } from '@/components/proposals/blocks';
import { ProposalBlock } from '@/store/proposalStore';
import { useSearchParams } from 'next/navigation';
import { ProposalService } from '@/services/proposalService';

import { generateCoverHtml, generateTocHtml } from './PdfRenderer';

function PreviewContent() {
  const [blocks, setBlocks] = useState<ProposalBlock[]>([]);
  const searchParams = useSearchParams();
  const theme = searchParams.get('theme') || 'light';
  const proposalId = searchParams.get('proposalId');

  useEffect(() => {
    // We intentionally do NOT set 'data-theme' to dark on the document element here,
    // so that the proposal blocks (which represent physical paper) always render in light mode
    // (dark text on white background) instead of converting text to white on a white background.
  }, [theme]);

  useEffect(() => {
    // If proposalId is provided, fetch proposal data (view page scenario)
    if (proposalId) {
      const fetchProposalData = async () => {
        try {
          const proposal = await ProposalService.getProposalById(proposalId);
          const rawBlocks = proposal.blocks_data || [];

          // Convert to ProposalBlock format
          const proposalBlocks: ProposalBlock[] = rawBlocks.map((block: any, index: number) => ({
            id: block.id || `block-${index}`,
            type: block.type,
            data: block.data || {},
            order: index
          }));

          setBlocks(proposalBlocks);
        } catch (error) {
          console.error('Failed to fetch proposal data:', error);
        }
      };

      fetchProposalData();
    } else {
      // Listen for messages from parent window (builder scenario)
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SYNC_BLOCKS') {
          setBlocks(event.data.payload);
        }
      };

      window.addEventListener('message', handleMessage);

      // Initial sync and scroll listener
      const handleScrollMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SCROLL_TO_BLOCK') {
          const element = document.getElementById(`preview-block-${event.data.payload}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      };
      window.addEventListener('message', handleScrollMessage);

      // Notify parent that iframe is ready to receive initial state
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

      return () => {
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('message', handleScrollMessage);
      };
    }
  }, [proposalId]);

  const coverBlock = blocks.find(b => b.type === 'cover');
  const proposalTitle = coverBlock?.data?.title || '';
  const contentBlocks = blocks.filter(b => b.type !== 'cover');

  return (
    <div style={{ width: '100%', height: '100vh', overflowX: 'hidden', overflowY: 'auto', background: '#f8fafc' }}>
      <style>{`
        :root {
          color-scheme: light !important;
          /* Text colors */
          --text-primary: #0f172a !important;
          --text-secondary: #475569 !important;
          --text-slate-400: #94a3b8 !important;
          --text-slate-500: #64748b !important;
          --text-slate-600: #475569 !important;
          --text-slate-700: #334155 !important;
          --text-slate-900: #0f172a !important;
          /* Background colors */
          --bg-primary: #ffffff !important;
          --bg-secondary: #f8fafc !important;
          --bg-hover: #f1f5f9 !important;
          --bg-active: #eff6ff !important;
          --bg-slate-50: #f8fafc !important;
          --bg-slate-100: #f1f5f9 !important;
          --bg-slate-200: #e2e8f0 !important;
          --bg-slate-800: #1e293b !important;
          /* Border colors */
          --border: #e2e8f0 !important;
          --border-color: #e2e8f0 !important;
          --border-slate-100: #f1f5f9 !important;
          --border-slate-200: #e2e8f0 !important;
          /* Shadow */
          --box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04) !important;
        }
        * {
          color-scheme: light !important;
        }
        .preview-blocks-container div[id^="preview-block-"] > div {
          padding: 8px 24px !important;
        }
        /* Force Ant Design table to always render in light mode */
        .ant-table,
        .ant-table-wrapper,
        .ant-table-container,
        .ant-table-content,
        .ant-table-body {
          background: #ffffff !important;
          color: #0f172a !important;
        }
        .ant-table-thead > tr > th,
        .ant-table-thead > tr > td {
          background: #f1f5f9 !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
          font-weight: 600 !important;
        }
        .ant-table-tbody > tr > td {
          background: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
        }
        .ant-table-tbody > tr:hover > td,
        .ant-table-tbody > tr.ant-table-row:hover > td {
          background: #f8fafc !important;
        }
        .ant-table-tbody > tr.pricing-ghost-row > td {
          background: #f1f5f9 !important;
          color: #94a3b8 !important;
        }
        .ant-tag-blue,
        .ant-tag[class*="blue"] {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          border-color: #bfdbfe !important;
        }
        .ant-tag {
          background: #f8fafc !important;
          color: #334155 !important;
          border-color: #e2e8f0 !important;
        }
        .ant-table-cell-row-hover {
          background: #f8fafc !important;
        }
        /* Force Ant Design Timeline to light mode */
        .ant-timeline-item-head,
        .ant-timeline-item-head-custom,
        .ant-timeline-item-head-blue {
          background: #ffffff !important;
          border-color: #3b82f6 !important;
          color: #3b82f6 !important;
        }
        .ant-timeline-item-tail {
          border-inline-start-color: #e2e8f0 !important;
        }
        .ant-timeline .ant-timeline-item-head {
          background-color: #ffffff !important;
        }
        /* Override icon color inside timeline dot */
        .ant-timeline-item-head .anticon {
          color: #475569 !important;
        }
      `}</style>
      <div style={{
        minHeight: '133vh',
        background: '#eef2f6',
        padding: '32px',
        width: '133%',
        transform: 'scale(0.75)',
        transformOrigin: 'top left',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#0f172a',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ width: '210mm', maxWidth: '100%' }}>
          {blocks.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '100px', fontSize: '1.2rem' }}>
              Document live preview starts here...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="preview-blocks-container">
              {coverBlock && (
                <div dangerouslySetInnerHTML={{ __html: generateCoverHtml(coverBlock) }} />
              )}

              {blocks.length > 1 && (
                <div dangerouslySetInnerHTML={{ __html: generateTocHtml(blocks, proposalTitle) }} />
              )}

              <div style={{ background: 'white', color: '#0f172a', padding: '32px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', minHeight: '297mm' }}>
                {contentBlocks.map((block) => (
                  <div key={block.id} id={`preview-block-${block.id}`} style={{ scrollMarginTop: '20px', marginBottom: '32px' }}>
                    <BlockRenderer type={block.type} data={block.data} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div>Loading preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
