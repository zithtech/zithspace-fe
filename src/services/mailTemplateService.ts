import { api, apiUtils, ApiError, PaginatedResponse } from "@/lib/axios";

export interface MailTemplate {
  id: string;
  tenantId: string;
  templateName: string;
  module: string;
  triggerEvent: string;
  description?: string | null;
  subject: string;
  emailBody: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMailTemplateData {
  templateName: string;
  module: string;
  triggerEvent: string;
  description?: string;
  subject: string;
  emailBody: string;
  status?: boolean;
}

export interface UpdateMailTemplateData {
  templateName?: string;
  module?: string;
  triggerEvent?: string;
  description?: string;
  subject?: string;
  emailBody?: string;
  status?: boolean;
}

export interface MailTemplateFilters {
  search?: string;
  module?: string;
  status?: string;
}

export class MailTemplateService {
  /**
   * Get all mail templates
   */
  static async getAllMailTemplates(
    filters: MailTemplateFilters = {}
  ): Promise<PaginatedResponse<MailTemplate>> {
    try {
      return await apiUtils.getPaginated<MailTemplate>(
        "/api/mail-templates",
        filters
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch mail templates");
    }
  }

  /**
   * Get single mail template by ID
   */
  static async getMailTemplate(id: string): Promise<MailTemplate> {
    try {
      return await api.get<MailTemplate>(`/api/mail-templates/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch mail template");
    }
  }

  /**
   * Create mail template
   */
  static async createMailTemplate(
    data: CreateMailTemplateData
  ): Promise<MailTemplate> {
    try {
      return await api.post<MailTemplate>("/api/mail-templates", {
        ...data,
        status: data.status ?? true,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create mail template");
    }
  }

  /**
   * Update mail template
   */
  static async updateMailTemplate(
    id: string,
    data: UpdateMailTemplateData
  ): Promise<MailTemplate> {
    try {
      return await api.put<MailTemplate>(`/api/mail-templates/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update mail template");
    }
  }

  /**
   * Delete mail template
   */
  static async deleteMailTemplate(id: string): Promise<void> {
    try {
      await api.delete(`/api/mail-templates/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete mail template");
    }
  }
}
