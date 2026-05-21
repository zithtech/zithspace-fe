'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useProposalStore } from '@/store/proposalStore';
import { BlockPalette } from './BlockPalette';
import { getBlockStatus, BLOCK_LABEL } from './blockStatus';
import { ListOrdered, Library, GripVertical } from 'lucide-react';

type Tab = 'outline' | 'library';
type Layout = 'vertical' | 'horizontal';

interface LeftRailProps {
  onJumpToBlock?: (blockId: string) => void;
  layout?: Layout;
}

export const LeftRail: React.FC<LeftRailProps> = ({ onJumpToBlock, layout = 'vertical' }) => {
  const { blocks, selectedBlockId, setSelectedBlockId } = useProposalStore();
  const [tab, setTab] = useState<Tab>('outline');
  const railRef = useRef<HTMLDivElement>(null);

  const handleSelect = (id: string) => {
    setSelectedBlockId(id);
    onJumpToBlock?.(id);
  };

  const isHorizontal = layout === 'horizontal';

  // Whenever the active block changes (from the right panel, canvas click,
  // command palette, etc.), bring the matching outline item into view. If the
  // user is on the Library tab, switch to Outline so they see the change.
  useEffect(() => {
    if (!selectedBlockId) return;
    if (tab !== 'outline') setTab('outline');

    // Defer to the next frame so the DOM has the new active class and any
    // pending tab switch has rendered.
    const raf = requestAnimationFrame(() => {
      const root = railRef.current;
      if (!root) return;
      const el = root.querySelector(
        `[data-rail-block-id="${selectedBlockId}"]`,
      ) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    });
    return () => cancelAnimationFrame(raf);
    // We only want to react to selection changes, not internal tab toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlockId]);

  return (
    <div ref={railRef} className={`pb-rail pb-rail--${layout}`}>
      <div className="pb-rail__tabs">
        <button
          type="button"
          className={`pb-rail__tab ${tab === 'outline' ? 'pb-rail__tab--active' : ''}`}
          onClick={() => setTab('outline')}
        >
          <ListOrdered size={13} />
          <span>Outline</span>
          {isHorizontal && blocks.length > 0 && (
            <span className="pb-rail__tab-count">{blocks.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`pb-rail__tab ${tab === 'library' ? 'pb-rail__tab--active' : ''}`}
          onClick={() => setTab('library')}
        >
          <Library size={13} />
          <span>Library</span>
        </button>
      </div>

      <div className="pb-rail__body">
        {tab === 'outline' ? (
          <div className="pb-rail__outline">
            {!isHorizontal && (
              <div className="pb-rail__outline-head">
                <span className="pb-section-label">
                  <span className="pb-section-label__dot" />
                  Document Outline
                </span>
                <span className="pb-rail__count">{blocks.length}</span>
              </div>
            )}

            {blocks.length === 0 ? (
              <div className="pb-rail__empty">
                <div className="pb-rail__empty-icon">
                  <ListOrdered size={isHorizontal ? 16 : 20} />
                </div>
                <div className="pb-rail__empty-title">No sections yet</div>
                {!isHorizontal && (
                  <div className="pb-rail__empty-sub">
                    Switch to <strong>Library</strong> to add your first block.
                  </div>
                )}
              </div>
            ) : isHorizontal ? (
              <div className="pb-rail__cards no-scrollbar">
                {blocks.map((block, idx) => {
                  const status = getBlockStatus(block);
                  const isActive = block.id === selectedBlockId;
                  return (
                    <button
                      key={block.id}
                      type="button"
                      data-rail-block-id={block.id}
                      onClick={() => handleSelect(block.id)}
                      className={`pb-rail__card pb-rail__card--${status} ${
                        isActive ? 'pb-rail__card--active' : ''
                      }`}
                    >
                      <span className="pb-rail__card-idx">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="pb-rail__card-name">{BLOCK_LABEL[block.type]}</span>
                      <span className={`pb-rail__status-dot pb-rail__status-dot--${status}`} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <ol className="pb-rail__list">
                {blocks.map((block, idx) => {
                  const status = getBlockStatus(block);
                  const isActive = block.id === selectedBlockId;
                  return (
                    <li key={block.id}>
                      <button
                        type="button"
                        data-rail-block-id={block.id}
                        onClick={() => handleSelect(block.id)}
                        className={`pb-rail__item pb-rail__item--${status} ${
                          isActive ? 'pb-rail__item--active' : ''
                        }`}
                      >
                        <span className="pb-rail__handle">
                          <GripVertical size={12} />
                        </span>
                        <span className="pb-rail__idx">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="pb-rail__name">{BLOCK_LABEL[block.type]}</span>
                        <span
                          className={`pb-rail__status-dot pb-rail__status-dot--${status}`}
                          title={status}
                        />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        ) : (
          <div className="pb-rail__library">
            <BlockPalette layout={isHorizontal ? 'horizontal' : 'vertical'} />
          </div>
        )}
      </div>

      {isHorizontal ? (
        <div className="pb-rail__hint-inline">
          <kbd className="pb-rail__kbd">⌘</kbd>
          <kbd className="pb-rail__kbd">K</kbd>
          <span>commands</span>
        </div>
      ) : (
        <div className="pb-rail__footer">
          <kbd className="pb-rail__kbd">⌘</kbd>
          <kbd className="pb-rail__kbd">K</kbd>
          <span className="pb-rail__hint">for command menu</span>
        </div>
      )}
    </div>
  );
};
