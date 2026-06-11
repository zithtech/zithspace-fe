'use client';

import '@/app/proposals/library.css';
import React, { useLayoutEffect, useRef } from 'react';
import { Input } from 'antd';
import { nanoid } from 'nanoid';
import TiptapEditor from '@/components/common/TiptapEditor';
import TiptapViewer from '@/components/common/TiptapViewer';
import {
  Heading1, Flag, Minus, MoveVertical, Columns2, AlignLeft, List, CircleCheckBig,
  ListChecks, LayoutGrid, Info, CheckCircle2, AlertTriangle, OctagonAlert, Image as ImageIcon,
  Images, Video, DollarSign, Quote, MousePointerClick, PenLine, Plus, X, Table as TableIcon,
  ClipboardList, CalendarRange, Upload as UploadIcon, Link2,
} from 'lucide-react';
import type { SectionComponent } from '@/store/proposalLibraryStore';
import { EditableTable, makeDefaultTable } from '../blocks/EditableTable';

export type Group = 'Structure' | 'Content' | 'Callouts' | 'Media' | 'Commerce';

export interface PaletteItem {
  paletteId: string;
  kind: string;
  label: string;
  blurb: string;
  group: Group;
  icon: React.ReactNode;
  accent: string;             // palette icon colour (blue/green/ash only)
  preset?: Record<string, any>;
  /**
   * When set, picking this item in the proposal builder inserts a full proposal
   * block (rich renderer + its own right-panel settings) instead of an inline
   * composed component. Used by Pricing/Signature which have dedicated blocks.
   */
  blockType?: string;
}

const BLUE = '#2563eb';
const GREEN = '#059669';
const ASH = '#475569';

// ── Default props per kind ────────────────────────────────────────────────
const DEFAULTS: Record<string, () => Record<string, any>> = {
  heading: () => ({ text: 'Section Heading' }),
  phase: () => ({ badge: 'PHASE 1', title: 'Phase Title' }),
  divider: () => ({}),
  spacer: () => ({ size: 'md' }),
  twoColumn: () => ({ leftTitle: '', rightTitle: '', left: '', right: '' }),
  table: () => makeDefaultTable(),
  paragraph: () => ({ text: '' }),
  bullets: () => ({ items: ['First point', 'Second point', 'Third point'] }),
  scope: () => ({
    title: 'Scope of Work',
    phases: [
      { id: nanoid(), badge: 'PHASE 1', title: 'Phase Title', deliverable: '', tasks: ['Task one', 'Task two'] },
    ],
  }),
  timeline: () => ({
    title: 'Project Timeline',
    phases: [
      { id: nanoid(), title: 'Phase Title', deadline: '', description: '' },
    ],
  }),
  deliverable: () => ({ label: 'Major Deliverables', text: 'Describe the key deliverable for this phase.' }),
  tasklist: () => ({ label: 'Detailed Tasks', items: ['Task one', 'Task two', 'Task three'] }),
  keyvalue: () => ({ label: 'Highlights', rows: [{ k: 'Timeline', v: '6 weeks' }, { k: 'Team', v: '3 specialists' }] }),
  callout: () => ({ variant: 'info', title: 'Note', text: 'Add an important note for the client.' }),
  image: () => ({ src: '', caption: '' }),
  gallery: () => ({ columns: 3, images: [{ id: nanoid(), src: '' }, { id: nanoid(), src: '' }] }),
  video: () => ({ label: 'Embedded video' }),
  pricing: () => ({ label: 'Pricing', rows: [{ item: 'Service item', price: '$0' }] }),
  quote: () => ({ text: 'A glowing line about the results we delivered.', author: 'Client Name · Role' }),
  cta: () => ({ text: 'Accept Proposal' }),
  signature: () => ({}),
};

export const createComponent = (kind: string, preset?: Record<string, any>): SectionComponent => ({
  id: nanoid(),
  kind,
  props: { ...(DEFAULTS[kind]?.() || {}), ...(preset || {}) },
});

