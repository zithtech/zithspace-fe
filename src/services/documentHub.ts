import { apiClient } from "@/lib/axios";

export type DocumentNodeType = "section" | "folder" | "file";

export interface DocumentTreeNode {
  id: string;
  tenantId: string;
  documentHubId: string;
  title: string;
  type: DocumentNodeType;
  parentId: string | null;
  documentId: string | null;
  position: number;
  createdById: string;
  createdAt: string;
}

export interface DocumentHub {
  id: string;
  tenantId: string;
  name: string;
  projectId?: string;
  ticketId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    code?: string;
  };
  ticket?: {
    id: string;
    title: string;
    status: string;
    ticketNumber: string;
  };
  createdBy?: {
    id: string;
    name: string;
    workEmail: string;
    position?: string;
    avatarUrl?: string;
  };
  visibility: string;
  shareToken?: string;
  treeNodes?: DocumentTreeNode[];
  /** True when the requesting user has starred this hub. */
  isStarred?: boolean;
}

export interface CreateDocumentHubData {
  name: string;
  projectId?: string;
  ticketId?: string;
  visibility?: string;
  /** "ai" when generated through Zai, omitted/anything else for manual creation. */
  source?: "ai" | "manual";
}

export interface UpdateDocumentHubData {
  name?: string;
  projectId?: string;
  ticketId?: string;
}

