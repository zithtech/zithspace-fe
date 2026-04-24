import { apiClient } from "@/lib/axios";

export interface AIDocumentNode {
  title: string;
  type: "file" | "folder" | "section";
  children?: AIDocumentNode[];
  contentPrompt?: string;
}

class AIService {
  /**
   * Suggest a structure for a document hub
   */
  static async suggestStructure(prompt: string): Promise<{ suggestedTitle: string, structure: AIDocumentNode[] }> {
    try {
      const response = await apiClient.post("/api/ai/hub/generate", { prompt });
      return response.data.data;
    } catch (error: any) {
      console.error("Error suggesting hub structure:", error);
      throw error;
    }
  }

  /**
   * Execute bulk creation of nodes in a hub
   */
  static async executeHubCreation(hubId: string, structure: AIDocumentNode[]): Promise<void> {
    try {
      await apiClient.post("/api/ai/hub/execute", { hubId, structure });
    } catch (error: any) {
      console.error("Error executing AI hub creation:", error);
      throw error;
    }
  }

  /**
   * Generate content for a document
   */
  static async generateContent(title: string, context?: string): Promise<any[]> {
    try {
      const response = await apiClient.post("/api/ai/content/generate", { title, context });
      return response.data.data;
    } catch (error: any) {
      console.error("Error generating document content:", error);
      throw error;
    }
  }

  /**
   * Process selected text based on a prompt
   */
  static async processText(selectedText: string, prompt: string): Promise<string> {
    try {
      const response = await apiClient.post("/api/ai/text/process", { selectedText, prompt });
      return response.data.data;
    } catch (error: any) {
      console.error("Error processing selected text:", error);
      throw error;
    }
  }
  /**
   * Create only the skeleton structure for a hub
   */
  static async createHubStructure(hubId: string, structure: AIDocumentNode[]): Promise<{ documentId: string, title: string, type: string }[]> {
    try {
      const response = await apiClient.post("/api/ai/hub/structure", { hubId, structure });
      return response.data.data;
    } catch (error: any) {
      console.error("Error creating AI hub structure:", error);
      throw error;
    }
  }

  /**
   * Generate and save content for a specific document
   */
  static async generateAndSaveContent(documentId: string, contentPrompt?: string): Promise<void> {
    try {
      await apiClient.post(`/api/ai/document/${documentId}/content`, { contentPrompt });
    } catch (error: any) {
      console.error("Error generating/saving document content:", error);
      throw error;
    }
  }
}

export const aiService = AIService;
export default AIService;
