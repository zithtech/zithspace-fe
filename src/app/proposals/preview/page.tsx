'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { BlockRenderer } from '@/components/proposals/blocks';
import { ProposalBlock } from '@/store/proposalStore';
import { useSearchParams } from 'next/navigation';

function PreviewContent() {
  const [blocks, setBlocks] = useState<ProposalBlock[]>([]);
  const searchParams = useSearchParams();
  const theme = searchParams.get('theme') || 'light';

  useEffect(() => {
    // Apply theme to document element inside iframe
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Listen for messages from parent window
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
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', overflowX: 'hidden', overflowY: 'auto', background: 'var(--bg-primary)' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