// ── Palette ───────────────────────────────────────────────────────────────
export const PALETTE: PaletteItem[] = [
  // Structure
  { paletteId: 'heading', kind: 'heading', label: 'Heading', blurb: 'Large section title', group: 'Structure', icon: <Heading1 size={16} />, accent: ASH },
  { paletteId: 'phase', kind: 'phase', label: 'Phase / Milestone', blurb: 'Badge + phase title', group: 'Structure', icon: <Flag size={16} />, accent: BLUE },
  { paletteId: 'twoColumn', kind: 'twoColumn', label: 'Two Columns', blurb: 'Side-by-side content', group: 'Structure', icon: <Columns2 size={16} />, accent: ASH },
  { paletteId: 'table', kind: 'table', label: 'Table', blurb: 'Resizable rows & columns', group: 'Structure', icon: <TableIcon size={16} />, accent: BLUE },
  { paletteId: 'divider', kind: 'divider', label: 'Divider', blurb: 'Horizontal rule', group: 'Structure', icon: <Minus size={16} />, accent: ASH },
  { paletteId: 'spacer', kind: 'spacer', label: 'Spacer', blurb: 'Vertical spacing', group: 'Structure', icon: <MoveVertical size={16} />, accent: ASH },
  // Content
  { paletteId: 'paragraph', kind: 'paragraph', label: 'Paragraph', blurb: 'Rich body text', group: 'Content', icon: <AlignLeft size={16} />, accent: ASH },
  { paletteId: 'bullets', kind: 'bullets', label: 'Bullet List', blurb: 'Simple bulleted points', group: 'Content', icon: <List size={16} />, accent: BLUE },
  { paletteId: 'scope', kind: 'scope', blockType: 'scope', label: 'Scope of Work', blurb: 'Phases · deliverables · tasks', group: 'Content', icon: <ClipboardList size={16} />, accent: GREEN },
  { paletteId: 'timeline', kind: 'timeline', blockType: 'timeline', label: 'Timeline & Schedule', blurb: 'Phased project schedule', group: 'Content', icon: <CalendarRange size={16} />, accent: BLUE },
  { paletteId: 'deliverable', kind: 'deliverable', label: 'Deliverable', blurb: 'Check + label + detail', group: 'Content', icon: <CircleCheckBig size={16} />, accent: GREEN },
  { paletteId: 'tasklist', kind: 'tasklist', label: 'Task List', blurb: 'Labelled task breakdown', group: 'Content', icon: <ListChecks size={16} />, accent: BLUE },
  { paletteId: 'keyvalue', kind: 'keyvalue', label: 'Highlights', blurb: 'Key-value grid', group: 'Content', icon: <LayoutGrid size={16} />, accent: GREEN },
  // Callouts
  { paletteId: 'callout-info', kind: 'callout', label: 'Info Callout', blurb: 'Blue note box', group: 'Callouts', icon: <Info size={16} />, accent: BLUE, preset: { variant: 'info', title: 'Client Requirements' } },
  { paletteId: 'callout-success', kind: 'callout', label: 'Success Callout', blurb: 'Green highlight box', group: 'Callouts', icon: <CheckCircle2 size={16} />, accent: GREEN, preset: { variant: 'success', title: "What's Included" } },
  { paletteId: 'callout-warning', kind: 'callout', label: 'Warning Callout', blurb: 'Amber caution box', group: 'Callouts', icon: <AlertTriangle size={16} />, accent: ASH, preset: { variant: 'warning', title: 'Please Note' } },
  { paletteId: 'callout-danger', kind: 'callout', label: 'Exclusion Callout', blurb: 'Red exclusion box', group: 'Callouts', icon: <OctagonAlert size={16} />, accent: ASH, preset: { variant: 'danger', title: 'Exclusions' } },
  // Media
  { paletteId: 'image', kind: 'image', label: 'Image', blurb: 'Single image block', group: 'Media', icon: <ImageIcon size={16} />, accent: BLUE },
  { paletteId: 'gallery', kind: 'gallery', label: 'Gallery', blurb: 'Image grid', group: 'Media', icon: <Images size={16} />, accent: BLUE },
  { paletteId: 'video', kind: 'video', label: 'Video Embed', blurb: 'Embedded video', group: 'Media', icon: <Video size={16} />, accent: ASH },
  // Commerce
  { paletteId: 'pricing', kind: 'pricing', blockType: 'pricing', label: 'Pricing Table', blurb: 'Investment table + totals', group: 'Commerce', icon: <DollarSign size={16} />, accent: GREEN },
  { paletteId: 'quote', kind: 'quote', label: 'Testimonial', blurb: 'Client quote', group: 'Commerce', icon: <Quote size={16} />, accent: GREEN },
  { paletteId: 'cta', kind: 'cta', label: 'CTA Button', blurb: 'Accept-proposal action', group: 'Commerce', icon: <MousePointerClick size={16} />, accent: BLUE },
  { paletteId: 'signature', kind: 'signature', blockType: 'signature', label: 'Signature', blurb: 'E-sign acceptance block', group: 'Commerce', icon: <PenLine size={16} />, accent: ASH },
];

