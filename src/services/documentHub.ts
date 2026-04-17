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
  };
  treeNodes?: DocumentTreeNode[];
}

export interface CreateDocumentHubData {
  name: string;
  projectId?: string;
  ticketId?: string;
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
        error.response?.data?.error || "Failed to create document hub";
      throw new Error(errorMessage);
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

  static async getDocumentHub(
    documentId: string,
  ): Promise<DocumentHub> {
    try {
      const response = await apiClient.get(`/api/documenthub/${documentId}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creating document hub:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to create document hub";
      throw new Error(errorMessage);
    }
  }

  static async updateDocumentHub(
    id: string,
    data: { name: string }
  ): Promise<DocumentHub> {
    try {
      const response = await apiClient.patch(`/api/documenthub/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating document hub:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update document hub";
      throw new Error(errorMessage);
    }
  }

  static async createTreeNode(data: {
    documentHubId: string;
    parentId?: string | null;
    type: "file" | "folder" | "section";
    title: string;
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
    data: { title: string }
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

  static async updateDocument(
    documentId: string,
    data: { content?: any; title?: string },
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


  static async deleteDocumentHub(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/documenthub/${id}`);
    } catch (error: any) {
      console.error("Error deleting document hub:", error);
      throw error;
    }
  }

  static async deleteTreeNode(nodeId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/documenthub/node/${nodeId}`);
    } catch (error: any) {
      console.error("Error deleting tree node:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete tree node";
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

  static async deleteDocument(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/documenthub/document/${id}`);
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
      const errorMessage = error.response?.data?.error || "Failed to restore folder/section";
      throw new Error(errorMessage);
    }
  }

  static async shareDocument(id: string, visibility: 'private' | 'internal' | 'public'): Promise<any> {
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
}

export const documentHubService = DocumentHubService;
export default DocumentHubService;
