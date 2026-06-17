'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Input } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { Blocks, Plus } from 'lucide-react';
import {
  useProposalLibraryStore, LibrarySection, SectionCategory,
} from '@/store/proposalLibraryStore';
import { CATEGORY_META, CATEGORY_ORDER, typeMeta } from './sectionMeta';

const DraggableSection: React.FC<{ section: LibrarySection; onAdd: (s: LibrarySection) => void }> = ({ section, onAdd }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lib-${section.id}`,
    data: { fromLibrary: true, sectionId: section.id },
  });
  const meta = typeMeta(section.type);
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={() => onAdd(section)}
      className="slib-item"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      title={section.description}
    >
      <span className="slib-item__ic" style={{ background: meta.bg, color: meta.color }}>{meta.icon}</span>
      <span className="slib-item__name">{section.name}</span>
      <span className="slib-item__add"><PlusOutlined /></span>
    </button>
  );
};

export const SectionLibraryPanel: React.FC<{ onAdd: (s: LibrarySection) => void }> = ({ onAdd }) => {
  const router = useRouter();
  const sections = useProposalLibraryStore((s) => s.sections);
  const fetchSections = useProposalLibraryStore((s) => s.fetchSections);
  useEffect(() => { fetchSections(); }, [fetchSections]);
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const visible = sections.filter((s) => !s.archived && (!q || `${s.name} ${s.type} ${s.category}`.toLowerCase().includes(q)));
    const map = new Map<SectionCategory, LibrarySection[]>();
    visible.forEach((s) => {
      const arr = map.get(s.category) || [];
      arr.push(s);
      map.set(s.category, arr);
    });
    return CATEGORY_ORDER.map((c) => [c, map.get(c) || []] as const).filter(([, arr]) => arr.length > 0);
  }, [sections, search]);

  return (
    <div className="pbv2__pane pbv2__pane--left">
      <div className="pbv2__pane-head">
        <span className="pbv2__pane-title"><Blocks size={15} /> Sections</span>
        <button
          type="button"
          className="lib-chip"
          style={{ padding: '4px 9px', fontSize: 11.5 }}
          onClick={() => router.push('/proposals/sections')}
        >
          <Plus size={12} /> Create
        </button>
      </div>
      <div style={{ padding: '10px 10px 0' }}>
        <Input
          size="small"
          allowClear
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Search sections"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="pbv2__pane-scroll">
        {grouped.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12.5, padding: '30px 10px' }}>
            No sections match.
          </div>
        ) : grouped.map(([cat, items]) => (
          <div key={cat}>
            <div className="slib-group__label" style={{ color: CATEGORY_META[cat].color }}>
              {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
            </div>
            {items.map((s) => <DraggableSection key={s.id} section={s} onAdd={onAdd} />)}
          </div>
        ))}
      </div>
    </div>
  );
};
