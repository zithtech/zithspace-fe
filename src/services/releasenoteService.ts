import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface ReleaseNote {
  id: string;
  tenantId: string;
  projectId: string;
  version: string;
  title: string;
  releaseDate: string;
  environment: string;
  summary?: Record<string, any>;
  keyInsights?: Record<string, any>;
  newFeatures?: Record<string, any>;
  improvements?: Record<string, any>;
  bugFixes?: Record<string, any>;
  breakingChanges?: Record<string, any>;
  apiChanges?: Record<string, any>;
  databaseChanges?: Record<string, any>;
  knownIssues?: Record<string, any>;
  linkedTickets?: string[];
  repositories?: string[];
  pullRequests?: string[];
  visibility: string[];
  status: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
  project?: {
    id: string;
    name: string;
  };
}

export interface ReleaseNoteFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  version?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ReleaseNotesService {
  /**
   * Get all release notes with filters and pagination
   */
  static async getReleaseNotes(filters: ReleaseNoteFilters = {}): Promise<PaginatedResponse<ReleaseNote>> {
    try {
      return await apiUtils.getPaginated<ReleaseNote>('/api/releasenotes', filters);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to fetch release notes');
    }
  }

  /**
   * Get a single release note by ID
   */
  static async getReleaseNoteById(id: string): Promise<ReleaseNote> {
    try {
      return await api.get<ReleaseNote>(`/api/releasenotes/${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to fetch release note');
    }
  }

  /**
   * Create a new release note
   */
  static async createReleaseNote(data: Partial<ReleaseNote>): Promise<ReleaseNote> {
    try {
      return await api.post<ReleaseNote>('/api/releasenotes', data);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to create release note');
    }
  }

  /**
   * Update a release note by ID
   */
  static async updateReleaseNote(id: string, data: Partial<ReleaseNote>): Promise<ReleaseNote> {
    try {
      return await api.put<ReleaseNote>(`/api/releasenotes/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to update release note');
    }
  }

  /**
   * Delete a release note by ID
   */
  static async deleteReleaseNote(id: string): Promise<void> {
    try {
      await api.delete(`/api/releasenotes/${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error('Failed to delete release note');
    }
  }
}
