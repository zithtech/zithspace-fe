import { api } from '@/lib/axios';

export interface TrashProject {
  id: string;
  name: string;
  code: string;
  description: string;
  status: string;
  updatedAt: string;
  projectManager: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

class ProjectTrashService {
  /**
   * Get all projects in trash
   */
  async getTrashProjects(): Promise<TrashProject[]> {
    return await api.get<TrashProject[]>('/api/projects/trash');
  }

  /**
   * Restore a project from trash
   */
  async restoreProject(projectId: string): Promise<void> {
    return await api.post<void>(`/api/projects/${projectId}/restore`);
  }

  /**
   * Permanently delete a project
   */
  async permanentDeleteProject(projectId: string): Promise<void> {
    return await api.delete<void>(`/api/projects/${projectId}/permanent`);
  }

  /**
   * Permanently delete all projects in trash
   */
  async emptyTrash(): Promise<void> {
    return await api.delete<void>('/api/projects/trash/empty');
  }

  /**
   * Bulk restore projects
   */
  async bulkRestore(ids: string[]): Promise<void> {
    return await api.post<void>('/api/projects/trash/bulk-restore', { ids });
  }

  /**
   * Bulk permanent delete projects
   */
  async bulkPermanentDelete(ids: string[]): Promise<void> {
    return await api.post<void>('/api/projects/trash/bulk-permanent-delete', { ids });
  }
}

export default new ProjectTrashService();
