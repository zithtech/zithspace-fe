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
  AppstoreAddOutlined,
} from '@ant-design/icons';
import { BlockType, useProposalStore } from '@/store/proposalStore';

const { Text } = Typography;

type BlockMeta = {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  ring: string;
};

export const BLOCK_META: BlockMeta[] = [
  { type: 'cover',     label: 'Cover Page',         icon: <LayoutOutlined />,   color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  ring: 'rgba(59,130,246,0.25)' },
  { type: 'text',      label: 'Summary',            icon: <AlignLeftOutlined />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)',  ring: 'rgba(139,92,246,0.25)' },
  { type: 'scope',     label: 'Scope of Work',      icon: <ProjectOutlined />,   color: '#10b981', bg: 'rgba(16,185,129,0.10)',  ring: 'rgba(16,185,129,0.25)' },
  { type: 'timeline',  label: 'Timeline & Schedule',icon: <CalendarOutlined />,  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  ring: 'rgba(245,158,11,0.25)' },
  { type: 'pricing',   label: 'Pricing Table',      icon: <DollarOutlined />,    color: '#06b6d4', bg: 'rgba(6,182,212,0.10)',   ring: 'rgba(6,182,212,0.25)' },
  { type: 'signature', label: 'Signature',          icon: <EditOutlined />,      color: '#ec4899', bg: 'rgba(236,72,153,0.10)',  ring: 'rgba(236,72,153,0.25)' },
];

const DraggableBlock = ({ meta }: { meta: BlockMeta }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${meta.type}`,
    data: { type: meta.type, fromPalette: true },
  });

  const addBlock = useProposalStore((state) => state.addBlock);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => addBlock(meta.type)}
      className="palette-block"
      style={{
        ['--bk-color' as any]: meta.color,
        ['--bk-bg' as any]: meta.bg,
        ['--bk-ring' as any]: meta.ring,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="palette-block__icon">{meta.icon}</div>
      <Text strong className="palette-block__label">{meta.label}</Text>
    </div>
  );
};

const AddSectionCTA = () => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-section`,
    data: { type: 'section', fromPalette: true },
  });
  const addBlock = useProposalStore((state) => state.addBlock);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => addBlock('section')}
      className="palette-block palette-block--cta"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="palette-block__icon palette-block__icon--cta">
        <PlusOutlined />
      </div>
      <Text strong className="palette-block__label palette-block__label--cta">Add Section</Text>
    </div>
  );
};

export const BlockPalette = ({ layout = 'vertical' }: { layout?: 'horizontal' | 'vertical' }) => {
  if (layout === 'horizontal') {
    return (
      <div className="palette-bar palette-bar--horizontal">
        <div className="palette-bar__title">
          <AppstoreAddOutlined style={{ fontSize: 14, color: 'var(--premium-blue)' }} />
          <Text strong>ADD BLOCKS</Text>
        </div>
        <div className="palette-bar__divider" />
        <div className="palette-bar__items no-scrollbar">
          {BLOCK_META.map((b) => (
            <DraggableBlock key={b.type} meta={b} />
          ))}
          <AddSectionCTA />
        </div>
      </div>
    );
  }

  return (
    <div className="palette-bar palette-bar--vertical">
      <div className="palette-bar__heading">
        <div className="palette-bar__heading-row">
          <AppstoreAddOutlined style={{ fontSize: 16, color: 'var(--premium-blue)' }} />
          <Text strong className="palette-bar__heading-title">Block Library</Text>
        </div>
        <Text className="palette-bar__heading-sub">Click to append · Drag to position</Text>
      </div>

      <div className="palette-bar__items palette-bar__items--vertical no-scrollbar">
        {BLOCK_META.map((b) => (
          <DraggableBlock key={b.type} meta={b} />
        ))}
        <div className="palette-bar__sep" />
        <AddSectionCTA />
      </div>
    </div>
  );
};
