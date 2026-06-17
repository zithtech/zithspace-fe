'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { BlockType } from './proposalStore';
import { ProposalSectionService } from '@/services/proposalSectionService';

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
  /** Ordered list of section ids that compose this template. */
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
// Templates (still client-side until a backend lands)
// ──────────────────────────────────────────────────────────────────────────

const stamp = () => new Date().toISOString();

// ──────────────────────────────────────────────────────────────────────────
// Store — sections come from the backend (raw-pg API); templates stay local.
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

interface LibraryState {
  sections: LibrarySection[];
  sectionsLoaded: boolean;
  sectionsLoading: boolean;
  sectionsError: string | null;
  templates: LibraryTemplate[];

  // Section CRUD (backend-backed)
  fetchSections: (force?: boolean) => Promise<void>;
  createSection: (input: SectionInput) => Promise<LibrarySection | null>;
  updateSection: (id: string, patch: Partial<SectionInput> & { archived?: boolean }) => Promise<void>;
  duplicateSection: (id: string) => Promise<LibrarySection | null>;
  archiveSection: (id: string, archived?: boolean) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;

  // Template CRUD (local)
  createTemplate: (input: Partial<LibraryTemplate> & { name: string }) => LibraryTemplate;
  updateTemplate: (id: string, patch: Partial<LibraryTemplate>) => void;
  duplicateTemplate: (id: string) => LibraryTemplate | null;
  archiveTemplate: (id: string, archived?: boolean) => void;
  deleteTemplate: (id: string) => void;

  // Derived helpers
  templatesUsingSection: (sectionId: string) => LibraryTemplate[];
}

export const useProposalLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      sections: [],
      sectionsLoaded: false,
      sectionsLoading: false,
      sectionsError: null,
      templates: [],

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
          // keep local templates valid by dropping references
          templates: s.templates.map((t) => ({ ...t, sectionIds: t.sectionIds.filter((sid) => sid !== id) })),
        }));
      },

      // ── Templates (local) ────────────────────────────────────────────
      createTemplate: (input) => {
        const template: LibraryTemplate = {
          id: nanoid(),
          name: input.name,
          description: input.description || '',
          sectionIds: input.sectionIds ?? [],
          themeId: input.themeId ?? 'azure',
          fontId: input.fontId ?? 'inter',
          archived: false,
          system: false,
          createdAt: stamp(),
          updatedAt: stamp(),
        };
        set((s) => ({ templates: [template, ...s.templates] }));
        return template;
      },

      updateTemplate: (id, patch) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: stamp() } : t)),
        })),

      duplicateTemplate: (id) => {
        const src = get().templates.find((t) => t.id === id);
        if (!src) return null;
        const copy: LibraryTemplate = {
          ...src,
          id: nanoid(),
          name: `${src.name} (Copy)`,
          system: false,
          archived: false,
          createdAt: stamp(),
          updatedAt: stamp(),
        };
        set((s) => ({ templates: [copy, ...s.templates] }));
        return copy;
      },

      archiveTemplate: (id, archived = true) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, archived, updatedAt: stamp() } : t)),
        })),

      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      templatesUsingSection: (sectionId) => get().templates.filter((t) => t.sectionIds.includes(sectionId)),
    }),
    {
      name: 'zukvo-proposal-library-v2',
      version: 2,
      // Only templates are persisted; sections are always fetched fresh from the API.
      partialize: (state) => ({ templates: state.templates }) as any,
    },
  ),
);
