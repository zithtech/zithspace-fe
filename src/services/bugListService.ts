import { apiClient } from "@/lib/axios";

// Severity & Type are tenant-configurable — any non-empty key the tenant has
// defined in settings is valid. We keep the legacy union as a hint of typical
// values while accepting plain strings.
export type BugSeverity = "blocker" | "critical" | "major" | "minor" | (string & {});
export type BugType = "ui" | "functional" | "api" | (string & {});
export type BugStatus = "new" | "converted" | "ignored" | "verified" | "reopened" | "trash" | "archived";

export interface BugAttachment {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType: string;
  isNew?: boolean;
}

export interface BugExternalLink {
  id?: string;
  label?: string;
  url: string;
}

export interface BugFolder {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  projectId?: string | null;
  clientId?: string | null;
  color?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: { sheets: number; completedSheets?: number; bugs: number };
}

export type BugSheetStatus = "active" | "current" | "completed" | "archived";

export interface BugSheet {
  id: string;
  folderId: string;
  name: string;
  description?: string | null;
  status?: BugSheetStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: { bugs: number };
}

export interface BugListItem {
  id: string;
  tenantId: string;
  folderId: string;
  sheetId: string;
  bugNumber?: string | null;
  title?: string | null;
  description: string;
  module?: string | null;
  bugType?: BugType | null;
  severity?: BugSeverity | null;
  status: BugStatus;
  bugStatus?: "not started" | "pending" | "completed" | null;
  tags: string[];
  attachments: BugAttachment[];
  externalLinks: BugExternalLink[];
  ticketId?: string | null;
  ticketNumber?: string | null;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; workEmail: string; avatarUrl?: string } | null;
  createdById: string;
  createdBy?: { id: string; name: string; workEmail: string };
  createdAt: string;
  updatedAt: string;
}

export interface BugListResponse {
  bugs: BugListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateBugInput {
  folderId: string;
  sheetId: string;
  title?: string;
  description: string;
  module?: string;
  bugType?: BugType;
  severity?: BugSeverity;
  tags?: string[];
  assigneeId?: string;
  attachments?: BugAttachment[];
  externalLinks?: BugExternalLink[];
}

export interface UpdateBugInput {
  title?: string | null;
  description?: string;
  module?: string | null;
  bugType?: BugType | null;
  severity?: BugSeverity | null;
  status?: BugStatus;
  bugStatus?: "not started" | "pending" | "completed" | null;
  tags?: string[];
  assigneeId?: string | null;
  attachments?: BugAttachment[];
  externalLinks?: BugExternalLink[];
}

export interface BugListFilters {
  folderId?: string;
  sheetId?: string;
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  severity?: BugSeverity;
  status?: BugStatus;
  bugType?: BugType;
  createdById?: string;
  assigneeId?: string;
  scope?: "all" | "mine" | "trash" | "archived";
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AiReviewResult {
  bugId: string;
  cleanedDescription: string;
  suggestedTitle: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  missingDetails: string[];
}

export interface AiGroupSuggestion {
  groupKey: string;
  title: string;
  module?: string;
  reason: string;
  bugIds: string[];
}

export interface BulkConvertGroup {
  title: string;
  description: string;
  acceptanceCriteria?: string;
  bugIds: string[];
  assigneeId?: string;
  projectId?: string;
  attachments?: BugAttachment[];
  externalLinks?: BugExternalLink[];
}

export interface BugConfigOption {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  color?: string | null;
  sortOrder: number;
  isDefault: boolean;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BugConfigCreateInput {
  key?: string;
  label: string;
  description?: string | null;
  color?: string | null;
  sortOrder?: number;
  isDefault?: boolean;
}

export interface BugConfigUpdateInput {
  label?: string;
  description?: string | null;
  color?: string | null;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface ConvertedTicket {
  ticketId: string;
  ticketNumber: string;
  bugIds: string[];
}

class BugListService {
  // ==================== Folders ====================
  static async getFolders(): Promise<BugFolder[]> {
    const res = await apiClient.get<{ success: boolean; data: BugFolder[] }>(
      "/api/bug-list/folders"
    );
    return res.data.data;
  }

  static async createFolder(input: {
    name: string;
    description?: string;
    projectId?: string;
    clientId?: string;
    color?: string;
  }): Promise<BugFolder> {
    const res = await apiClient.post<{ success: boolean; data: BugFolder }>(
      "/api/bug-list/folders",
      input
    );
    return res.data.data;
  }

  static async updateFolder(
    id: string,
    input: Partial<{ name: string; description: string; color: string }>
  ): Promise<BugFolder> {
    const res = await apiClient.put<{ success: boolean; data: BugFolder }>(
      `/api/bug-list/folders/${id}`,
      input
    );
    return res.data.data;
  }

  static async deleteFolder(id: string): Promise<void> {
    await apiClient.delete(`/api/bug-list/folders/${id}`);
  }

  static async getArchivedFolders(): Promise<BugFolder[]> {
    const res = await apiClient.get<{ success: boolean; data: BugFolder[] }>(
      "/api/bug-list/folders/archived"
    );
    return res.data.data;
  }

