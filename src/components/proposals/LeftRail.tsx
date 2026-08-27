'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import NoData from '@/components/common/NoData';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useProposalStore } from '@/store/proposalStore';
import {
  useProposalLibraryStore, blockTypeForSectionType, LibrarySection, SectionType, SectionCategory,
} from '@/store/proposalLibraryStore';
import { ComponentPalette } from './library/ComponentPalette';
import { createComponent, PaletteItem } from './library/composerComponents';
import { typeMeta, CATEGORY_META, CATEGORY_ORDER } from './library/sectionMeta';
import { Blocks, Component, Plus, Sparkles, ArrowRight } from 'lucide-react';

type Tab = 'sections' | 'library';
type Layout = 'vertical' | 'horizontal';

interface LeftRailProps {
  onJumpToBlock?: (blockId: string) => void;
  layout?: Layout;
}

// Canonical catalogue used only to compute the "Next Suggestion" after each card.
interface CatalogItem { category: SectionCategory; name: string; type: SectionType }
const CATALOG: CatalogItem[] = [
  { category: 'Introduction', name: 'Cover Page', type: 'cover' },
  { category: 'Introduction', name: 'Executive Summary', type: 'text' },
  { category: 'Introduction', name: 'About Company', type: 'text' },
  { category: 'Service', name: 'Scope of Work', type: 'scope' },
  { category: 'Service', name: 'Deliverables', type: 'text' },
  { category: 'Service', name: 'Timeline', type: 'timeline' },
  { category: 'Pricing', name: 'Pricing Table', type: 'pricing' },
  { category: 'Pricing', name: 'Payment Terms', type: 'terms' },
  { category: 'Legal', name: 'Terms & Conditions', type: 'terms' },
  { category: 'Legal', name: 'NDA', type: 'terms' },
  { category: 'Legal', name: 'Cancellation Policy', type: 'terms' },
  { category: 'Trust', name: 'Testimonials', type: 'testimonial' },
  { category: 'Trust', name: 'Case Studies', type: 'text' },
  { category: 'Trust', name: 'Portfolio', type: 'gallery' },
  { category: 'Closing', name: 'Signature', type: 'signature' },
  { category: 'Closing', name: 'Acceptance', type: 'cta' },
  { category: 'Closing', name: 'Next Steps', type: 'text' },
];

const UNIQUE_BLOCK_TYPES = ['cover', 'pricing', 'signature', 'timeline', 'scope'];

