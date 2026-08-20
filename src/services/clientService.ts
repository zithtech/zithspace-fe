import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

// Simplified Client interface to match backend
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
  createdBy?: {
    id: string;
    name: string;
    workEmail: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export interface ClientsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ClientStats {
  overview: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
  };
  recentClients: Client[];
}

export interface ClientSelectOption {
  value: string;
  label: string;
  email: string;
  company?: string;
  contactPerson?: string;
}

export class ClientService {
  /**
   * Get all clients with pagination and filters
   */
  static async getClients(filters: ClientsFilters = {}): Promise<PaginatedResponse<Client>> {
    try {
      return await apiUtils.getPaginated<Client>('/api/clients', filters);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to fetch clients');
    }
  }

  /**
   * Get a single client by ID
   */
  static async getClient(id: string): Promise<Client> {
    try {
      return await api.get<Client>(`/api/clients/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to fetch client');
    }
  }

  /**
   * Create a new client
   */
  static async createClient(data: CreateClientData): Promise<Client> {
    try {
      return await api.post<Client>('/api/clients', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to create client');
    }
  }

  /**
   * Update an existing client
   */
  static async updateClient(id: string, data: UpdateClientData): Promise<Client> {
    try {
      return await api.put<Client>(`/api/clients/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to update client');
    }
  }

  /**
   * Delete a client (soft delete)
   */
  static async deleteClient(id: string): Promise<void> {
    try {
      await api.delete(`/api/clients/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to delete client');
    }
  }

  /**
   * Get client statistics for dashboard
   */
  static async getClientStats(): Promise<ClientStats> {
    try {
      return await api.get<ClientStats>('/api/clients/stats');
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to fetch client statistics');
    }
  }

  /**
   * Get clients for dropdown/select options
   */
  static async getClientsForSelect(): Promise<ClientSelectOption[]> {
    try {
      return await api.get<ClientSelectOption[]>('/api/clients-v2/select');
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to fetch clients for selection');
    }
  }

  /**
   * Bulk update client status
   */
  static async bulkUpdateClientStatus(clientIds: string[], isActive: boolean): Promise<{ modifiedCount: number }> {
    try {
      return await api.put<{ modifiedCount: number }>('/api/clients/bulk/status', {
        clientIds,
        isActive
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to update client status');
    }
  }

  /**
   * Search clients
   */
  static async searchClients(query: string, limit: number = 10): Promise<Client[]> {
    try {
      return await api.get<Client[]>(`/api/clients/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Failed to search clients');
    }
  }
}
