'use client';

import { create } from 'zustand';
import type { BlockType, ProposalBlock } from './proposalStore';
import { ProposalSectionService } from '@/services/proposalSectionService';
import { ProposalTemplateService } from '@/services/proposalTemplateService';

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

/**
 * A section's *type* drives how it renders + how AI will later generate it.
 * Each type maps to one of the existing builder block renderers (`BlockType`).
 */
export type SectionType =
  | 'text'
  | 'cover'
  | 'pricing'
  | 'timeline'
  | 'scope'
  | 'signature'
  | 'terms'
  | 'testimonial'
  | 'gallery'
  | 'video'
  | 'cta';

export type SectionCategory =
  | 'Introduction'
  | 'Service'
  | 'Pricing'
  | 'Legal'
  | 'Trust'
  | 'Closing'
  | 'Custom';

/** A single UI component inside a composed section (see SectionComposerDrawer). */
export interface SectionComponent {
  id: string;
  kind: string;
  props: Record<string, any>;
}

export interface LibrarySection {
  id: string;
  name: string;
  category: SectionCategory;
  type: SectionType;
  /** Optional one-line helper shown in cards. */
  description?: string;
  /** Composed UI components that make up the section's structure. */
  components?: SectionComponent[];
  /** Default content payload — same shape the builder block expects. */
  data: any;
  /** Global sections behave like Figma components: edit once, used everywhere. */
  isGlobal: boolean;
  /** Section is hidden from pickers but not deleted. */
  archived: boolean;
  /** Seeded sections cannot be deleted (only archived). */
  system?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryTemplate {
  id: string;
  name: string;
  description?: string;
  /** Full composed builder content — the same ProposalBlock[] a proposal holds. */
  blocks?: ProposalBlock[];
  /** Legacy: ordered list of section ids that composed this template. */
  sectionIds: string[];
  /** Theme + font preset ids (see themePresets.ts). */
  themeId: string;
  fontId: string;
  archived: boolean;
  system?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Section type → builder block renderer mapping
// ──────────────────────────────────────────────────────────────────────────

export const blockTypeForSectionType = (type: SectionType): BlockType => {
  switch (type) {
    case 'cover': return 'cover';
    case 'pricing': return 'pricing';
    case 'timeline': return 'timeline';
    case 'scope': return 'scope';
    case 'signature': return 'signature';
    case 'text': return 'text';
    // terms / testimonial / gallery / video / cta all render as rich-text sections for now
    default: return 'section';
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Store — sections and templates both come from the backend (raw-pg API).
// ──────────────────────────────────────────────────────────────────────────

interface SectionInput {
  name: string;
  category: SectionCategory;
  type: SectionType;
  description?: string;
  components?: SectionComponent[];
  data?: any;
  isGlobal?: boolean;
}

interface TemplateInput {
  name: string;
  description?: string;
  blocks?: ProposalBlock[];
  sectionIds?: string[];
  themeId?: string;
  fontId?: string;
}

interface LibraryState {
  sections: LibrarySection[];
  sectionsLoaded: boolean;
  sectionsLoading: boolean;
  sectionsError: string | null;
  templates: LibraryTemplate[];
  templatesLoaded: boolean;
  templatesLoading: boolean;
  templatesError: string | null;

  // Section CRUD (backend-backed)
  fetchSections: (force?: boolean) => Promise<void>;
  createSection: (input: SectionInput) => Promise<LibrarySection | null>;
  updateSection: (id: string, patch: Partial<SectionInput> & { archived?: boolean }) => Promise<void>;
  duplicateSection: (id: string) => Promise<LibrarySection | null>;
  archiveSection: (id: string, archived?: boolean) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;

  // Template CRUD (backend-backed)
  fetchTemplates: (force?: boolean) => Promise<void>;
  createTemplate: (input: TemplateInput) => Promise<LibraryTemplate | null>;
  updateTemplate: (id: string, patch: Partial<TemplateInput> & { archived?: boolean }) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<LibraryTemplate | null>;
  archiveTemplate: (id: string, archived?: boolean) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  // Derived helpers
  templatesUsingSection: (sectionId: string) => LibraryTemplate[];
}

export const useProposalLibraryStore = create<LibraryState>()(
    (set, get) => ({
      sections: [],
      sectionsLoaded: false,
      sectionsLoading: false,
      sectionsError: null,
      templates: [],
      templatesLoaded: false,
      templatesLoading: false,
      templatesError: null,

      // ── Sections (backend) ───────────────────────────────────────────
      fetchSections: async (force = false) => {
        const { sectionsLoading, sectionsLoaded } = get();
        if (sectionsLoading) return;
        if (sectionsLoaded && !force) return;
        set({ sectionsLoading: true, sectionsError: null });
        try {
          const sections = await ProposalSectionService.list();
          set({ sections: Array.isArray(sections) ? sections : [], sectionsLoaded: true, sectionsLoading: false });
        } catch (err: any) {
          set({ sectionsLoading: false, sectionsError: err?.message || 'Failed to load sections' });
        }
      },

      createSection: async (input) => {
        const created = await ProposalSectionService.create(input);
        if (created) set((s) => ({ sections: [created, ...s.sections] }));
        return created || null;
      },

      updateSection: async (id, patch) => {
        const updated = await ProposalSectionService.update(id, patch as any);
        if (updated) set((s) => ({ sections: s.sections.map((sec) => (sec.id === id ? updated : sec)) }));
      },

      duplicateSection: async (id) => {
        const copy = await ProposalSectionService.duplicate(id);
        if (copy) set((s) => ({ sections: [copy, ...s.sections] }));
        return copy || null;
      },

      archiveSection: async (id, archived = true) => {
        const updated = await ProposalSectionService.archive(id, archived);
        if (updated) set((s) => ({ sections: s.sections.map((sec) => (sec.id === id ? updated : sec)) }));
      },

      deleteSection: async (id) => {
        await ProposalSectionService.remove(id);
        set((s) => ({
          sections: s.sections.filter((sec) => sec.id !== id),
          // keep templates valid in-memory by dropping references to the deleted section
          templates: s.templates.map((t) => ({ ...t, sectionIds: t.sectionIds.filter((sid) => sid !== id) })),
        }));
      },

      // ── Templates (backend) ──────────────────────────────────────────
      fetchTemplates: async (force = false) => {
        const { templatesLoading, templatesLoaded } = get();
        if (templatesLoading) return;
        if (templatesLoaded && !force) return;
        set({ templatesLoading: true, templatesError: null });
        try {
          const templates = await ProposalTemplateService.list();
          set({ templates: Array.isArray(templates) ? templates : [], templatesLoaded: true, templatesLoading: false });
        } catch (err: any) {
          set({ templatesLoading: false, templatesError: err?.message || 'Failed to load templates' });
        }
      },

      createTemplate: async (input) => {
        const created = await ProposalTemplateService.create(input);
        if (created) set((s) => ({ templates: [created, ...s.templates] }));
        return created || null;
      },

      updateTemplate: async (id, patch) => {
        const updated = await ProposalTemplateService.update(id, patch);
        if (updated) set((s) => ({ templates: s.templates.map((t) => (t.id === id ? updated : t)) }));
      },

      duplicateTemplate: async (id) => {
        const copy = await ProposalTemplateService.duplicate(id);
        if (copy) set((s) => ({ templates: [copy, ...s.templates] }));
        return copy || null;
      },

      archiveTemplate: async (id, archived = true) => {
        const updated = await ProposalTemplateService.archive(id, archived);
        if (updated) set((s) => ({ templates: s.templates.map((t) => (t.id === id ? updated : t)) }));
      },

      deleteTemplate: async (id) => {
        await ProposalTemplateService.remove(id);
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
      },

      templatesUsingSection: (sectionId) => get().templates.filter((t) => t.sectionIds.includes(sectionId)),
    }),
);