export interface DocumentHubListResponse {
  success: boolean;
  data: DocumentHub[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class DocumentHubService {
  /**
   * Create Document Hub
   */
  static async createDocumentHub(
    data: CreateDocumentHubData,
  ): Promise<DocumentHub> {
    try {
      const response = await apiClient.post("/api/documenthub", data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creating document hub:", error);
      const errorMessage =
        error.message || error.response?.data?.error || "Failed to create document hub";
      throw new Error(errorMessage);
    }
  }

  /**
   * Generate a documentation draft (hub name + first file title + HTML body)
   * from a free-form prompt. Server returns the draft; client persists it.
   */
  static async generateAiDocumentDraft(input: {
    prompt: string;
  }): Promise<{
    hubName: string;
    fileTitle: string;
    contentHtml: string;
    source: "gemini" | "mock";
    fallbackReason?: string;
  }> {
    try {
      const response = await apiClient.post(
        "/api/documenthub/ai-generate",
        input,
        { timeout: 120_000 },
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error generating AI document draft:", error);
      const errorMessage =
        error.message || error.response?.data?.error || "Failed to generate document draft";
      throw new Error(errorMessage);
    }
  }

  /**
   * Rewrite a selected excerpt of a document according to a user instruction.
   * Used by the inline Zai menu when a user selects text in the editor.
   */
  static async rewriteAiSelection(input: {
    text: string;
    instruction: string;
  }): Promise<{
    rewrittenHtml: string;
    source: "gemini" | "mock";
    fallbackReason?: string;
  }> {
    try {
      const response = await apiClient.post(
        "/api/documenthub/ai-rewrite",
        input,
        { timeout: 120_000 },
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error rewriting AI selection:", error);
      const errorMessage =
        error.message || error.response?.data?.error || "Failed to rewrite selection";
      throw new Error(errorMessage);
    }
  }

  /** Star (favourite) a document hub for the current user. */
  static async starDocumentHub(hubId: string): Promise<void> {
    try {
      await apiClient.post(`/api/documenthub/${hubId}/star`);
    } catch (error: any) {
      console.error("Error starring hub:", error);
      throw error;
    }
  }

  /** Remove the current user's star from a document hub. */
  static async unstarDocumentHub(hubId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/documenthub/${hubId}/star`);
    } catch (error: any) {
      console.error("Error unstarring hub:", error);
      throw error;
    }
  }

  static async getAllDocumentHubs(): Promise<DocumentHub[]> {
    try {
      const response = await apiClient.get("/api/documenthub");
      return response.data.data;
    } catch (error: any) {
      console.error("Error getting all document hubs:", error);
      throw error;
    }
  }

  /**
   * List document hubs linked to a specific ticket. Backed by the same
   * `/api/documenthub` endpoint with a `ticketId` query filter.
   */
  static async getDocumentHubsByTicket(
    ticketId: string,
  ): Promise<DocumentHub[]> {
    try {
      const response = await apiClient.get("/api/documenthub", {
        params: { ticketId },
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error getting document hubs for ticket:", error);
      throw error;
    }
  }

  static async getDocumentHub(
    documentId: string,
  ): Promise<DocumentHub> {
    try {
      const response = await apiClient.get(`/api/documenthub/${documentId}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching document hub:", error);
      const errorMessage =
        error.message || error.response?.data?.error || "Failed to fetch document hub";
      throw new Error(errorMessage);
    }
  }

  static async updateDocumentHub(
    id: string,
    data: UpdateDocumentHubData
  ): Promise<DocumentHub> {
    try {
      const response = await apiClient.patch(`/api/documenthub/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating document hub:", error);
      const errorMessage =
        error.message || error.response?.data?.error || "Failed to update document hub";
      throw new Error(errorMessage);
    }
  }

  static async createTreeNode(data: {
    documentHubId: string;
    parentId?: string | null;
    type: "file" | "folder" | "section";
    title: string;
    /** "ai" when this file/folder was produced by a Zai flow. */
    source?: "ai" | "manual";
  }): Promise<DocumentTreeNode> {
    try {
      const response = await apiClient.post("/api/documenthub/node", data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creating tree node:", error);
      throw error;
    }
  }

  static async updateTreeNode(
    nodeId: string,
    data: { title?: string; parentId?: string | null }
  ): Promise<DocumentTreeNode> {
    try {
      const response = await apiClient.put(`/api/documenthub/node/${nodeId}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating tree node:", error);
      throw error;
    }
  }

  static async getDocument(documentId: string): Promise<any> {
    try {
      const response = await apiClient.get(
        `/api/documenthub/document/${documentId}`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error getting document:", error);
      throw error;
    }
  }

  static async downloadDocumentPdf(documentId: string): Promise<Blob> {
    try {
      const token = localStorage.getItem('accessToken');
      let headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      const savedTenant = localStorage.getItem('currentTenant');
      if (savedTenant) {
        const tenant = JSON.parse(savedTenant);
        if (tenant.tenantId) headers['X-Tenant-ID'] = tenant.tenantId;
        if (tenant.subdomain) headers['X-Tenant-Subdomain'] = tenant.subdomain;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/documenthub/document/${documentId}/pdf`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      return await response.blob();
    } catch (error: any) {
      console.error("Error downloading document PDF:", error);
      throw error;
    }
  }

  static async updateDocument(
    documentId: string,
    data: { content?: any; title?: string; expectedVersion?: number },
  ): Promise<any> {
    try {
      const response = await apiClient.put(
        `/api/documenthub/document/${documentId}`,
        data,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating document:", error);
      throw error;
    }
  }

  static async deleteDocumentHistoryEntry(
    documentId: string,
    historyId: string,
  ): Promise<void> {
    try {
      await apiClient.delete(
        `/api/documenthub/document/${documentId}/history/${historyId}`,
      );
    } catch (error: any) {
      console.error("Error deleting history entry:", error);
      throw error;
    }
  }

  static async getDocumentHistory(documentId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(
        `/api/documenthub/document/${documentId}/history`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error getting document history:", error);
      throw error;
    }
  }


  static async deleteDocumentHub(id: string, permanent?: boolean): Promise<void> {
    try {
      const url = permanent ? `/api/documenthub/${id}?permanent=true` : `/api/documenthub/${id}`;
      await apiClient.delete(url);
    } catch (error: any) {
      console.error("Error deleting document hub:", error);
      throw error;
    }
  }

  static async deleteTreeNode(nodeId: string, permanent?: boolean): Promise<void> {
    try {
      const url = permanent ? `/api/documenthub/node/${nodeId}?permanent=true` : `/api/documenthub/node/${nodeId}`;
      await apiClient.delete(url);
    } catch (error: any) {
      console.error("Error deleting tree node:", error);
      const errorMessage =
        error.message || error.response?.data?.error || "Failed to delete tree node";
      throw new Error(errorMessage);
    }
  }

  static async restoreDocumentHub(id: string): Promise<void> {
    try {
      await apiClient.post(`/api/documenthub/${id}/restore`);
    } catch (error: any) {
      console.error("Error restoring document hub:", error);
      throw error;
    }
  }

  static async deleteDocument(id: string, permanent?: boolean): Promise<void> {
    try {
      const url = permanent ? `/api/documenthub/document/${id}?permanent=true` : `/api/documenthub/document/${id}`;
      await apiClient.delete(url);
    } catch (error: any) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  static async restoreDocument(id: string): Promise<void> {
    try {
      await apiClient.post(`/api/documenthub/document/${id}/restore`);
    } catch (error: any) {
      console.error("Error restoring document:", error);
      throw error;
    }
  }

  static async getTrash(type?: 'hub' | 'document' | 'folder'): Promise<{ hubs: DocumentHub[], documents: any[], folders: any[] }> {
    try {
      const response = await apiClient.get('/api/documenthub/trash', {
        params: { type }
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error getting trash:", error);
      throw error;
    }
  }

  static async restoreTreeNode(id: string, data: { documentHubId: string, parentId?: string | null }): Promise<void> {
    try {
      await apiClient.post(`/api/documenthub/node/${id}/restore`, data);
    } catch (error: any) {
      console.error("Error restoring tree node:", error);
      const errorMessage = error.message || error.response?.data?.error || "Failed to restore folder/section";
      throw new Error(errorMessage);
    }
  }

  static async shareDocument(id: string, visibility: 'private' | 'public'): Promise<any> {
    try {
      const response = await apiClient.put(`/api/documenthub/document/${id}/share`, { visibility });
      return response.data.data;
    } catch (error: any) {
      console.error("Error sharing document:", error);
      throw error;
    }
  }

  static async revokeShare(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/documenthub/document/${id}/share`);
    } catch (error: any) {
      console.error("Error revoking share:", error);
      throw error;
    }
  }

  static async getPublicDocument(shareToken: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/public/document/${shareToken}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error getting public document:", error);
      throw error;
    }
  }

  static async shareDocumentHub(id: string, visibility: 'private' | 'public'): Promise<any> {
    try {
      const response = await apiClient.put(`/api/documenthub/${id}/share`, { visibility });
      return response.data.data;
    } catch (error: any) {
      console.error("Error sharing document hub:", error);
      throw error;
    }
  }

  static async revokeHubShare(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/documenthub/${id}/share`);
    } catch (error: any) {
      console.error("Error revoking hub share:", error);
      throw error;
    }
  }

  static async getPublicDocumentHub(token: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/public/document/hub/${token}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error getting public document hub:", error);
      throw error;
    }
  }

  static async getPublicHubDocumentContent(token: string, documentId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/public/document/hub/${token}/document/${documentId}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error getting public hub document content:", error);
      throw error;
    }
  }
}

export const documentHubService = DocumentHubService;
export default DocumentHubService;
