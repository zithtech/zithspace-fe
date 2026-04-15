'use client';

import React, { useEffect, useState } from 'react';
import { BlockRenderer } from '@/components/proposals/blocks';
import { ProposalBlock } from '@/store/proposalStore';

export default function PreviewPage() {
  const [blocks, setBlocks] = useState<ProposalBlock[]>([]);

  useEffect(() => {
    // Listen for messages from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_BLOCKS') {
        setBlocks(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Notify parent that iframe is ready to receive initial state
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', overflowX: 'hidden', overflowY: 'auto' }}>
      <div style={{ 
        minHeight: '100vh',
        background: '#ffffff', 
        padding: '32px',
        width: '100%',
        zoom: 0.75,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        {blocks.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '100px', fontSize: '1.2rem' }}>
            Document live preview starts here...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {blocks.map((block) => (
              <div key={block.id}>
                <BlockRenderer type={block.type} data={block.data} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