export const GROUP_ORDER: Group[] = ['Structure', 'Content', 'Callouts', 'Media', 'Commerce'];

export const kindLabel = (kind: string, props: any): string => {
  if (kind === 'callout') return `${(props?.variant || 'info')[0].toUpperCase()}${(props?.variant || 'info').slice(1)} Callout`;
  const p = PALETTE.find((x) => x.kind === kind);
  return p?.label || kind;
};

export const CALLOUT_VARIANTS: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  info:    { color: '#2563eb', bg: 'rgba(37,99,235,0.05)',  border: 'rgba(37,99,235,0.25)',  icon: <Info size={14} /> },
  success: { color: '#059669', bg: 'rgba(5,150,105,0.05)',  border: 'rgba(5,150,105,0.25)',  icon: <CheckCircle2 size={14} /> },
  warning: { color: '#b45309', bg: 'rgba(180,83,9,0.05)',   border: 'rgba(180,83,9,0.22)',   icon: <AlertTriangle size={14} /> },
  danger:  { color: '#ef4444', bg: 'rgba(239,68,68,0.04)',  border: 'rgba(239,68,68,0.22)',  icon: <OctagonAlert size={14} /> },
};

// ── Inline editors ────────────────────────────────────────────────────────
const TextLine: React.FC<{ value: string; onChange?: (v: string) => void; placeholder?: string; className?: string; editable?: boolean }> =
  ({ value, onChange, placeholder, className, editable }) => {
    if (!editable) return <span className={className}>{value || placeholder}</span>;
    return (
      <input
        className={`cmp-inp ${className || ''}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    );
  };

const TextArea: React.FC<{ value: string; onChange?: (v: string) => void; placeholder?: string; className?: string; editable?: boolean }> =
  ({ value, onChange, placeholder, className, editable }) => {
    if (!editable) return <p className={className}>{value || placeholder}</p>;
    return (
      <textarea
        className={`cmp-inp cmp-inp--area ${className || ''}`}
        value={value}
        placeholder={placeholder}
        rows={2}
        onChange={(e) => onChange?.(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    );
  };

// Auto-growing textarea — expands to fit long content (no inner scroll).
const AutoTextArea: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; className?: string }> =
  ({ value, onChange, placeholder, className }) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    const resize = () => {
      const el = ref.current;
      if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
    };
    useLayoutEffect(() => { resize(); }, [value]);
    return (
      <textarea
        ref={ref}
        className={`cmp-inp ${className || ''}`}
        value={value}
        placeholder={placeholder}
        rows={1}
        onChange={(e) => { onChange(e.target.value); resize(); }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ overflow: 'hidden', resize: 'none', display: 'block' }}
      />
    );
  };

// Image picker: upload a file (stored as data URL) or paste an image URL.
const ImageField: React.FC<{ src?: string; onChange: (src: string) => void; height?: number; onRemove?: () => void }> =
  ({ src, onChange, height = 150, onRemove }) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
      e.target.value = '';
    };
    if (src) {
      return (
        <div className="cmp-img" style={{ height }} onClick={(e) => e.stopPropagation()}>
          <img src={src} alt="" />
          <div className="cmp-img__tools">
            <button type="button" title="Replace" onClick={() => fileRef.current?.click()}><UploadIcon size={12} /></button>
            <button type="button" title="Remove" onClick={() => (onRemove ? onRemove() : onChange(''))}><X size={12} /></button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
        </div>
      );
    }
    return (
      <div className="cmp-img-empty" style={{ height }} onClick={(e) => e.stopPropagation()}>
        {onRemove && <button type="button" className="cmp-img-x" title="Remove" onClick={onRemove}><X size={11} /></button>}
        <button type="button" className="cmp-img-up" onClick={() => fileRef.current?.click()}><UploadIcon size={14} /> Upload image</button>
        <div className="cmp-img-or">or</div>
        <div className="cmp-img-urlrow">
          <Link2 size={12} />
          <input
            className="cmp-img-url"
            placeholder="Paste image URL"
            onKeyDown={(e) => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) onChange(v); } }}
            onBlur={(e) => { const v = e.target.value.trim(); if (v) onChange(v); }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
      </div>
    );
  };

// Right-panel rich-text editor for the Paragraph component.
export const ParagraphSettings: React.FC<{ props: any; onChange: (patch: Record<string, any>) => void }> = ({ props, onChange }) => {
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-secondary, #64748b)', margin: '0 0 6px', display: 'block' };
  return (
    <div>
      <span style={label}>Content</span>
      <TiptapEditor
        content={props?.text || ''}
        onChange={(html) => onChange({ text: html })}
        placeholder="Write the paragraph — bold, lists, links…"
        minHeight={180}
      />
    </div>
  );
};

// Right-panel settings editor for the Two Columns component.
export const TwoColumnSettings: React.FC<{ props: any; onChange: (patch: Record<string, any>) => void }> = ({ props, onChange }) => {
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-secondary, #64748b)', margin: '0 0 6px', display: 'block' };
  const cols: [string, string, string][] = [['leftTitle', 'left', 'Left Column'], ['rightTitle', 'right', 'Right Column']];
  return (
    <div>
      {cols.map(([tKey, bKey, title]) => (
        <div key={title} style={{ marginBottom: 16, padding: 12, border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 10 }}>
          <span style={label}>{title} Name</span>
          <Input value={props?.[tKey] || ''} placeholder={`${title.toLowerCase()} name`} onChange={(e) => onChange({ [tKey]: e.target.value })} style={{ marginBottom: 10 }} />
          <span style={label}>{title} Content</span>
          <TiptapEditor
            content={props?.[bKey] || ''}
            onChange={(html) => onChange({ [bKey]: html })}
            placeholder="Write content — bold, lists, links…"
            minHeight={130}
          />
        </div>
      ))}
    </div>
  );
};

// ── Block renderer ────────────────────────────────────────────────────────
export const ComposerBlockView: React.FC<{
  component: SectionComponent;
  editable?: boolean;
  onChange?: (props: Record<string, any>) => void;
}> = ({ component, editable = false, onChange }) => {
  const { kind, props } = component;
  const set = (patch: Record<string, any>) => onChange?.({ ...props, ...patch });

  const editList = (key: string, idx: number, value: string) => {
    const arr = [...(props[key] || [])];
    arr[idx] = value;
    set({ [key]: arr });
  };
  const addListItem = (key: string, blank: any) => set({ [key]: [...(props[key] || []), blank] });
  const removeListItem = (key: string, idx: number) => set({ [key]: (props[key] || []).filter((_: any, i: number) => i !== idx) });

  switch (kind) {
    case 'heading':
      return <TextLine editable={editable} value={props.text} onChange={(v) => set({ text: v })} placeholder="Section Heading" className="cmp-b-heading" />;

    case 'phase':
      return (
        <div className="cmp-b-phase">
          <span className="cmp-b-phase__badge">
            <TextLine editable={editable} value={props.badge} onChange={(v) => set({ badge: v })} placeholder="PHASE 1" />
          </span>
          <TextLine editable={editable} value={props.title} onChange={(v) => set({ title: v })} placeholder="Phase Title" className="cmp-b-phase__title" />
        </div>
      );

    case 'scope': {
      const phases: any[] = props.phases || [];
      const setPhase = (i: number, patch: Record<string, any>) => set({ phases: phases.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
      const addPhase = () => set({ phases: [...phases, { id: nanoid(), badge: `PHASE ${phases.length + 1}`, title: 'Phase Title', deliverable: '', tasks: [] }] });
      const removePhase = (i: number) => set({ phases: phases.filter((_, idx) => idx !== i) });
      return (
        <div className="cmp-b-scope">
          <TextLine editable={editable} value={props.title} onChange={(v) => set({ title: v })} placeholder="Scope of Work" className="cmp-b-heading" />
          {phases.map((p, i) => (
            <div key={p.id || i} className="cmp-b-scope-phase">
              <div className="cmp-b-phase">
                <span className="cmp-b-phase__badge">
                  <TextLine editable={editable} value={p.badge} onChange={(v) => setPhase(i, { badge: v })} placeholder="PHASE 1" />
                </span>
                <TextLine editable={editable} value={p.title} onChange={(v) => setPhase(i, { title: v })} placeholder="Phase title" className="cmp-b-phase__title" />
                {editable && phases.length > 1 && (
                  <button className="cmp-b-rm" onClick={(e) => { e.stopPropagation(); removePhase(i); }}><X size={12} /></button>
                )}
              </div>

              <div className="cmp-b-deliv" style={{ marginTop: 10 }}>
                <div className="cmp-b-row-head">
                  <span className="cmp-b-ic cmp-b-ic--green"><CircleCheckBig size={14} /></span>
                  <span className="cmp-b-row-label">Major Deliverables</span>
                </div>
                <TextArea editable={editable} value={p.deliverable} onChange={(v) => setPhase(i, { deliverable: v })} placeholder="Describe the key deliverable for this phase" className="cmp-b-muted" />
              </div>

              <div className="cmp-b-tasks" style={{ marginTop: 10 }}>
                <div className="cmp-b-row-head">
                  <span className="cmp-b-ic cmp-b-ic--blue"><ListChecks size={14} /></span>
                  <span className="cmp-b-row-label">Detailed Tasks</span>
                </div>
                <div className="cmp-b-list">
                  {(p.tasks || []).map((t: string, ti: number) => (
                    <div key={ti} className="cmp-b-list-row">
                      <span className="cmp-b-dot" />
                      <TextLine editable={editable} value={t} onChange={(v) => setPhase(i, { tasks: (p.tasks || []).map((x: string, xi: number) => (xi === ti ? v : x)) })} placeholder="Task detail" className="cmp-b-muted" />
                      {editable && <button className="cmp-b-rm" onClick={(e) => { e.stopPropagation(); setPhase(i, { tasks: (p.tasks || []).filter((_: string, xi: number) => xi !== ti) }); }}><X size={12} /></button>}
                    </div>
                  ))}
                  {editable && <button className="cmp-b-add" onClick={(e) => { e.stopPropagation(); setPhase(i, { tasks: [...(p.tasks || []), 'New task'] }); }}><Plus size={12} /> Add task</button>}
                </div>
              </div>
            </div>
          ))}
          {editable && <button className="cmp-b-add" onClick={(e) => { e.stopPropagation(); addPhase(); }}><Plus size={12} /> Add phase</button>}
        </div>
      );
    }

    case 'timeline': {
      const phases: any[] = props.phases || [];
      const setPhase = (i: number, patch: Record<string, any>) => set({ phases: phases.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
      const addPhase = () => set({ phases: [...phases, { id: nanoid(), title: 'Phase Title', deadline: '', description: '' }] });
      const removePhase = (i: number) => set({ phases: phases.filter((_, idx) => idx !== i) });
      return (
        <div className="cmp-b-scope">
          <TextLine editable={editable} value={props.title} onChange={(v) => set({ title: v })} placeholder="Project Timeline" className="cmp-b-heading" />
          {phases.map((p, i) => (
            <div key={p.id || i} className="cmp-b-scope-phase">
              <div className="cmp-b-phase">
                <span className="cmp-b-phase__badge">PHASE {i + 1}</span>
                <TextLine editable={editable} value={p.title} onChange={(v) => setPhase(i, { title: v })} placeholder="Phase title" className="cmp-b-phase__title" />
                {editable && phases.length > 1 && (
                  <button className="cmp-b-rm" onClick={(e) => { e.stopPropagation(); removePhase(i); }}><X size={12} /></button>
                )}
              </div>
              <div className="cmp-b-row-head" style={{ marginTop: 8 }}>
                <span className="cmp-b-ic cmp-b-ic--blue"><CalendarRange size={14} /></span>
                <TextLine editable={editable} value={p.deadline} onChange={(v) => setPhase(i, { deadline: v })} placeholder="Target date or duration" className="cmp-b-row-label" />
              </div>
              <TextArea editable={editable} value={p.description} onChange={(v) => setPhase(i, { description: v })} placeholder="Phase description" className="cmp-b-muted" />
            </div>
          ))}
          {editable && <button className="cmp-b-add" onClick={(e) => { e.stopPropagation(); addPhase(); }}><Plus size={12} /> Add phase</button>}
        </div>
      );
    }

    case 'deliverable':
      return (
        <div className="cmp-b-deliv">
          <div className="cmp-b-row-head">
            <span className="cmp-b-ic cmp-b-ic--green"><CircleCheckBig size={14} /></span>
            <TextLine editable={editable} value={props.label} onChange={(v) => set({ label: v })} placeholder="Major Deliverables" className="cmp-b-row-label" />
          </div>
          <TextArea editable={editable} value={props.text} onChange={(v) => set({ text: v })} placeholder="Describe the key deliverable" className="cmp-b-muted" />
        </div>
      );

    case 'tasklist':
      return (
        <div className="cmp-b-tasks">
          <div className="cmp-b-row-head">
            <span className="cmp-b-ic cmp-b-ic--blue"><ListChecks size={14} /></span>
            <TextLine editable={editable} value={props.label} onChange={(v) => set({ label: v })} placeholder="Detailed Tasks" className="cmp-b-row-label" />
          </div>
          <div className="cmp-b-list">
            {(props.items || []).map((it: string, i: number) => (
              <div key={i} className="cmp-b-list-row">
                <span className="cmp-b-dot" />
                <TextLine editable={editable} value={it} onChange={(v) => editList('items', i, v)} placeholder="Task detail" className="cmp-b-muted" />
                {editable && <button className="cmp-b-rm" onClick={(e) => { e.stopPropagation(); removeListItem('items', i); }}><X size={12} /></button>}
              </div>
            ))}
            {editable && <button className="cmp-b-add" onClick={(e) => { e.stopPropagation(); addListItem('items', 'New task'); }}><Plus size={12} /> Add task</button>}
          </div>
        </div>
      );

    case 'bullets':
      return (
        <div className="cmp-b-list">
          {(props.items || []).map((it: string, i: number) => (
            <div key={i} className="cmp-b-list-row">
              <span className="cmp-b-dot" />
              <TextLine editable={editable} value={it} onChange={(v) => editList('items', i, v)} placeholder="Bullet point" className="cmp-b-muted" />
              {editable && <button className="cmp-b-rm" onClick={(e) => { e.stopPropagation(); removeListItem('items', i); }}><X size={12} /></button>}
            </div>
          ))}
          {editable && <button className="cmp-b-add" onClick={(e) => { e.stopPropagation(); addListItem('items', 'New point'); }}><Plus size={12} /> Add point</button>}
        </div>
      );

    case 'paragraph':
      return editable ? (
        <div
          className="cmp-b-rte"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <TiptapEditor
            content={props.text || ''}
            onChange={(html) => set({ text: html })}
            placeholder="Add body text — use the toolbar to bold, italicise, list…"
            minHeight={120}
          />
        </div>
      ) : props.text ? (
        <div className="cmp-b-para"><TiptapViewer content={props.text} /></div>
      ) : (
        <p className="cmp-b-para" style={{ color: 'var(--text-slate-300, #cbd5e1)' }}>Add body text…</p>
      );

    case 'keyvalue':
      return (
        <div className="cmp-b-kv">
          <TextLine editable={editable} value={props.label} onChange={(v) => set({ label: v })} placeholder="Highlights" className="cmp-b-row-label" />
          <div className="cmp-b-kv-grid">
            {(props.rows || []).map((r: any, i: number) => (
              <div key={i} className="cmp-b-kv-cell">
                <TextLine editable={editable} value={r.k} onChange={(v) => { const rows = [...props.rows]; rows[i] = { ...rows[i], k: v }; set({ rows }); }} placeholder="Label" className="cmp-b-kv-k" />
                <TextLine editable={editable} value={r.v} onChange={(v) => { const rows = [...props.rows]; rows[i] = { ...rows[i], v }; set({ rows }); }} placeholder="Value" className="cmp-b-kv-v" />
                {editable && <button className="cmp-b-rm cmp-b-rm--abs" onClick={(e) => { e.stopPropagation(); removeListItem('rows', i); }}><X size={12} /></button>}
              </div>
            ))}
            {editable && <button className="cmp-b-add" onClick={(e) => { e.stopPropagation(); addListItem('rows', { k: 'Label', v: 'Value' }); }}><Plus size={12} /> Add highlight</button>}
          </div>
        </div>
      );

    case 'callout': {
      const v = CALLOUT_VARIANTS[props.variant] || CALLOUT_VARIANTS.info;
      return (
        <div className="cmp-b-callout" style={{ background: v.bg, borderColor: v.border }}>
          <div className="cmp-b-callout__head" style={{ color: v.color }}>
            {v.icon}
            <TextLine editable={editable} value={props.title} onChange={(t) => set({ title: t })} placeholder="Callout title" className="cmp-b-callout__title" />
          </div>
          <TextArea editable={editable} value={props.text} onChange={(t) => set({ text: t })} placeholder="Callout body text…" className="cmp-b-callout__body" />
        </div>
      );
    }

    case 'divider':
      return <div className="cmp-b-divider" />;

    case 'spacer':
      return <div className="cmp-b-spacer" data-size={props.size} />;

    case 'table':
      return <EditableTable value={props} editable={editable} onChange={(next) => onChange?.(next)} />;

    case 'twoColumn': {
      const col = (tKey: string, bKey: string, ph: string) => (
        <div className="cmp-b-twocol">
          <TextLine editable={editable} value={props[tKey]} onChange={(v) => set({ [tKey]: v })} placeholder={ph} className="cmp-b-twocol-title" />
          {props[bKey] ? (
            <div className="cmp-b-twocol-body"><TiptapViewer content={props[bKey]} /></div>
          ) : editable ? (
            <div className="cmp-b-twocol-body" style={{ color: 'var(--text-slate-300, #cbd5e1)' }}>Add content in the side panel…</div>
          ) : null}
        </div>
      );
      return <div className="cmp-b-two">{col('leftTitle', 'left', 'Left column')}{col('rightTitle', 'right', 'Right column')}</div>;
    }

    case 'image':
      return (
        <div className="cmp-b-image">
          {editable ? (
            <ImageField src={props.src} onChange={(src) => set({ src })} height={170} />
          ) : props.src ? (
            <img className="cmp-b-img" src={props.src} alt={props.caption || ''} />
          ) : null}
          {(editable || props.caption) && (
            <TextLine editable={editable} value={props.caption} onChange={(v) => set({ caption: v })} placeholder="Image caption" className="cmp-b-cap" />
          )}
        </div>
      );

    case 'gallery': {
      const images: any[] = props.images || [];
      const updateImg = (i: number, src: string) => set({ images: images.map((g, idx) => (idx === i ? { ...g, src } : g)) });
      const removeImg = (i: number) => set({ images: images.filter((_, idx) => idx !== i) });
      const addImg = () => set({ images: [...images, { id: nanoid(), src: '' }] });
      const cols = Math.max(1, Math.min(6, props.columns || 3));
      const gridStyle: React.CSSProperties = { gridTemplateColumns: `repeat(${cols}, 1fr)` };
      if (!editable) {
        const filled = images.filter((g) => g.src);
        return (
          <div className="cmp-b-gallery" style={gridStyle}>
            {filled.map((g) => <img key={g.id} className="cmp-b-img" src={g.src} alt="" />)}
          </div>
        );
      }
      return (
        <div className="cmp-b-gallery" style={gridStyle}>
          {images.map((g, i) => (
            <ImageField key={g.id} src={g.src} onChange={(src) => updateImg(i, src)} height={110} onRemove={() => removeImg(i)} />
          ))}
          <button type="button" className="cmp-gallery-add" onClick={(e) => { e.stopPropagation(); addImg(); }}>
            <Plus size={16} /><span>Add image</span>
          </button>
        </div>
      );
    }

    case 'video':
      return (
        <div className="cmp-b-image__ph cmp-b-image__ph--video"><Video size={22} /><span>Video embed</span></div>
      );

    case 'pricing':
      return (
        <div className="cmp-b-pricing">
          <TextLine editable={editable} value={props.label} onChange={(v) => set({ label: v })} placeholder="Pricing" className="cmp-b-row-label" />
          {(props.rows || []).map((r: any, i: number) => (
            <div key={i} className="cmp-b-price-row">
              <TextLine editable={editable} value={r.item} onChange={(v) => { const rows = [...props.rows]; rows[i] = { ...rows[i], item: v }; set({ rows }); }} placeholder="Line item" className="cmp-b-muted" />
              <TextLine editable={editable} value={r.price} onChange={(v) => { const rows = [...props.rows]; rows[i] = { ...rows[i], price: v }; set({ rows }); }} placeholder="$0" className="cmp-b-price" />
              {editable && <button className="cmp-b-rm" onClick={(e) => { e.stopPropagation(); removeListItem('rows', i); }}><X size={12} /></button>}
            </div>
          ))}
          {editable && <button className="cmp-b-add" onClick={(e) => { e.stopPropagation(); addListItem('rows', { item: 'Service item', price: '$0' }); }}><Plus size={12} /> Add line</button>}
        </div>
      );

    case 'quote':
      return (
        <div className="cmp-b-quote">
          <Quote size={20} className="cmp-b-quote__mark" />
          <TextArea editable={editable} value={props.text} onChange={(v) => set({ text: v })} placeholder="Client testimonial…" className="cmp-b-quote__text" />
          <TextLine editable={editable} value={props.author} onChange={(v) => set({ author: v })} placeholder="Client Name · Role" className="cmp-b-quote__author" />
        </div>
      );

    case 'cta':
      return (
        <div className="cmp-b-cta">
          <span className="cmp-b-cta__btn">
            <TextLine editable={editable} value={props.text} onChange={(v) => set({ text: v })} placeholder="Accept Proposal" />
          </span>
        </div>
      );

    case 'signature':
      return (
        <div className="cmp-b-sign">
          <div className="cmp-b-sign__col"><span className="cmp-b-sign__line" /><span className="cmp-b-sign__lbl">Client Signature</span></div>
          <div className="cmp-b-sign__col"><span className="cmp-b-sign__line" /><span className="cmp-b-sign__lbl">Date</span></div>
        </div>
      );

    default:
      return <div className="cmp-b-muted">Unknown component</div>;
  }
};
