import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Typography, Card } from 'antd';
import { LayoutOutlined, AlignLeftOutlined, DollarOutlined, EditOutlined, ProjectOutlined, CalendarOutlined } from '@ant-design/icons';
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
      onClick={() => addBlock(type)}
      style={{
        padding: '12px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        background: '#ffffff',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transition: 'box-shadow 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>{icon}</div>
      <Text strong style={{ color: '#334155' }}>{label}</Text>
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
  ];

  if (layout === 'horizontal') {
    return (
      <div style={{ padding: '8px 16px', background: '#ffffff', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', width: '100%', overflowX: 'auto' }}>
        <div style={{ marginRight: '16px', flexShrink: 0 }}>
          <Text strong style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a' }}>Add Blocks</Text>
          <Text style={{ display: 'block', color: '#64748b', fontSize: '0.7rem' }}>Click or drag</Text>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flex: 1, alignItems: 'center' }}>
          {blocks.map((b) => (
            <DraggableBlock key={b.type} type={b.type} label={b.label} icon={b.icon} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', background: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Text strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a', marginBottom: '12px' }}>Add Blocks</Text>
      <Text style={{ display: 'block', color: '#64748b', marginBottom: '16px', fontSize: '0.85rem' }}>Click or drag blocks to build your proposal.</Text>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {blocks.map((b) => (
          <DraggableBlock key={b.type} type={b.type} label={b.label} icon={b.icon} />
        ))}
      </div>
    </div>
  );
};
