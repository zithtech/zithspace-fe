// @/services/invoiceSettingsService.ts
import { api, ApiError, apiUtils, PaginatedResponse } from "@/lib/axios";

// ==================== Type Definitions ====================

export enum Currency {
  USD = "USD", 
  INR = "INR", 
  EUR = "EUR", 
  GBP = "GBP", 
  AUD = "AUD", 
  CAD = "CAD", 
  SGD = "SGD"
}

export enum DateFormat {
  DD_MM_YYYY = "DD_MM_YYYY", 
  MM_DD_YYYY = "MM_DD_YYYY", 
  YYYY_MM_DD = "YYYY_MM_DD"
}

export interface GeneralSetting {
  id: string;
  companyName: string;
  address: any;
  primaryColor: string;
  currency: Currency;
  dateFormat: DateFormat;
  companyLogo?: string | null;
  signature?: string | null;
}

export interface InvoiceSetting {
  id: string;
  format: string;
  padding: number;
  nextNumber: number;
  resetYearly: boolean;
  lastResetYear: number;
}

export interface PaymentSetting {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  qrCode?: string | null;
}

export interface SettingsProfile {
  id: string;
  name: string;
  isActive: boolean;
  general: GeneralSetting;
  invoice: InvoiceSetting;
  payment: PaymentSetting;
  
  // Audit fields
  createdBy: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser?: { name: string };
}

export interface SettingsListParams {
  page?: number;
  limit?: number;
  isActive?: string | boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSettingsData {
  name: string;
  general: Omit<GeneralSetting, 'id'>;
  invoice: Omit<InvoiceSetting, 'id'>;
  payment: Omit<PaymentSetting, 'id'>;
}

export interface UpdateSettingsData {
  name?: string;
  isActive?: boolean;
  general?: Partial<Omit<GeneralSetting, 'id'>>;
  invoice?: Partial<Omit<InvoiceSetting, 'id'>>;
  payment?: Partial<Omit<PaymentSetting, 'id'>>;
}

// ==================== Service Class ====================

export class InvoiceSettingsService {
  /**
   * Get all settings profiles with pagination, filtering, and search
   */
  static async getProfiles(
    filters: SettingsListParams = {}
  ): Promise<PaginatedResponse<SettingsProfile>> {
    try {
      return await apiUtils.getPaginated<SettingsProfile>(
        "/api/invoicesetting",
        filters
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch settings profiles");
    }
  }

  /**
   * Get a specific profile by ID with all related settings
   */
  static async getProfile(id: string): Promise<SettingsProfile> {
    try {
      return await api.get<SettingsProfile>(`/api/invoicesetting/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch profile details");
    }
  }

  /**
   * Create a new settings profile with nested configurations
   */
  static async createProfile(
    data: CreateSettingsData
  ): Promise<SettingsProfile> {
    try {
      return await api.post<SettingsProfile>("/api/invoicesetting", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create settings profile");
    }
  }

  /**
   * Update a settings profile and its nested settings (General/Invoice/Payment)
   */
  static async updateProfile(
    id: string,
    data: UpdateSettingsData
  ): Promise<SettingsProfile> {
    try {
      return await api.patch<SettingsProfile>(`/api/invoicesetting/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update settings profile");
    }
  }

  /**
   * Deactivate a profile (Soft delete pattern)
   */
  static async deleteProfile(id: string): Promise<void> {
    try {
      await api.delete(`/api/invoicesetting/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to deactivate profile");
    }
  }

  /**
   * Set a profile as the active configuration for the tenant
   */
  static async activateProfile(id: string): Promise<SettingsProfile> {
    try {
      return await api.patch<SettingsProfile>(`/api/invoicesetting/${id}/activate`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to activate profile");
    }
  }
}