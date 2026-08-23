import { apiClient } from '@/lib/axios';

export interface DocumentCategory {
  id: string;
  tenantId: string;
  categoryName: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplatePlaceholder {
  id: string;
  tenantId: string;
  templateId: string;
  placeholderKey: string;
  placeholderLabel: string;
  dataType: string;
  required: boolean;
  defaultValue?: string;
  displayOrder: number;
}

export interface TemplateVersion {
  id: string;
  tenantId: string;
  templateId: string;
  versionNumber: number;
  editorContent: string;
  changeNotes?: string;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string; workEmail?: string; avatar?: string; avatarUrl?: string };
}

export interface DocumentTemplate {
  id: string;
  tenantId: string;
  templateName: string;
  categoryId?: string;
  designationId?: string;
  description?: string;
  editorContent: string;
  currentVersion: number;
  status: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  category?: DocumentCategory;
  designation?: { id: string; name: string };
  placeholders?: TemplatePlaceholder[];
  versions?: TemplateVersion[];
  createdBy?: { id: string; name: string; workEmail?: string; avatar?: string; avatarUrl?: string };
  _count?: {
    versions: number;
    generatedDocuments: number;
  };
}

export interface GeneratedDocumentValue {
  id: string;
  tenantId: string;
  generatedDocumentId: string;
  placeholderKey: string;
  placeholderValue?: string;
}

export interface DocumentFile {
  id: string;
  tenantId: string;
  generatedDocumentId: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize?: number;
  storageProvider: string;
  createdAt: string;
}

export interface GeneratedDocument {
  id: string;
  tenantId: string;
  templateId?: string;
  categoryId?: string;
  referenceEntityId?: string;
  referenceEntityType?: string;
  documentNumber: string;
  documentName?: string;
  status: string;
  generatedById: string;
  generatedAt: string;
  docxFilePath?: string;
  pdfFilePath?: string;
  template?: DocumentTemplate;
  category?: DocumentCategory;
  generatedBy?: { id: string; name: string; workEmail?: string; avatar?: string; avatarUrl?: string };
  values?: GeneratedDocumentValue[];
  files?: DocumentFile[];
  _count?: {
    values: number;
    files: number;
  };
}

