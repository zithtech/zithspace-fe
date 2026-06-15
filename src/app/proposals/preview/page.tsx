'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { BlockRenderer } from '@/components/proposals/blocks';
import { ProposalBlock } from '@/store/proposalStore';
import { useSearchParams } from 'next/navigation';
import { ProposalService } from '@/services/proposalService';

function PreviewContent() {
  const [blocks, setBlocks] = useState<ProposalBlock[]>([]);
  const searchParams = useSearchParams();
  const theme = searchParams.get('theme') || 'light';
  const proposalId = searchParams.get('proposalId');

  useEffect(() => {
    // Apply theme to document element inside iframe
    document.documentElement.setAttribute('data-theme', theme);
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

  return (
    <div style={{ width: '100%', height: '100vh', overflowX: 'hidden', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <style>{`
        .preview-blocks-container div[id^="preview-block-"] > div {
          padding: 8px 24px !important;
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        padding: '32px',
        width: '100%',
        zoom: 0.75,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: 'var(--text-primary)'
      }}>
        {blocks.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '100px', fontSize: '1.2rem' }}>
            Document live preview starts here...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="preview-blocks-container">
            {blocks.map((block) => (
              <div key={block.id} id={`preview-block-${block.id}`} style={{ scrollMarginTop: '20px' }}>
                <BlockRenderer type={block.type} data={block.data} />
              </div>
            ))}
          </div>
        )}
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