  static async getTrashedFolders(): Promise<BugFolder[]> {
    const res = await apiClient.get<{ success: boolean; data: BugFolder[] }>(
      "/api/bug-list/folders/trashed"
    );
    return res.data.data;
  }

  static async archiveFolder(id: string): Promise<void> {
    await apiClient.patch(`/api/bug-list/folders/${id}/archive`);
  }

  static async restoreFolder(id: string): Promise<void> {
    await apiClient.post(`/api/bug-list/folders/${id}/restore`);
  }

  static async permanentDeleteFolder(id: string): Promise<void> {
    await apiClient.delete(`/api/bug-list/folders/${id}/permanent`);
  }

  // ==================== Sheets ====================
  static async getSheets(folderId: string): Promise<BugSheet[]> {
    const res = await apiClient.get<{ success: boolean; data: BugSheet[] }>(
      `/api/bug-list/folders/${folderId}/sheets`
    );
    return res.data.data;
  }

  static async getArchivedSheets(folderId?: string): Promise<BugSheet[]> {
    const res = await apiClient.get<{ success: boolean; data: BugSheet[] }>(
      `/api/bug-list/sheets/archived${folderId ? `?folderId=${folderId}` : ""}`
    );
    return res.data.data;
  }

  static async createSheet(input: {
    folderId: string;
    name: string;
    description?: string;
  }): Promise<BugSheet> {
    const res = await apiClient.post<{ success: boolean; data: BugSheet }>(
      `/api/bug-list/folders/${input.folderId}/sheets`,
      { name: input.name, description: input.description }
    );
    return res.data.data;
  }

  static async updateSheet(
    id: string,
    input: Partial<{ name: string; description: string }>
  ): Promise<BugSheet> {
    const res = await apiClient.put<{ success: boolean; data: BugSheet }>(
      `/api/bug-list/sheets/${id}`,
      input
    );
    return res.data.data;
  }

  static async updateSheetStatus(
    id: string,
    status: BugSheetStatus
  ): Promise<BugSheet> {
    const res = await apiClient.patch<{ success: boolean; data: BugSheet }>(
      `/api/bug-list/sheets/${id}/status`,
      { status }
    );
    return res.data.data;
  }

  static async deleteSheet(id: string): Promise<void> {
    await apiClient.delete(`/api/bug-list/sheets/${id}`);
  }

  static async getTrashedSheets(folderId?: string): Promise<any[]> {
    const res = await apiClient.get<{ success: boolean; data: any[] }>(
      `/api/bug-list/sheets/trashed${folderId ? `?folderId=${folderId}` : ""}`
    );
    return res.data.data;
  }

  static async restoreSheet(id: string): Promise<void> {
    await apiClient.post(`/api/bug-list/sheets/${id}/restore`);
  }

  static async permanentDeleteSheet(id: string): Promise<void> {
    await apiClient.delete(`/api/bug-list/sheets/${id}/permanent`);
  }

  // ==================== Bugs ====================
  static async listBugs(filters: BugListFilters = {}): Promise<BugListResponse> {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const res = await apiClient.get<{ success: boolean; data: BugListResponse }>(
      `/api/bug-list/bugs${qs.toString() ? `?${qs.toString()}` : ""}`
    );
    return res.data.data;
  }

  static async getBug(id: string): Promise<BugListItem> {
    const res = await apiClient.get<{ success: boolean; data: BugListItem }>(
      `/api/bug-list/bugs/${id}`
    );
    return res.data.data;
  }

  static async createBug(input: CreateBugInput): Promise<BugListItem> {
    const res = await apiClient.post<{ success: boolean; data: BugListItem }>(
      `/api/bug-list/bugs`,
      input
    );
    return res.data.data;
  }

  static async updateBug(id: string, input: UpdateBugInput): Promise<BugListItem> {
    const res = await apiClient.put<{ success: boolean; data: BugListItem }>(
      `/api/bug-list/bugs/${id}`,
      input
    );
    return res.data.data;
  }

  static async deleteBug(id: string): Promise<void> {
    await apiClient.delete(`/api/bug-list/bugs/${id}`);
  }

  static async permanentDeleteBug(id: string): Promise<void> {
    await apiClient.delete(`/api/bug-list/bugs/${id}/permanent`);
  }

  static async restoreBug(id: string): Promise<void> {
    await apiClient.post(`/api/bug-list/bugs/${id}/restore`);
  }

  static async bulkUpdateStatus(
    bugIds: string[],
    status: BugStatus
  ): Promise<{ updated: number }> {
    const res = await apiClient.post<{ success: boolean; data: { updated: number } }>(
      `/api/bug-list/bugs/bulk-status`,
      { bugIds, status }
    );
    return res.data.data;
  }

  static async bulkDelete(bugIds: string[]): Promise<{ movedToTrash: number }> {
    const res = await apiClient.post<{ success: boolean; data: { movedToTrash: number } }>(
      `/api/bug-list/bugs/bulk-delete`,
      { bugIds }
    );
    return res.data.data;
  }