export const LeftRail: React.FC<LeftRailProps> = ({ layout = 'vertical' }) => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('sections');
  const railRef = useRef<HTMLDivElement>(null);

  const blocks = useProposalStore((s) => s.blocks);
  const addBlock = useProposalStore((s) => s.addBlock);
  const updateBlock = useProposalStore((s) => s.updateBlock);

  const sections = useProposalLibraryStore((s) => s.sections);
  const fetchSections = useProposalLibraryStore((s) => s.fetchSections);
  const sectionsLoading = useProposalLibraryStore((s) => s.sectionsLoading);
  const sectionsLoaded = useProposalLibraryStore((s) => s.sectionsLoaded);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const isHorizontal = layout === 'horizontal';
  const created = useMemo(() => sections.filter((s) => !s.archived), [sections]);

  // Insert a created section into the proposal canvas.
  //  - Composed sections (built in the Section Composer) drop their components in,
  //    preserving the full layout the user designed.
  //  - Simple sections fall back to a single block seeded from their type.
  const addSection = (section: LibrarySection) => {
    if (section.components && section.components.length) {
      section.components.forEach((comp) => {
        const before = useProposalStore.getState().blocks.length;
        addBlock('component');
        const st = useProposalStore.getState();
        const newId = st.selectedBlockId;
        if (newId && st.blocks.length > before) {
          updateBlock(newId, { ...comp, id: nanoid() });
        }
      });
      return;
    }

    const bt = blockTypeForSectionType(section.type);
    const before = useProposalStore.getState().blocks.length;
    addBlock(bt);
    const st = useProposalStore.getState();
    const newId = st.selectedBlockId;
    if (newId && st.blocks.length > before) {
      const seed = section.data && Object.keys(section.data).length ? { ...section.data } : { heading: section.name, title: section.name };
      updateBlock(newId, seed);
    }
  };

  // Insert a suggested (catalogue) section.
  const addCatalog = (item: CatalogItem) => {
    const bt = blockTypeForSectionType(item.type);
    const before = useProposalStore.getState().blocks.length;
    addBlock(bt);
    const st = useProposalStore.getState();
    const newId = st.selectedBlockId;
    if (newId && st.blocks.length > before) updateBlock(newId, { heading: item.name, title: item.name });
  };

  // Component insertion (Components tab).
  const addComponent = (item: PaletteItem) => {
    // Items backed by a real proposal block (Pricing, Signature) insert that
    // block — rich renderer on the canvas + its own settings in the right panel.
    if (item.blockType) {
      addBlock(item.blockType as any);
      return;
    }
    const comp = createComponent(item.kind, item.preset);
    const before = useProposalStore.getState().blocks.length;
    addBlock('component');
    const newId = useProposalStore.getState().selectedBlockId;
    if (newId && useProposalStore.getState().blocks.length > before) updateBlock(newId, comp);
  };

  const isAdded = (item: CatalogItem): boolean => {
    const bt = blockTypeForSectionType(item.type);
    if (UNIQUE_BLOCK_TYPES.includes(bt)) return blocks.some((b) => b.type === bt);
    return blocks.some((b) => b.data?.heading === item.name || b.data?.title === item.name);
  };

  // The next logical section to add, contextual to a card's category.
  const nextSuggestionFor = (category: SectionCategory): CatalogItem | null => {
    const ci = CATEGORY_ORDER.indexOf(category);
    const notAdded = CATALOG.filter((i) => i.type !== 'cover' && !isAdded(i));
    return notAdded.find((i) => CATEGORY_ORDER.indexOf(i.category) >= ci) || notAdded[0] || null;
  };

  // ── renderers ─────────────────────────────────────────────────────────────
  const SectionCard = ({ s }: { s: LibrarySection }) => {
    const meta = typeMeta(s.type);
    return (
      <button
        type="button"
        onClick={() => addSection(s)}
        title={s.description || meta.label}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
          padding: '10px 11px', cursor: 'pointer',
          border: '1px solid var(--border-color, #e5e7eb)', background: 'var(--bg-pure-white, #fff)',
        }}
      >
        <span style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', color: meta.color, background: meta.bg, flexShrink: 0 }}>{meta.icon}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
          <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-secondary, #94a3b8)' }}>{CATEGORY_META[s.category].label} · {meta.label}</span>
        </span>
        {s.isGlobal && <span style={{ fontSize: 9, fontWeight: 800, color: '#2563eb', background: 'rgba(37,99,235,0.12)', padding: '1px 5px' }}>GLOBAL</span>}
        <Plus size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
      </button>
    );
  };

  const NextSuggestion = ({ item }: { item: CatalogItem | null }) => {
    if (!item) return null;
    const meta = typeMeta(item.type);
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, margin: '4px 0 8px 14px', borderLeft: '2px solid rgba(37,99,235,0.30)', paddingLeft: 10 }}>
        <button
          type="button"
          onClick={() => addCatalog(item)}
          title={`Add ${item.name}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
            padding: '6px 9px', cursor: 'pointer',
            border: '1px dashed rgba(37,99,235,0.40)', background: 'rgba(37,99,235,0.04)',
          }}
        >
          <Sparkles size={12} style={{ color: '#2563eb', flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: '#2563eb', flexShrink: 0 }}>Next</span>
          <span style={{ width: 20, height: 20, display: 'grid', placeItems: 'center', color: meta.color, background: meta.bg, flexShrink: 0 }}>{meta.icon}</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
          <ArrowRight size={13} style={{ color: '#2563eb', flexShrink: 0 }} />
        </button>
      </div>
    );
  };

  const emptyState = (
    <div className="pb-rail__empty">
      <div className="pb-rail__empty-icon"><Blocks size={isHorizontal ? 16 : 20} /></div>
      <div className="pb-rail__empty-title">No sections created yet</div>
      {!isHorizontal && (
        <button
          type="button"
          onClick={() => router.push('/proposals/sections')}
          style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #2563eb', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={13} /> Create a Section
        </button>
      )}
    </div>
  );

  const sectionsBody = isHorizontal ? (
    <div className="pb-rail__cards no-scrollbar" style={{ gap: 8 }}>
      {created.length === 0 ? (
        <span style={{ fontSize: 12, color: '#94a3b8', padding: '6px 4px' }}>No created sections</span>
      ) : created.map((s) => {
        const meta = typeMeta(s.type);
        return (
          <button key={s.id} type="button" onClick={() => addSection(s)} title={s.description} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 11px', border: '1px solid var(--border-color, #e5e7eb)', background: 'var(--bg-pure-white, #fff)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span style={{ width: 22, height: 22, display: 'grid', placeItems: 'center', color: meta.color, background: meta.bg }}>{meta.icon}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>{s.name}</span>
            <Plus size={12} style={{ color: '#94a3b8' }} />
          </button>
        );
      })}
    </div>
  ) : (
    <div className="pb-rail__outline">
      <div className="pb-rail__outline-head">
        <span className="pb-section-label">
          <span className="pb-section-label__dot" />
          Your Sections
        </span>
        <button
          type="button"
          onClick={() => router.push('/proposals/sections')}
          title="Create / manage sections"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: '#2563eb', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={12} /> New
        </button>
      </div>

      {sectionsLoading && !sectionsLoaded ? (
        <div style={{ padding: '24px 8px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading sections…</div>
      ) : created.length === 0 ? (
        <NoData description={emptyState} />
      ) : (
        created.map((s) => (
          <React.Fragment key={s.id}>
            <SectionCard s={s} />
            <NextSuggestion item={nextSuggestionFor(s.category)} />
          </React.Fragment>
        ))
      )}
    </div>
  );

  return (
    <div ref={railRef} className={`pb-rail pb-rail--${layout}`}>
      <div className="pb-rail__tabs">
        <button
          type="button"
          className={`pb-rail__tab ${tab === 'sections' ? 'pb-rail__tab--active' : ''}`}
          onClick={() => setTab('sections')}
        >
          <Blocks size={13} />
          <span>Sections</span>
          {isHorizontal && created.length > 0 && <span className="pb-rail__tab-count">{created.length}</span>}
        </button>
        <button
          type="button"
          className={`pb-rail__tab ${tab === 'library' ? 'pb-rail__tab--active' : ''}`}
          onClick={() => setTab('library')}
        >
          <Component size={13} />
          <span>Components</span>
        </button>
      </div>

      <div className="pb-rail__body">
        {tab === 'sections' ? sectionsBody : (
          <div className="pb-rail__library">
            <ComponentPalette layout={isHorizontal ? 'horizontal' : 'vertical'} onPick={addComponent} />
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