export interface DocumentStructure {
  id: string;
  tenantId: string;
  name: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string; workEmail?: string; avatar?: string; avatarUrl?: string };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class LettersService {
  // ─── Categories ──────────────────────────────────────────────────
  static async getCategories(): Promise<DocumentCategory[]> {
    const res = await apiClient.get<ApiResponse<DocumentCategory[]>>('/api/hrms/letters/categories');
    return res.data.data;
  }

  static async createCategory(data: { categoryName: string; description?: string }): Promise<DocumentCategory> {
    const res = await apiClient.post<ApiResponse<DocumentCategory>>('/api/hrms/letters/categories', data);
    return res.data.data;
  }

  static async updateCategory(id: string, data: { categoryName?: string; description?: string; status?: string }): Promise<DocumentCategory> {
    const res = await apiClient.put<ApiResponse<DocumentCategory>>(`/api/hrms/letters/categories/${id}`, data);
    return res.data.data;
  }

  static async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/api/hrms/letters/categories/${id}`);
  }

  // ─── Document Structures ─────────────────────────────────────────
  static async getStructures(): Promise<DocumentStructure[]> {
    const res = await apiClient.get<ApiResponse<DocumentStructure[]>>('/api/hrms/letters/structures');
    return res.data.data;
  }

  static async createStructure(name: string, htmlContent: string): Promise<DocumentStructure> {
    const res = await apiClient.post<ApiResponse<DocumentStructure>>('/api/hrms/letters/structures', {
      name,
      htmlContent,
    });
    return res.data.data;
  }

  static async getStructureById(id: string): Promise<DocumentStructure> {
    const res = await apiClient.get<ApiResponse<DocumentStructure>>(`/api/hrms/letters/structures/${id}`);
    return res.data.data;
  }

  static async updateStructure(id: string, name: string, htmlContent: string): Promise<DocumentStructure> {
    const res = await apiClient.put<ApiResponse<DocumentStructure>>(`/api/hrms/letters/structures/${id}`, {
      name,
      htmlContent,
    });
    return res.data.data;
  }

  static async deleteStructure(id: string): Promise<void> {
    await apiClient.delete(`/api/hrms/letters/structures/${id}`);
  }

  // ─── Templates ───────────────────────────────────────────────────
  static async getTemplates(params?: { categoryId?: string; designationId?: string; status?: string; search?: string; limit?: number; offset?: number; }): Promise<{ data: DocumentTemplate[]; total?: number; stats?: any }> {
    const res = await apiClient.get<any>('/api/hrms/letters/templates', { params });
    return res.data;
  }

  static async getTemplateById(id: string): Promise<DocumentTemplate> {
    const res = await apiClient.get<ApiResponse<DocumentTemplate>>(`/api/hrms/letters/templates/${id}`);
    return res.data.data;
  }

  static async createTemplate(data: {
    templateName: string;
    categoryId?: string;
    designationId?: string;
    description?: string;
    editorContent: string;
    placeholders?: Omit<TemplatePlaceholder, 'id' | 'tenantId' | 'templateId'>[];
    isGlobal?: boolean;
  }): Promise<DocumentTemplate> {
    const res = await apiClient.post<ApiResponse<DocumentTemplate>>('/api/hrms/letters/templates', data);
    return res.data.data;
  }

  static async updateTemplate(id: string, data: {
    templateName?: string;
    categoryId?: string | null;
    designationId?: string | null;
    description?: string;
    editorContent?: string;
    changeNotes?: string;
    placeholders?: Omit<TemplatePlaceholder, 'id' | 'tenantId' | 'templateId'>[];
    isGlobal?: boolean;
  }): Promise<DocumentTemplate> {
    const res = await apiClient.put<ApiResponse<DocumentTemplate>>(`/api/hrms/letters/templates/${id}`, data);
    return res.data.data;
  }

  static async createTemplateBasic(templateName: string, categoryId?: string, isGlobal?: boolean): Promise<DocumentTemplate> {
    const response = await apiClient.post<ApiResponse<DocumentTemplate>>('/api/letters-docs/templates', {
      templateName,
      categoryId,
      editorContent: ' ', // Empty space to satisfy backend requirement
      isGlobal
    });
    return response.data.data;
  }

  static async duplicateTemplate(id: string, newName?: string): Promise<DocumentTemplate> {
    const res = await apiClient.post<ApiResponse<DocumentTemplate>>(`/api/hrms/letters/templates/${id}/duplicate`, { newName });
    return res.data.data;
  }

  static async restoreVersion(id: string, versionNumber: number): Promise<DocumentTemplate> {
    const res = await apiClient.post<ApiResponse<DocumentTemplate>>(`/api/hrms/letters/templates/${id}/restore/${versionNumber}`);
    return res.data.data;
  }

  static async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/api/hrms/letters/templates/${id}`);
  }

  static async uploadTemplateImage(base64Image: string): Promise<string> {
    const res = await apiClient.post<ApiResponse<{ url: string }>>('/api/hrms/letters/templates/upload-image', {
      image: base64Image,
    });
    return res.data.data.url;
  }

  // ─── Generated Letters ───────────────────────────────────────────
  static async getGeneratedLetters(params?: { templateId?: string; categoryId?: string; search?: string }): Promise<GeneratedDocument[]> {
    const res = await apiClient.get<ApiResponse<GeneratedDocument[]>>('/api/hrms/letters/generated', { params });
    return res.data.data;
  }

  static async getGeneratedLetterById(id: string): Promise<GeneratedDocument> {
    const res = await apiClient.get<ApiResponse<GeneratedDocument>>(`/api/hrms/letters/generated/${id}`);
    return res.data.data;
  }

  static async updateGeneratedLetter(id: string, data: any): Promise<GeneratedDocument> {
    const res = await apiClient.put<ApiResponse<GeneratedDocument>>(`/api/hrms/letters/generated/${id}`, data);
    return res.data.data;
  }

  static async previewLetter(templateId: string, values: Record<string, string>, generatedDocumentId?: string, customContent?: string): Promise<string> {
    const res = await apiClient.post<ApiResponse<{ renderedHtml: string }>>('/api/hrms/letters/generated/preview', { templateId, values, generatedDocumentId, customContent });
    return res.data.data.renderedHtml;
  }

  static async generateLetter(data: {
    templateId: string;
    referenceEntityId?: string;
    referenceEntityType?: string;
    documentNumber?: string;
    documentName?: string;
    values: Record<string, string>;
    customContent?: string;
  }): Promise<GeneratedDocument> {
    const res = await apiClient.post<ApiResponse<GeneratedDocument>>('/api/hrms/letters/generated', data);
    return res.data.data;
  }

  static async deleteGeneratedLetter(id: string): Promise<void> {
    await apiClient.delete(`/api/hrms/letters/generated/${id}`);
  }

  static async downloadLetter(id: string, type: 'pdf' | 'docx', filename?: string): Promise<void> {
    const response = await apiClient.get(`/api/hrms/letters/generated/${id}/download-${type}`, {
      responseType: 'blob',
    });
    const contentType = type === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const blob = new Blob([response.data], { type: response.headers['content-type']?.toString() || contentType });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || `document.${type}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }

  static async generateTemplateWithZai(payload: {
    templateName: string;
    categoryId?: string;
    description: string;
    placeholders: string[];
  }): Promise<DocumentTemplate> {
    const res = await apiClient.post('/api/hrms/letters/templates/zai', payload);
    return res.data.data;
  }
}
