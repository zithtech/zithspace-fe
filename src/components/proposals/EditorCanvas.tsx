import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProposalStore } from '@/store/proposalStore';
import { BlockRenderer } from './blocks';
import { DragOutlined, DeleteOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { useDroppable } from '@dnd-kit/core';
import { Sparkles } from 'lucide-react';

const SortableBlock = ({ id, type, data, isSelected, onClick, onRemove, index }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [isHovered, setIsHovered] = React.useState(false);
  const addBlock = useProposalStore((state) => state.addBlock);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 0.22s cubic-bezier(.4,0,.2,1)',
    opacity: isDragging ? 0.3 : 1,
    position: 'relative' as const,
    marginBottom: '2px',
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
          <div {...attributes} {...listeners} className="pb-tb-btn">
            <DragOutlined style={{ fontSize: 11 }} />
            <span>{type.toUpperCase()}</span>
          </div>
          <div className="pb-tb-btn pb-tb-btn--danger" onClick={(e) => { e.stopPropagation(); onRemove(id); }}>
            <DeleteOutlined style={{ fontSize: 11 }} />
          </div>
        </div>
      )}

      <div style={{ padding: 0, pointerEvents: 'none' }}>
        <BlockRenderer type={type} data={data} />
      </div>

      {/* Inter-block inserter */}
      {isHovered && !isSelected && (
        <div
          onClick={(e) => { e.stopPropagation(); addBlock('section', index + 1); }}
          className="pb-block-inserter"
        >
          <PlusOutlined style={{ fontSize: 10 }} />
        </div>
      )}
    </div>
  );
};

export const EditorCanvas = () => {
  const { blocks, selectedBlockId, setSelectedBlockId, removeBlock } = useProposalStore();
  const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });

  return (
    <div
      className="pb-canvas-wrapper"
      style={{
        padding: '0 0 80px 0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div id="proposal-builder-canvas" ref={setNodeRef} className="pb-paper">
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
              <SortableBlock
                key={block.id}
                id={block.id}
                index={index}
                type={block.type}
                data={block.data}
                isSelected={selectedBlockId === block.id}
                onClick={() => setSelectedBlockId(block.id)}
                onRemove={removeBlock}
              />
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
