import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

// ClientV2 interface based on backend structure
export interface ClientV2 {
  id: string;
  clientCode: string;
  companyName: string;
  legalName?: string;
  clientType?: string;
  parentId?: string;
  companySize?: string;
  industry?: string;
  contractValue?: number;
  yearOfIncorporation?: string;
  duration?: string;
  gstVatTaxId?: string; // GST/VAT/Tax ID
  registrationNumber?: string;
  country?: string;
  website?: string;
  defaultCurrency?: string;
  billingAddress?: string;
  riskLevel?: string;
  status?: string;
  pan?: string; // PAN Number
  vatNumber?: string;
  dunsNumber?: string;
  msmeRegistration?: string;
  paymentTerms?: string;
  creditLimit?: number;
  billingContactEmail?: string; // Billing Contact Email
  accountsPayableName?: string;
  tdsApplicable?: boolean;
  reverseCharge?: boolean;
  accountManagerId?: string;
  salesOwnerId?: string;
  deliveryOwnerId?: string;
  clientSegment?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  renewalType?: string;
  slaLevel?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscSwift?: string;
  currencyOfPayment?: string;
  preferredPaymentMode?: string;
  isActive: boolean;
  tenantId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  accountManager?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  salesOwner?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  deliveryOwner?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface ClientV2Filters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientType?: string;
  riskLevel?: string;
}

export class ClientV2Service {
  /**
   * Get all clients-v2 with pagination and filters
   */
  static async getClients(filters: ClientV2Filters = {}): Promise<PaginatedResponse<ClientV2>> {
    try {
      return await apiUtils.getPaginated<ClientV2>('/api/clients-v2', filters);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch clients');
    }
  }

  /**
   * Get a single client-v2 by ID
   */
  static async getClient(id: string): Promise<ClientV2> {
    try {
      return await api.get<ClientV2>(`/api/clients-v2/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch client');
    }
  }

  /**
   * Create a new client-v2
   */
  static async createClient(data: Partial<ClientV2>): Promise<ClientV2> {
    try {
      return await api.post<ClientV2>('/api/clients-v2', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to create client');
    }
  }

  /**
   * Update an existing client-v2
   */
  static async updateClient(id: string, data: Partial<ClientV2>): Promise<ClientV2> {
    try {
      return await api.put<ClientV2>(`/api/clients-v2/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to update client');
    }
  }

  /**
   * List existing projects in the tenant that are NOT yet linked to this
   * client. Used by the "Import projects" picker on the Projects tab.
   */
  static async getImportableProjects(
    clientId: string,
    search?: string,
  ): Promise<ImportableProject[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get<ImportableProject[]>(
      `/api/clients-v2/${clientId}/projects/importable${qs}`,
    );
  }

  /**
   * Bulk-link existing projects to a client.
   */
  static async importProjects(
    clientId: string,
    projectIds: string[],
  ): Promise<{ linked: number; skipped: number; projectIds: string[] }> {
    return api.post(`/api/clients-v2/${clientId}/projects/import`, {
      projectIds,
    });
  }
}

export interface ImportableProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  projectManagerId: string | null;
  projectManagerName: string | null;
  createdAt: string;
  otherClientCount: number;
}
