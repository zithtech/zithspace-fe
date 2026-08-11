import { apiClient } from '@/lib/axios';

// ── Hotspot Circulation frontend service ────────────────────────────────────
// Talks to the raw-SQL backend module mounted at /api/v2/hotspot/circulation.
// Every endpoint returns the platform envelope { success, data }.

const BASE = '/api/v2/hotspot/circulation';
const AI_BASE = '/api/v2/hotspot/ai/circulation';

function unwrap<T>(data: any): T {
  return data?.data as T;
}

// ── Types (mirror the backend CHECK constraints) ────────────────────────────

/**
 * A category slug. Either one of the built-ins below or a tenant-defined key —
 * the allowed set is per-tenant, so this is a plain string rather than a union.
 */
export type CirculationCategory = string;

export type BuiltInCategory =
  | 'general'
  | 'announcement'
  | 'policy'
  | 'event'
  | 'celebration'
  | 'alert';

/** Shipped with the product, present for every tenant, not deletable. */
export const BUILT_IN_CATEGORIES: BuiltInCategory[] = [
  'general',
  'announcement',
  'policy',
  'event',
  'celebration',
  'alert',
];

/** One entry in the category picker — built-in or tenant-defined. */
export interface CirculationCategoryItem {
  key: string;
  /** For built-ins the server echoes the key; the client owns those labels. */
  label: string;
  isBuiltIn: boolean;
  /** Row id, for tenant-defined categories only. */
  id: string | null;
  postCount: number;
}

export type AttachmentKind = 'image' | 'document';

export interface CirculationAttachment {
  id: string;
  postId: string;
  kind: AttachmentKind;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  sortOrder: number;
  uploadedBy: string;
  createdAt: string;
}

export interface CirculationPost {
  id: string;
  title: string;
  /** HTML from the composer. */
  body: string;
  /** Plain-text projection — used for the collapsed feed preview. */
  bodyText: string;
  category: CirculationCategory;
  /** Display label for a tenant-defined category; null for the built-ins. */
  categoryLabel: string | null;
  isPinned: boolean;
  authorUserId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  authorDesignation: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: CirculationAttachment[];
  /** Server-computed for the calling user: show the edit/delete affordances. */
  canEdit: boolean;
}

export interface CirculationListQuery {
  search?: string;
  category?: CirculationCategory;
  mineOnly?: boolean;
  /** Restrict to one author. Takes precedence over `mineOnly`. */
  authorUserId?: string;
  page?: number;
  pageSize?: number;
}

/** One entry in the "posted by" dropdown — only people who have posted. */
export interface CirculationAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  designation: string | null;
  postCount: number;
}

export interface CirculationListResult {
  items: CirculationPost[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CirculationPostPayload {
  title: string;
  body: string;
  category: CirculationCategory;
  isPinned?: boolean;
}

// ── AI writing assist ───────────────────────────────────────────────────────

export type ComposeTone = 'neutral' | 'friendly' | 'formal' | 'urgent' | 'celebratory';

export interface ComposeRequest {
  /** What the update is about, in the poster's own words. */
  brief: string;
  category: CirculationCategory;
  /** Sent for tenant-defined categories — the slug alone is a poor prompt. */
  categoryLabel?: string | null;
  tone: ComposeTone;
  /** Sent so the model refines an existing draft instead of discarding it. */
  currentTitle?: string | null;
  currentBody?: string | null;
}

export interface ComposeResult {
  title: string;
  /** Sanitised HTML, ready to drop into the editor. */
  body: string;
}

export interface GrammarResult {
  html: string;
  changed: boolean;
}

// ── Service ─────────────────────────────────────────────────────────────────

export const HotspotCirculationService = {
  async list(query: CirculationListQuery = {}): Promise<CirculationListResult> {
    const params: Record<string, any> = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    };
    if (query.search) params.search = query.search;
    if (query.category) params.category = query.category;
    if (query.mineOnly) params.mineOnly = true;
    if (query.authorUserId) params.authorUserId = query.authorUserId;

    const res = await apiClient.get(BASE, { params });
    return unwrap<CirculationListResult>(res.data);
  },

  /** People who have circulated something — the "posted by" dropdown. */
  async listAuthors(): Promise<CirculationAuthor[]> {
    const res = await apiClient.get(`${BASE}/authors`);
    return unwrap<CirculationAuthor[]>(res.data) ?? [];
  },

  /** Built-ins plus this tenant's own categories, each with its post count. */
  async listCategories(): Promise<CirculationCategoryItem[]> {
    const res = await apiClient.get(`${BASE}/categories`);
    return unwrap<CirculationCategoryItem[]>(res.data) ?? [];
  },

  /**
   * Add a tenant-defined category. A label that already exists resolves to the
   * existing category rather than erroring — the caller wanted that category.
   */
  async createCategory(label: string): Promise<CirculationCategoryItem> {
    const res = await apiClient.post(`${BASE}/categories`, { label });
    return unwrap<CirculationCategoryItem>(res.data);
  },

  /** Moderators only, and only while no post uses it. */
  async removeCategory(categoryId: string): Promise<void> {
    await apiClient.delete(`${BASE}/categories/${categoryId}`);
  },

  async getOne(id: string): Promise<CirculationPost> {
    const res = await apiClient.get(`${BASE}/${id}`);
    return unwrap<CirculationPost>(res.data);
  },

  async create(payload: CirculationPostPayload): Promise<CirculationPost> {
    const res = await apiClient.post(BASE, payload);
    return unwrap<CirculationPost>(res.data);
  },

  async update(id: string, payload: Partial<CirculationPostPayload>): Promise<CirculationPost> {
    const res = await apiClient.put(`${BASE}/${id}`, payload);
    return unwrap<CirculationPost>(res.data);
  },

  async setPinned(id: string, isPinned: boolean): Promise<CirculationPost> {
    const res = await apiClient.post(`${BASE}/${id}/pin`, { isPinned });
    return unwrap<CirculationPost>(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },

  /**
   * Upload images and documents onto an existing post. Images and documents go
   * through the same endpoint — the backend splits them by MIME type so the
   * client never has to label them.
   */
  async uploadAttachments(id: string, files: File[]): Promise<CirculationPost> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const res = await apiClient.post(`${BASE}/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<CirculationPost>(res.data);
  },

  async removeAttachment(id: string, attachmentId: string): Promise<CirculationPost> {
    const res = await apiClient.delete(`${BASE}/${id}/attachments/${attachmentId}`);
    return unwrap<CirculationPost>(res.data);
  },

  /** Draft a title and body from a one-line brief. */
  async aiCompose(payload: ComposeRequest): Promise<ComposeResult> {
    const res = await apiClient.post(`${AI_BASE}/compose`, payload);
    return unwrap<ComposeResult>(res.data);
  },

  /**
   * Fix spelling and grammar in the draft. The markup is spliced back together
   * server-side, so the returned HTML keeps the author's formatting exactly.
   */
  async aiGrammar(html: string): Promise<GrammarResult> {
    const res = await apiClient.post(`${AI_BASE}/grammar`, { html });
    return unwrap<GrammarResult>(res.data);
  },
};

export default HotspotCirculationService;