  static async bulkPermanentDelete(bugIds: string[]): Promise<{ deleted: number }> {
    const res = await apiClient.post<{ success: boolean; data: { deleted: number } }>(
      `/api/bug-list/bugs/bulk-permanent-delete`,
      { bugIds }
    );
    return res.data.data;
  }

  static async bulkRestore(bugIds: string[]): Promise<{ restored: number }> {
    const res = await apiClient.post<{ success: boolean; data: { restored: number } }>(
      `/api/bug-list/bugs/bulk-restore`,
      { bugIds }
    );
    return res.data.data;
  }

  static async bulkMove(
    bugIds: string[],
    targetSheetId: string
  ): Promise<{ moved: number }> {
    const res = await apiClient.post<{ success: boolean; data: { moved: number } }>(
      `/api/bug-list/bugs/bulk-move`,
      { bugIds, targetSheetId }
    );
    return res.data.data;
  }

  // ==================== Stats ====================
  static async getStats(params: {
    folderId?: string;
    sheetId?: string;
    scope?: "all" | "mine" | "trash" | "archived";
  }): Promise<{
    total: number;
    open: number;
    blockers: number;
    verified: number;
    completed: number;
    linked: number;
    totalFolders: number;
    totalSheets: number;
  }> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const res = await apiClient.get<{ success: boolean; data: any }>(
      `/api/bug-list/stats${qs.toString() ? `?${qs.toString()}` : ""}`
    );
    return res.data.data;
  }

  // ==================== AI ====================
  static async aiReview(bugIds: string[]): Promise<AiReviewResult[]> {
    const res = await apiClient.post<{ success: boolean; data: AiReviewResult[] }>(
      `/api/bug-list/ai/review`,
      { bugIds }
    );
    return res.data.data;
  }

  static async aiEnhanceText(text: string): Promise<string> {
    const res = await apiClient.post<{ success: boolean; data: { text: string } }>(
      `/api/bug-list/ai/enhance-text`,
      { text }
    );
    return res.data.data.text;
  }

  static async aiSuggestGroups(bugIds: string[]): Promise<AiGroupSuggestion[]> {
    const res = await apiClient.post<{ success: boolean; data: AiGroupSuggestion[] }>(
      `/api/bug-list/ai/group`,
      { bugIds }
    );
    return res.data.data;
  }

  static async bulkConvertToTickets(
    groups: BulkConvertGroup[]
  ): Promise<ConvertedTicket[]> {
    const res = await apiClient.post<{ success: boolean; data: ConvertedTicket[] }>(
      `/api/bug-list/bugs/bulk-convert`,
      { groups }
    );
    return res.data.data;
  }

  // ==================== Config: severity / type ====================
  static async listSeverityOptions(): Promise<BugConfigOption[]> {
    const res = await apiClient.get<{ success: boolean; data: BugConfigOption[] }>(
      `/api/bug-list/config/severities`,
    );
    return res.data.data;
  }

  static async createSeverityOption(input: BugConfigCreateInput): Promise<BugConfigOption> {
    const res = await apiClient.post<{ success: boolean; data: BugConfigOption }>(
      `/api/bug-list/config/severities`,
      input,
    );
    return res.data.data;
  }

  static async updateSeverityOption(
    id: string,
    input: BugConfigUpdateInput,
  ): Promise<BugConfigOption> {
    const res = await apiClient.put<{ success: boolean; data: BugConfigOption }>(
      `/api/bug-list/config/severities/${id}`,
      input,
    );
    return res.data.data;
  }

  static async deleteSeverityOption(id: string): Promise<void> {
    await apiClient.delete(`/api/bug-list/config/severities/${id}`);
  }

  static async listTypeOptions(): Promise<BugConfigOption[]> {
    const res = await apiClient.get<{ success: boolean; data: BugConfigOption[] }>(
      `/api/bug-list/config/types`,
    );
    return res.data.data;
  }

  static async createTypeOption(input: BugConfigCreateInput): Promise<BugConfigOption> {
    const res = await apiClient.post<{ success: boolean; data: BugConfigOption }>(
      `/api/bug-list/config/types`,
      input,
    );
    return res.data.data;
  }

  static async updateTypeOption(
    id: string,
    input: BugConfigUpdateInput,
  ): Promise<BugConfigOption> {
    const res = await apiClient.put<{ success: boolean; data: BugConfigOption }>(
      `/api/bug-list/config/types/${id}`,
      input,
    );
    return res.data.data;
  }

  static async deleteTypeOption(id: string): Promise<void> {
    await apiClient.delete(`/api/bug-list/config/types/${id}`);
  }

  // ==================== QA verification ====================
  static async verify(bugId: string): Promise<BugListItem> {
    const res = await apiClient.post<{ success: boolean; data: BugListItem }>(
      `/api/bug-list/bugs/${bugId}/verify`
    );
    return res.data.data;
  }

  static async reopen(bugId: string): Promise<BugListItem> {
    const res = await apiClient.post<{ success: boolean; data: BugListItem }>(
      `/api/bug-list/bugs/${bugId}/reopen`
    );
    return res.data.data;
  }
}

export default BugListService;
