import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProposalStore } from '@/store/proposalStore';
import { BlockRenderer } from './blocks';
import { Empty, Typography } from 'antd';
import { DragOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useDroppable } from '@dnd-kit/core';

const { Title, Text } = Typography;

const SortableBlock = ({ id, type, data, isSelected, onClick, onRemove, index }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [isHovered, setIsHovered] = React.useState(false);
  const addBlock = useProposalStore(state => state.addBlock);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 0.2s ease',
    opacity: isDragging ? 0.3 : 1,
    position: 'relative' as const,
    marginBottom: '2px', // Tighten the gap for a seamless document feel
    background: '#ffffff',
    zIndex: isSelected ? 2 : 1,
  };

  const selectionOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: isSelected ? '-6px -24px' : '-4px 0', // Significantly wider on sides when selected
    border: isSelected ? '3px solid #3b82f6' : '1px solid transparent',
    borderRadius: '16px',
    boxShadow: isSelected ? '0 0 0 6px rgba(59, 130, 246, 0.15), 0 8px 24px rgba(59, 130, 246, 0.1)' : 'none',
    pointerEvents: 'none',
    zIndex: 10,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
      {/* Selection Halo */}
      <div style={selectionOverlayStyle} />

      {/* Floating Toolbar */}
      <div style={{
        position: 'absolute',
        top: -24,
        left: 12,
        display: (isSelected || isHovered) ? 'flex' : 'none',
        gap: '4px',
        zIndex: 20,
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div
          {...attributes}
          {...listeners}
          style={{
            background: '#ffffff',
            color: 'var(--text-secondary)',
            padding: '4px 8px',
            borderRadius: '6px 6px 0 0',
            border: '1px solid var(--border-color)',
            borderBottom: 'none',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.75rem',
            fontWeight: 600,
            gap: '6px',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
          }}
        >
          <DragOutlined style={{ fontSize: '12px' }} />
          <span>{type.toUpperCase()}</span>
        </div>
        <div
          onClick={(e) => { e.stopPropagation(); onRemove(id); }}
          style={{
            background: '#fff1f2',
            color: '#f43f5e',
            padding: '4px 8px',
            borderRadius: '6px 6px 0 0',
            border: '1px solid #fecdd3',
            borderBottom: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
          }}
        >
          <DeleteOutlined style={{ fontSize: '12px' }} />
        </div>
      </div>

      <div style={{ padding: '0', pointerEvents: 'none' }}>
        <BlockRenderer type={type} data={data} />
      </div>

      {/* Inter-block Hover Indicator */}
      {isHovered && !isSelected && (
        <div
          onClick={(e) => { e.stopPropagation(); addBlock('section', index + 1); }}
          style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#3b82f6',
            color: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '12px',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            zIndex: 30,
            cursor: 'pointer'
          }}
        >
          <PlusOutlined style={{ fontSize: '10px' }} />
        </div>
      )}
    </div>
  );
};

export const EditorCanvas = () => {
  const { blocks, selectedBlockId, setSelectedBlockId, removeBlock } = useProposalStore();
  const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });

  return (
    <div style={{
      padding: '0 0 80px 0',
      background: '#ffffff', // Pure white backdrop
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Document Sheet Frame */}
      <div
        id="proposal-builder-canvas"
        ref={setNodeRef}
        style={{
          width: '100%',
          maxWidth: '1100px',
          minHeight: '1100px', // A4-ish minimum height
          background: '#ffffff',
          borderRadius: '4px',
          padding: '40px 60px', // Proper document margins
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 0.3s ease'
        }}
      >
        {blocks.length === 0 ? (
          <div style={{
            height: '600px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: '12px',
            border: '2px dashed var(--border-color)',
            textAlign: 'center',
            padding: '60px 40px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'var(--bg-blue-50)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <DragOutlined style={{ fontSize: '32px', color: '#3b82f6' }} />
            </div>
            <Title level={4} style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Start Building Your Proposal</Title>
            <Text style={{ color: 'var(--text-secondary)', maxWidth: '300px' }}>
              Drag your first block from the palette on the left to begin creating a premium document.
            </Text>
          </div>
        ) : (
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
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
            {/* Final Add Section Button at the bottom */}
            <div
              onClick={() => useProposalStore.getState().addBlock('section', blocks.length)}
              style={{
                marginTop: '12px',
                padding: '12px',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
            >
              <PlusOutlined />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Insert Custom Section</span>
            </div>
          </SortableContext>
        )}
      </div>

      {/* Canvas Footer Info */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Text style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Document Auto-saved • {blocks.length} Sections Active
        </Text>
      </div>
    </div>
  );
};
