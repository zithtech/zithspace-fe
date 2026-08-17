import { apiClient } from '@/lib/axios';

export interface InvoiceTemplateField {
  id?: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  fieldOrder: number;
  isRequired: boolean;
  isSystem: boolean;
  options?: string[];
}

export interface InvoiceTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  billingType: string;
  isDefault: boolean;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  fields?: InvoiceTemplateField[];
  _count?: {
    fields: number;
  };
}

export interface CreateInvoiceTemplateData {
  name: string;
  description?: string;
  billingType: string;
  isDefault?: boolean;
  fields: Omit<InvoiceTemplateField, 'id'>[];
}

export interface UpdateInvoiceTemplateData {
  name?: string;
  description?: string;
  billingType?: string;
  isDefault?: boolean;
  isActive?: boolean;
  fields?: InvoiceTemplateField[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class InvoiceTemplateService {
  static async getTemplates(params?: { page?: number; limit?: number }) {
    try {
      const response = await apiClient.get<ApiResponse<InvoiceTemplate[]> & { pagination?: { total: number } }>('/api/invoice-templates', { params });
      return { data: response.data.data, total: response.data.pagination?.total || (response.data as any).total || response.data.data.length };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch templates');
    }
  }

  static async getTemplateById(id: string) {
    try {
      const response = await apiClient.get<ApiResponse<InvoiceTemplate>>(`/api/invoice-templates/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch template');
    }
  }

  static async createTemplate(data: CreateInvoiceTemplateData) {
    try {
      const response = await apiClient.post<ApiResponse<InvoiceTemplate>>('/api/invoice-templates', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create template');
    }
  }

  static async updateTemplate(id: string, data: UpdateInvoiceTemplateData) {
    try {
      const response = await apiClient.put<ApiResponse<InvoiceTemplate>>(`/api/invoice-templates/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update template');
    }
  }

  static async deleteTemplate(id: string) {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/api/invoice-templates/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete template');
    }
  }
}

export default InvoiceTemplateService;
