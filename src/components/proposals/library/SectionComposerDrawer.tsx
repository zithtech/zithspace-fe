'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, Button, Input, Switch, Segmented, message } from 'antd';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, Layers, Sparkles, Wand2, Eye, Pencil } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { SectionComponent, LibrarySection, SectionCategory, SectionType } from '@/store/proposalLibraryStore';
import {
  PALETTE, GROUP_ORDER, createComponent, ComposerBlockView, kindLabel,
} from './composerComponents';
import {
  CATEGORY_META, SECTION_CATEGORIES, SECTION_TYPES, SECTION_TYPE_META, SECTION_TYPE_PURPOSE, typeMeta,
} from './sectionMeta';

export interface ComposerPayload {
  name: string;
  category: SectionCategory;
  type: SectionType;
  description?: string;
  isGlobal: boolean;
  components: SectionComponent[];
}

interface Props {
  open: boolean;
  initial?: LibrarySection | null;
  onClose: () => void;
  onSave: (payload: ComposerPayload) => void;
}

// ── A draggable / selectable block on the canvas ──────────────────────────
const CanvasBlock: React.FC<{
  component: SectionComponent;
  selected: boolean;
  editable: boolean;
  onSelect: () => void;
  onChange: (props: Record<string, any>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}> = ({ component, selected, editable, onSelect, onChange, onDuplicate, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: component.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cmp-block ${selected ? 'is-selected' : ''} ${editable ? '' : 'is-preview'}`}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {editable && (
        <div className="cmp-block__bar">
          <span className="cmp-block__kind">{kindLabel(component.kind, component.props)}</span>
          <span className="cmp-block__bar-actions">
            <button className="cmp-block__btn" {...attributes} {...listeners} title="Drag to reorder"><GripVertical size={13} /></button>
            <button className="cmp-block__btn" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicate"><Copy size={13} /></button>
            <button className="cmp-block__btn cmp-block__btn--danger" onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remove"><Trash2 size={13} /></button>
          </span>
        </div>
      )}
      <div className="cmp-block__body">
        <ComposerBlockView component={component} editable={editable} onChange={onChange} />
      </div>
    </div>
  );
};

export const SectionComposerDrawer: React.FC<Props> = ({ open, initial, onClose, onSave }) => {
  const [messageApi, holder] = message.useMessage();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SectionCategory>('Custom');
  const [type, setType] = useState<SectionType>('text');
  const [description, setDescription] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [components, setComponents] = useState<SectionComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [paletteQuery, setPaletteQuery] = useState('');

  // hydrate on open
  useEffect(() => {
    if (!open) return;
    setName(initial?.name || '');
    setCategory(initial?.category || 'Custom');
    setType(initial?.type || 'text');
    setDescription(initial?.description || '');
    setIsGlobal(initial?.isGlobal || false);
    setComponents(initial?.components?.length ? initial.components.map((c) => ({ ...c })) : []);
    setSelectedId(null);
    setMode('edit');
    setPaletteQuery('');
  }, [open, initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addComponent = (kind: string, preset?: Record<string, any>) => {
    const c = createComponent(kind, preset);
    setComponents((prev) => [...prev, c]);
    setSelectedId(c.id);
  };
  const updateComponent = (id: string, props: Record<string, any>) =>
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, props } : c)));
  const duplicateComponent = (id: string) =>
    setComponents((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: nanoid(), props: { ...prev[idx].props } };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  const removeComponent = (id: string) =>
    setComponents((prev) => prev.filter((c) => c.id !== id));

  const onDragEnd = (e: any) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setComponents((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const groupedPalette = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    return GROUP_ORDER.map((g) => [
      g,
      PALETTE.filter((p) => p.group === g && (!q || `${p.label} ${p.blurb}`.toLowerCase().includes(q))),
    ] as const).filter(([, items]) => items.length > 0);
  }, [paletteQuery]);

  const selected = components.find((c) => c.id === selectedId) || null;

  const handleSave = () => {
    if (!name.trim()) { messageApi.warning('Give the section a name'); return; }
    if (components.length === 0) { messageApi.warning('Add at least one component'); return; }
    onSave({ name: name.trim(), category, type, description, isGlobal, components });
  };

  const setSelectedProps = (patch: Record<string, any>) => {
    if (!selected) return;
    updateComponent(selected.id, { ...selected.props, ...patch });
  };

  const meta = typeMeta(type);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width={Math.min(1240, typeof window !== 'undefined' ? window.innerWidth - 48 : 1240)}
      closable={false}
      styles={{ body: { padding: 0, background: 'var(--bg-secondary, #eef2f7)' }, header: { display: 'none' } }}
      rootClassName="cmp-drawer-root"
    >
      {holder}
      <div className="cmp">
        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div className="cmp-topbar">
          <div className="cmp-topbar__brand">
            <span className="cmp-topbar__logo" style={{ borderRadius: '12px' }}><Layers size={18} /></span>
            <div>
              <div className="cmp-topbar__title">Section Composer</div>
              <div className="cmp-topbar__sub">Assemble UI components · content is filled in the builder</div>
            </div>
          </div>
          <div className="cmp-topbar__actions">
            <Segmented
              style={{ borderRadius: '12px' }}
              value={mode}
              onChange={(v) => setMode(v as 'edit' | 'preview')}
              options={[
                { label: <span className="cmp-seg"><Pencil size={13} /> Edit</span>, value: 'edit' },
                { label: <span className="cmp-seg"><Eye size={13} /> Preview</span>, value: 'preview' },
              ]}
            />
            <Button style={{ borderRadius: '12px' }} onClick={onClose}>Cancel</Button>
            <Button style={{ borderRadius: '12px' }} type="primary" icon={<Sparkles size={14} />} onClick={handleSave}>
              {initial ? 'Save Section' : 'Create Section'}
            </Button>
          </div>
        </div>

        {/* ── Meta strip ───────────────────────────────────────────── */}
        <div className="cmp-meta">
          <Input
            className="cmp-meta__name"
            style={{ borderRadius: '12px' }}
            placeholder="Untitled section name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="borderless"
          />
          <div className="cmp-meta__fields">
            <SearchableDropdown
              triggerLabel="Category"
              value={category}
              onChange={(v) => v && setCategory(v as SectionCategory)}
              allowClear={false}
              searchPlaceholder="Search categories"
              itemNoun="categories"
              width={210}
              style={{ minWidth: 150 }}
              options={SECTION_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_META[c].label }))}
            />
            <SearchableDropdown
              triggerLabel="Type"
              value={type}
              onChange={(v) => v && setType(v as SectionType)}
              allowClear={false}
              searchPlaceholder="Search types"
              itemNoun="types"
              width={230}
              style={{ minWidth: 150 }}
              options={SECTION_TYPES.map((t) => ({ value: t, label: SECTION_TYPE_META[t].label, description: SECTION_TYPE_PURPOSE[t] }))}
            />
            <span className="cmp-meta__global" style={{ borderRadius: '12px' }}>
              <Switch size="small" checked={isGlobal} onChange={setIsGlobal} />
              Global
            </span>
          </div>
        </div>

        {/* ── Main: palette | canvas | properties ──────────────────── */}
        <div className="cmp-main">
          {/* Palette */}
          <div className="cmp-palette">
            <div className="cmp-palette__search">
              <Input
                style={{ borderRadius: '12px' }}
                size="small" allowClear placeholder="Search components"
                value={paletteQuery} onChange={(e) => setPaletteQuery(e.target.value)}
              />
            </div>
            <div className="cmp-palette__scroll">
              {groupedPalette.map(([group, items]) => (
                <div key={group} className="cmp-palette__group">
                  <div className="cmp-palette__label">{group}</div>
                  {items.map((p) => (
                    <button key={p.paletteId} type="button" className="cmp-palette__item" onClick={() => addComponent(p.kind, p.preset)}>
                      <span className="cmp-palette__ic" style={{ color: p.accent, background: `${p.accent}14`, borderRadius: '10px' }}>{p.icon}</span>
                      <span className="cmp-palette__text">
                        <span className="cmp-palette__name">{p.label}</span>
                        <span className="cmp-palette__blurb">{p.blurb}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="cmp-canvas" onClick={() => setSelectedId(null)}>
            <div className="cmp-paper">
              {components.length === 0 ? (
                <div className="cmp-empty">
                  <div className="cmp-empty__orb"><Wand2 size={28} /></div>
                  <div className="cmp-empty__title">Compose your section</div>
                  <div className="cmp-empty__sub">Pick UI components from the left to design the structure.<br />Your team fills the actual content inside the proposal builder.</div>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    {components.map((c) => (
                      <CanvasBlock
                        key={c.id}
                        component={c}
                        selected={mode === 'edit' && selectedId === c.id}
                        editable={mode === 'edit'}
                        onSelect={() => setSelectedId(c.id)}
                        onChange={(props) => updateComponent(c.id, props)}
                        onDuplicate={() => duplicateComponent(c.id)}
                        onRemove={() => removeComponent(c.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Properties */}
          <div className="cmp-props">
            {selected ? (
              <div className="cmp-props__body">
                <div className="cmp-props__head">
                  <span className="cmp-props__ic" style={{ color: typeMeta(type).color }}>{PALETTE.find((p) => p.kind === selected.kind)?.icon}</span>
                  <span className="cmp-props__title">{kindLabel(selected.kind, selected.props)}</span>
                </div>

                {selected.kind === 'callout' && (
                  <div className="cmp-props__field">
                    <label>Variant</label>
                    <Segmented
                      block
                      value={selected.props.variant}
                      onChange={(v) => setSelectedProps({ variant: v })}
                      options={[
                        { label: 'Info', value: 'info' },
                        { label: 'Success', value: 'success' },
                        { label: 'Warn', value: 'warning' },
                        { label: 'Excl.', value: 'danger' },
                      ]}
                    />
                  </div>
                )}
                {selected.kind === 'spacer' && (
                  <div className="cmp-props__field">
                    <label>Spacing</label>
                    <Segmented block value={selected.props.size} onChange={(v) => setSelectedProps({ size: v })}
                      options={[{ label: 'S', value: 'sm' }, { label: 'M', value: 'md' }, { label: 'L', value: 'lg' }]} />
                  </div>
                )}
                {selected.kind === 'gallery' && (
                  <div className="cmp-props__field">
                    <label>Columns</label>
                    <Segmented block value={String(selected.props.columns || 3)} onChange={(v) => setSelectedProps({ columns: Number(v) })}
                      options={['2', '3', '4', '5'].map((n) => ({ label: n, value: n }))} />
                  </div>
                )}
                {selected.kind === 'phase' && (
                  <>
                    <div className="cmp-props__field">
                      <label>Badge</label>
                      <Input size="small" value={selected.props.badge} onChange={(e) => setSelectedProps({ badge: e.target.value })} />
                    </div>
                    <div className="cmp-props__field">
                      <label>Title</label>
                      <Input size="small" value={selected.props.title} onChange={(e) => setSelectedProps({ title: e.target.value })} />
                    </div>
                  </>
                )}

                <div className="cmp-props__note">
                  <Sparkles size={12} />
                  <span>Labels &amp; structure are saved here. The actual copy is entered when this section is used in a proposal.</span>
                </div>

                <div className="cmp-props__row-actions">
                  <Button size="small" icon={<Copy size={13} />} onClick={() => duplicateComponent(selected.id)} block>Duplicate</Button>
                  <Button size="small" danger icon={<Trash2 size={13} />} onClick={() => { removeComponent(selected.id); setSelectedId(null); }} block>Remove</Button>
                </div>
              </div>
            ) : (
              <div className="cmp-props__body">
                <div className="cmp-props__head">
                  <span className="cmp-props__ic" style={{ color: meta.color }}>{meta.icon}</span>
                  <span className="cmp-props__title">Section Overview</span>
                </div>
                <div className="cmp-props__field">
                  <label>Description</label>
                  <Input.TextArea
                    size="small" autoSize={{ minRows: 2, maxRows: 4 }}
                    placeholder="What is this section for?"
                    value={description} onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="cmp-props__stat-row">
                  <div className="cmp-props__stat"><b>{components.length}</b><span>components</span></div>
                  <div className="cmp-props__stat"><b>{CATEGORY_META[category].label}</b><span>category</span></div>
                </div>
                <div className="cmp-props__note">
                  <Sparkles size={12} />
                  <span>Select any component on the canvas to edit its settings.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
