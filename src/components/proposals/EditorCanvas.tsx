import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProposalStore, ProposalBlock } from '@/store/proposalStore';
import { BlockRenderer } from './blocks';
import { HolderOutlined, DeleteOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { useDroppable } from '@dnd-kit/core';
import { Sparkles } from 'lucide-react';
import { getBlockStatus, STATUS_LABEL } from './blockStatus';
import { resolveTheme, resolveFont } from './themePresets';

// Only composed components edit in place on the canvas; text/section and the
// structured blocks are edited in the right-side properties panel.
const INLINE_TYPES = ['component'];

const InterBlockInserter = ({ index }: { index: number }) => {
  const addBlock = useProposalStore((state) => state.addBlock);
  // Only the centered pill is clickable — the rest of the strip passes clicks
  // through (pointer-events: none in CSS) so it never covers an adjacent
  // block's toolbar (drag/status/delete).
  return (
    <div className="pb-inserter-slot">
      <button
        type="button"
        className="pb-block-inserter"
        onClick={(e) => {
          e.stopPropagation();
          addBlock('section', index);
        }}
      >
        <PlusOutlined style={{ fontSize: 9 }} />
        <span>Add Section</span>
      </button>
    </div>
  );
};

const SortableBlock = ({ id, type, data, isSelected, onClick, onRemove, onUpdate, onAddBelow }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [isHovered, setIsHovered] = React.useState(false);
  const status = getBlockStatus({ id, type, data } as ProposalBlock);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 0.22s cubic-bezier(.4,0,.2,1)',
    opacity: isDragging ? 0.3 : 1,
    position: 'relative' as const,
    background: 'var(--bg-pure-white)',
    zIndex: isSelected ? 2 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      id={`editor-block-${id}`}
      data-block-id={id}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection halo */}
      {isSelected && <div className="pb-block-halo" />}

      {/* Floating toolbar */}
      {(isSelected || isHovered) && (
        <div className="pb-floating-toolbar">
          <div {...attributes} {...listeners} className="pb-tb-btn pb-tb-grip" title="Drag to reorder">
            <HolderOutlined style={{ fontSize: 12 }} />
            <span>{type.toUpperCase()}</span>
          </div>
          <span className={`pb-tb-status pb-tb-status--${status}`} title={STATUS_LABEL[status]}>
            <span className="pb-tb-status__dot" />
            <span className="pb-tb-status__label">{STATUS_LABEL[status]}</span>
          </span>
          <span className="pb-tb-sep" />
          <button
            type="button"
            className="pb-tb-btn pb-tb-btn--danger"
            title="Delete this section"
            onClick={(e) => { e.stopPropagation(); onRemove(id); }}
          >
            <DeleteOutlined style={{ fontSize: 12 }} />
          </button>
        </div>
      )}

      <div
        className="pb-block-content"
        style={{ padding: 0, userSelect: 'text' }}
      >
        <BlockRenderer type={type} data={data} editable={INLINE_TYPES.includes(type)} onChange={onUpdate} />
      </div>
    </div>
  );
};

export const EditorCanvas = () => {
  const { blocks, selectedBlockId, setSelectedBlockId, removeBlock, updateBlock, documentTheme } = useProposalStore();
  const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });

  const theme = resolveTheme(documentTheme.themeId);
  const font = resolveFont(documentTheme.fontId);

  // CSS vars applied to the paper:
  // - --premium-blue is overridden inside the paper so any element relying on it
  //   (cover "PROPOSAL FOR" label, section icons, accents) picks up the chosen theme
  // - --pb-doc-font cascades to all text within the paper
  const paperStyle = {
    ['--premium-blue' as any]: theme.accent,
    ['--pb-doc-accent' as any]: theme.accent,
    ['--pb-doc-accent-from' as any]: theme.from,
    ['--pb-doc-accent-to' as any]: theme.to,
    fontFamily: font.family,
  } as React.CSSProperties;

  return (
    <div
      className="pb-canvas-wrapper"
      style={{
        padding: '0 0 80px 0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div id="proposal-builder-canvas" ref={setNodeRef} className="pb-paper" style={paperStyle}>
        <div className="pb-page-tag">
          <FileTextOutlined style={{ fontSize: 11 }} />
          <span>DOCUMENT · A4</span>
        </div>

        {blocks.length === 0 ? (
          <div className="pb-empty">
            <div className="pb-empty__badge">
              <Sparkles size={36} />
            </div>
            <div className="pb-empty__title">Start Building Your Proposal</div>
            <div className="pb-empty__sub">
              Drag a block from the palette or click to insert. Each section composes a beautiful, exportable
              document — pixel-perfect for clients.
            </div>
          </div>
        ) : (
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, index) => (
              <React.Fragment key={block.id}>
                <SortableBlock
                  id={block.id}
                  index={index}
                  type={block.type}
                  data={block.data}
                  isSelected={selectedBlockId === block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  onRemove={removeBlock}
                  onUpdate={(patch: any) => updateBlock(block.id, patch)}
                  onAddBelow={() => useProposalStore.getState().addBlock('section', index + 1)}
                />
                {index < blocks.length - 1 && (
                  <InterBlockInserter index={index + 1} />
                )}
              </React.Fragment>
            ))}
            <div onClick={() => useProposalStore.getState().addBlock('section', blocks.length)} className="pb-insert-cta">
              <PlusOutlined />
              <span>Insert Custom Section</span>
            </div>
          </SortableContext>
        )}
      </div>

      <div className="pb-canvas-meta">
        <span className="pb-canvas-meta__dot" />
        <span>Auto-saved</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{blocks.length} {blocks.length === 1 ? 'section' : 'sections'}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>Premium Layout</span>
      </div>
    </div>
  );
};
