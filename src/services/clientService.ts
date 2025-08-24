import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface Client {
  _id: string;
  clientId: string;
  companyName: string;
  contactPerson: {
    firstName: string;
    lastName: string;
  };
  clientType: 'Individual' | 'Small Business' | 'Enterprise';
  email: {
    primary: string;
    alternate?: string;
  };
  phone: {
    primary: string;
    alternate?: string;
  };
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: 'India' | 'US';
    postalCode: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: 'India' | 'US';
    postalCode: string;
  };
  industry: string;
  businessType: string;
  taxInfo?: {
    gstNumber?: string;
    vatNumber?: string;
    taxId?: string;
  };
  paymentTerms?: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Due on Receipt' | 'Custom';
  status: 'Active' | 'Inactive' | 'Prospect' | 'Lead' | 'Suspended';
  assignedManager: {
    _id: string;
    name: string;
    position: string;
    email: string;
  };
  leadSource?: 'Referral' | 'Website' | 'Ads' | 'Cold Call' | 'Social Media' | 'Trade Show' | 'Other';
  tags?: string[];
  contractDetails?: {
    startDate?: string;
    endDate?: string;
    renewalDate?: string;
    value?: number;
    currency?: 'INR' | 'USD';
  };
  communicationPreferences?: {
    email: boolean;
    phone: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  notes?: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
  };
  updatedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  contactPersonName?: string;
  fullAddress?: string;
}

export interface CreateClientData {
  companyName: string;
  contactPerson: {
    firstName: string;
    lastName: string;
  };
  clientType: 'Individual' | 'Small Business' | 'Enterprise';
  email: {
    primary: string;
    alternate?: string;
  };
  phone: {
    primary: string;
    alternate?: string;
  };
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: 'India' | 'US';
    postalCode: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: 'India' | 'US';
    postalCode: string;
  };
  industry: string;
  businessType: string;
  taxInfo?: {
    gstNumber?: string;
    vatNumber?: string;
    taxId?: string;
  };
  paymentTerms?: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Due on Receipt' | 'Custom';
  status?: 'Active' | 'Inactive' | 'Prospect' | 'Lead' | 'Suspended';
  assignedManager: string;
  leadSource?: 'Referral' | 'Website' | 'Ads' | 'Cold Call' | 'Social Media' | 'Trade Show' | 'Other';
  tags?: string[];
  contractDetails?: {
    startDate?: string;
    endDate?: string;
    renewalDate?: string;
    value?: number;
    currency?: 'INR' | 'USD';
  };
  communicationPreferences?: {
    email: boolean;
    phone: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  notes?: string;
}

export interface UpdateClientData extends CreateClientData {
  // All fields from CreateClientData are available for updates
}

export interface ClientsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientType?: string;
  country?: string;
  assignedManager?: string;
  leadSource?: string;
  tags?: string;
}

export interface ClientStats {
  overview: {
    totalClients: number;
    activeClients: number;
    prospects: number;
    leads: number;
    inactiveClients: number;
  };
  clientTypes: Array<{
    _id: string;
    count: number;
  }>;
  countries: Array<{
    _id: string;
    count: number;
  }>;
}

export interface ClientSelectOption {
  value: string;
  label: string;
  contactPerson: string;
  email: string;
  clientId: string;
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
        throw new Error(error.message);
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
        throw new Error(error.message);
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
        throw new Error(error.message);
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
        throw new Error(error.message);
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
        throw new Error(error.message);
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
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch client statistics');
    }
  }

  /**
   * Get clients for dropdown/select options
   */
  static async getClientsForSelect(): Promise<ClientSelectOption[]> {
    try {
      return await api.get<ClientSelectOption[]>('/api/clients/select');
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch clients for selection');
    }
  }

  /**
   * Bulk update client status
   */
  static async bulkUpdateClientStatus(clientIds: string[], status: string): Promise<{ modifiedCount: number }> {
    try {
      return await api.put<{ modifiedCount: number }>('/api/clients/bulk/status', {
        clientIds,
        status
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to update client status');
    }
  }

  /**
   * Get clients for dropdown with simplified data
   */
  static async getClientsForDropdown(): Promise<Array<{ value: string; label: string; clientId: string }>> {
    try {
      const clients = await this.getClientsForSelect();
      return clients.map(client => ({
        value: client.value,
        label: client.label,
        clientId: client.clientId,
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch clients for dropdown');
    }
  }
}
