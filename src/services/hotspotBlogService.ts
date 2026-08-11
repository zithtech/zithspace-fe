import { apiClient } from '@/lib/axios';

// ── Hotspot Blogs frontend service ──────────────────────────────────────────
// Talks to the raw-SQL backend module mounted at /api/v2/hotspot/blogs.
// Every endpoint returns the platform envelope { success, data }.
//
// Post and comment bodies are PLAIN TEXT, not HTML — mentions are carried by
// the `mentions` array and rendered client-side by matching "@Name" in the body
// (see renderBody in components/hotspot/blog/mentions.tsx).

const BASE = '/api/v2/hotspot/blogs';

function unwrap<T>(data: any): T {
  return data?.data as T;
}

// ── Types (mirror the backend CHECK constraints) ────────────────────────────

export type BlogReaction = 'like' | 'celebrate' | 'support' | 'love' | 'insightful' | 'funny';

export const BLOG_REACTIONS: BlogReaction[] = [
  'like',
  'celebrate',
  'support',
  'love',
  'insightful',
  'funny',
];

/** A colleague, as shown on an author line, a mention chip or the @ picker. */
export interface BlogUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  designation: string | null;
}

export interface BlogImage {
  id: string;
  postId: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface ReactionSummary {
  /** reaction -> count, only for reactions anyone actually used. */
  counts: Partial<Record<BlogReaction, number>>;
  total: number;
  /** The calling user's own reaction, or null. */
  mine: BlogReaction | null;
}

export interface BlogComment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  body: string;
  author: BlogUser;
  mentions: BlogUser[];
  reactions: ReactionSummary;
  createdAt: string;
  updatedAt: string;
  /** May the caller rewrite it — author only. Deleting is broader. */
  canEdit: boolean;
  replies: BlogComment[];
}

export interface BlogPost {
  id: string;
  /** Sanitised HTML from the rich-text composer. */
  body: string;
  /** Plain-text projection — what the feed measures and collapses on. */
  bodyText: string;
  author: BlogUser;
  images: BlogImage[];
  mentions: BlogUser[];
  reactions: ReactionSummary;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
}

export interface BlogListQuery {
  search?: string;
  authorUserId?: string;
  /** Only posts that tag me. */
  mentioningMe?: boolean;
  page?: number;
  pageSize?: number;
}

export interface BlogListResult {
  items: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BlogPostPayload {
  body: string;
  mentionUserIds?: string[];
  /** Images land on a separate call — this tells the server one is coming. */
  hasImages?: boolean;
}

export interface CommentPayload {
  body: string;
  parentCommentId?: string | null;
  mentionUserIds?: string[];
}

// ── Service ─────────────────────────────────────────────────────────────────

export const HotspotBlogService = {
  async list(query: BlogListQuery = {}): Promise<BlogListResult> {
    const params: Record<string, any> = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    };
    if (query.search) params.search = query.search;
    if (query.authorUserId) params.authorUserId = query.authorUserId;
    if (query.mentioningMe) params.mentioningMe = true;

    const res = await apiClient.get(BASE, { params });
    return unwrap<BlogListResult>(res.data);
  },

  async getOne(id: string): Promise<BlogPost> {
    const res = await apiClient.get(`${BASE}/${id}`);
    return unwrap<BlogPost>(res.data);
  },

  async create(payload: BlogPostPayload): Promise<BlogPost> {
    const res = await apiClient.post(BASE, payload);
    return unwrap<BlogPost>(res.data);
  },

  async update(id: string, payload: BlogPostPayload): Promise<BlogPost> {
    const res = await apiClient.put(`${BASE}/${id}`, payload);
    return unwrap<BlogPost>(res.data);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },

  async uploadImages(id: string, files: File[]): Promise<BlogPost> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const res = await apiClient.post(`${BASE}/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<BlogPost>(res.data);
  },

  async removeImage(id: string, imageId: string): Promise<BlogPost> {
    const res = await apiClient.delete(`${BASE}/${id}/images/${imageId}`);
    return unwrap<BlogPost>(res.data);
  },

  // ── Reactions ─────────────────────────────────────────────────────────────

  /** Picking the reaction you already have clears it — the server handles that. */
  async reactToPost(id: string, reaction: BlogReaction): Promise<BlogPost> {
    const res = await apiClient.post(`${BASE}/${id}/reactions`, { reaction });
    return unwrap<BlogPost>(res.data);
  },

  async clearPostReaction(id: string): Promise<BlogPost> {
    const res = await apiClient.delete(`${BASE}/${id}/reactions`);
    return unwrap<BlogPost>(res.data);
  },

  async listPostReactors(id: string): Promise<{ user: BlogUser; reaction: BlogReaction }[]> {
    const res = await apiClient.get(`${BASE}/${id}/reactions`);
    return unwrap<{ user: BlogUser; reaction: BlogReaction }[]>(res.data) ?? [];
  },

  async reactToComment(commentId: string, reaction: BlogReaction): Promise<BlogComment[]> {
    const res = await apiClient.post(`${BASE}/comments/${commentId}/reactions`, { reaction });
    return unwrap<BlogComment[]>(res.data) ?? [];
  },

  // ── Comments ──────────────────────────────────────────────────────────────

  /** The whole thread, two levels deep. Every mutation returns it again. */
  async listComments(id: string): Promise<BlogComment[]> {
    const res = await apiClient.get(`${BASE}/${id}/comments`);
    return unwrap<BlogComment[]>(res.data) ?? [];
  },

  async addComment(id: string, payload: CommentPayload): Promise<BlogComment[]> {
    const res = await apiClient.post(`${BASE}/${id}/comments`, payload);
    return unwrap<BlogComment[]>(res.data) ?? [];
  },

  async updateComment(commentId: string, payload: CommentPayload): Promise<BlogComment[]> {
    const res = await apiClient.put(`${BASE}/comments/${commentId}`, payload);
    return unwrap<BlogComment[]>(res.data) ?? [];
  },

  async removeComment(commentId: string): Promise<BlogComment[]> {
    const res = await apiClient.delete(`${BASE}/comments/${commentId}`);
    return unwrap<BlogComment[]>(res.data) ?? [];
  },

  // ── Mentions ──────────────────────────────────────────────────────────────

  async mentionableUsers(search: string, limit = 8): Promise<BlogUser[]> {
    const res = await apiClient.get(`${BASE}/mentionable-users`, {
      params: { search: search || undefined, limit },
    });
    return unwrap<BlogUser[]>(res.data) ?? [];
  },
};

export default HotspotBlogService;
