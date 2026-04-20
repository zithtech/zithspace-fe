import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  workingMinutes: number;
  graceMinutes: number;
  lunchBreakMinutes: number;
  overtimeThreshold: number;
  isFlexible: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DropdownOption {
  id: string; // Changed from _id to id for PostgreSQL compatibility
  type: 'platform' | 'stack' | 'priority' | 'taskLevel' | 'taskType' | 'status';
  value: string;
  label: string;
  color?: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketConfigurations {
  platforms: Array<{ value: string; label: string; color?: string; description?: string }>;
  stacks: Array<{ value: string; label: string; color?: string; description?: string }>;
  priorities: Array<{ value: string; label: string; color?: string; description?: string }>;
  taskLevels: Array<{ value: string; label: string; color?: string; description?: string }>;
  taskTypes: Array<{ value: string; label: string; color?: string; description?: string }>;
  statuses: Array<{ value: string; label: string; color?: string; description?: string }>;
}

export interface CreateDropdownOptionData {
  type: 'platform' | 'stack' | 'priority' | 'taskLevel' | 'taskType' | 'status';
  value: string;
  label: string;
  color?: string;
  description?: string;
  order?: number;
}

export interface UpdateDropdownOptionData {
  value?: string;
  label?: string;
  color?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateShiftData {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  lunchBreakMinutes: number;
  overtimeThreshold: number;
  isFlexible: boolean;
  workingMinutes: number;
}

export interface UpdateShiftData {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  lunchBreakMinutes: number;
  overtimeThreshold: number;
  isFlexible: boolean;
  workingMinutes: number;
  isActive?: boolean;
}

export interface ShiftsFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isFlexible?: boolean;
}

export class SettingsService {
  /**
   * Get all shifts with pagination and filters
   */
  static async getShifts(filters: ShiftsFilters = {}): Promise<PaginatedResponse<Shift>> {
    try {
      return await apiUtils.getPaginated<Shift>('/api/shifts', filters);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch shifts');
    }
  }

  /**
   * Get all shifts without pagination (for dropdowns)
   */
  static async getAllShifts(): Promise<Shift[]> {
    try {
      const response = await this.getShifts({ limit: 100 });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch all shifts');
    }
  }

  /**
   * Get a single shift by ID
   */
  static async getShift(id: string): Promise<Shift> {
    try {
      return await api.get<Shift>(`/api/shifts/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch shift');
    }
  }

  /**
   * Create a new shift
   */
  static async createShift(data: CreateShiftData): Promise<Shift> {
    try {
      return await api.post<Shift>('/api/shifts', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to create shift');
    }
  }

  /**
   * Update an existing shift
   */
  static async updateShift(id: string, data: UpdateShiftData): Promise<Shift> {
    try {
      return await api.put<Shift>(`/api/shifts/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to update shift');
    }
  }

  /**
   * Delete a shift
   */
  static async deleteShift(id: string): Promise<void> {
    try {
      await api.delete(`/api/shifts/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to delete shift');
    }
  }

  /**
   * Get shifts for dropdown/select options
   */
  static async getShiftsForSelect(): Promise<Array<{ value: string; label: string; code: string }>> {
    try {
      const shifts = await this.getAllShifts();
      return shifts
        .filter(shift => shift.isActive)
        .map(shift => ({
          value: shift.id,
          label: `${shift.name} (${shift.code})`,
          code: shift.code,
        }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch shifts for selection');
    }
  }

  /**
   * Toggle shift active status
   */
  static async toggleShiftStatus(id: string, isActive: boolean): Promise<Shift> {
    try {
      return await api.patch<Shift>(`/api/shifts/${id}`, { isActive });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to toggle shift status');
    }
  }

  // ===== TICKET CONFIGURATION METHODS =====

  /**
   * Get ticket configurations (dropdown options)
   */
  static async getTicketConfigurations(): Promise<TicketConfigurations> {
    try {
      return await api.get<TicketConfigurations>('/api/settings/ticket-configurations');
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch ticket configurations');
    }
  }

  /**
   * Get all dropdown options grouped by type
   */
  static async getDropdownOptions(): Promise<Record<string, DropdownOption[]>> {
    try {
      return await api.get<Record<string, DropdownOption[]>>('/api/settings/dropdown-options');
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch dropdown options');
    }
  }

  /**
   * Create a new dropdown option
   */
  static async createDropdownOption(data: CreateDropdownOptionData): Promise<DropdownOption> {
    try {
      return await api.post<DropdownOption>('/api/settings/dropdown-options', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to create dropdown option');
    }
  }

  /**
   * Update an existing dropdown option
   */
  static async updateDropdownOption(id: string, data: UpdateDropdownOptionData): Promise<DropdownOption> {
    try {
      console.log('Sending to backend:', data); 
      return await api.put<DropdownOption>(`/api/settings/dropdown-options/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to update dropdown option');
    }
  }

  /**
   * Delete a dropdown option
   */
  static async deleteDropdownOption(id: string): Promise<void> {
    try {
      await api.delete(`/api/settings/dropdown-options/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to delete dropdown option');
    }
  }

  /**
   * Reorder dropdown options
   */
  static async reorderDropdownOptions(reorderData: Array<{ id: string; order: number; value?: string; label?: string }>): Promise<void> {
    try {
      await api.put('/api/settings/dropdown-options/reorder', { items: reorderData });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to reorder dropdown options');
    }
  }
}
