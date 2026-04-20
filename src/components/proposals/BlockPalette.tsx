import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Typography } from 'antd';
import {
  LayoutOutlined,
  AlignLeftOutlined,
  DollarOutlined,
  EditOutlined,
  ProjectOutlined,
  CalendarOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { BlockType, useProposalStore } from '@/store/proposalStore';

const { Text } = Typography;

const DraggableBlock = ({ type, label, icon }: { type: BlockType, label: string, icon: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true }
  });

  const addBlock = useProposalStore(state => state.addBlock);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => addBlock(type, 0)} // KEEP: Click adds at the top
      style={{
        padding: '12px 14px',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        background: '#ffffff',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.1s ease',
        whiteSpace: 'nowrap',
        userSelect: 'none'
      }}
    >
      <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>{icon}</div>
      <Text strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{label}</Text>
    </div>
  );
};

export const BlockPalette = ({ layout = 'vertical' }: { layout?: 'horizontal' | 'vertical' }) => {
  const blocks: { type: BlockType, label: string, icon: React.ReactNode }[] = [
    { type: 'cover', label: 'Cover Page', icon: <LayoutOutlined /> },
    { type: 'text', label: 'Summary', icon: <AlignLeftOutlined /> },
    { type: 'scope', label: 'Scope of Work', icon: <ProjectOutlined /> },
    { type: 'timeline', label: 'Timeline & Schedule', icon: <CalendarOutlined /> },
    { type: 'pricing', label: 'Pricing Table', icon: <DollarOutlined /> },
    { type: 'signature', label: 'Signature', icon: <EditOutlined /> },
    { type: 'section', label: 'Add Section', icon: <PlusOutlined style={{ color: '#3b82f6' }} /> },
  ];

  if (layout === 'horizontal') {
    return (
      <div style={{ padding: '8px 16px', background: '#ffffff', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', width: '100%', overflowX: 'auto', gap: '12px' }}>
        <div style={{ marginRight: '8px', flexShrink: 0 }}>
          <Text strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ADD BLOCKS</Text>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flex: 1, alignItems: 'center' }}>
          {blocks.map((b) => (
            <DraggableBlock key={b.type} {...b} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', background: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <Text strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Add Blocks</Text>
        <Text style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Click or drag to the top.</Text>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }} className="no-scrollbar">
        {blocks.map((b) => (
          <DraggableBlock key={b.type} {...b} />
        ))}
      </div>
    </div>
  );
};
