import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface RecruitmentClientBusinessDetails {
    id?: string;
    companyName?: string;
    yearEstablished?: number;
    revenueRange?: string;
}

export interface RecruitmentClientHiringPreference {
    id?: string;
    employmentType?: string;
    workType?: string;
    hiringLocation?: string;
}


export interface RecruitmentClientContact {
    id: string;
    personName: string;
    designation?: string;
    email?: string;
    phone?: string;
    linkedInUrl?: string;
}

export interface RecruitmentClientDocument {
    id: string;
    documentType?: string;
    documentUrl?: string;
}

export interface RecruitmentClient {
    id: string;
    clientName: string;
    accountType?: string;
    industry?: string;
    website?: string;
    companyEmail?: string;
    companyPhone?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    status: boolean;
    notes?: string;
    businessDetails: RecruitmentClientBusinessDetails[];
    hiringPreferences: RecruitmentClientHiringPreference[];
    implementationPartnerId?: string;
    primeVendorId?: string;
    contacts: RecruitmentClientContact[];
    documents: RecruitmentClientDocument[];
    createdAt: string;
    updatedAt: string;
}

export interface RecruitmentClientFilters {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
}

export class RecruitmentClientService {
    private static BASE_URL = '/api/recruitment-client';

    /**
     * Get all recruitment clients with pagination and filters
     */
    static async getClients(filters: RecruitmentClientFilters = {}): Promise<PaginatedResponse<RecruitmentClient>> {
        try {
            return await apiUtils.getPaginated<RecruitmentClient>(this.BASE_URL, filters);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to fetch recruitment clients');
        }
    }

    /**
     * Get a single recruitment client by ID
     */
    static async getClientById(id: string): Promise<RecruitmentClient> {
        try {
            return await api.get<RecruitmentClient>(`${this.BASE_URL}/${id}`);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to fetch recruitment client');
        }
    }

    /**
     * Create a new recruitment client
     */
    static async createClient(data: Partial<RecruitmentClient>): Promise<RecruitmentClient> {
        try {
            return await api.post<RecruitmentClient>(`${this.BASE_URL}/create`, data);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to create recruitment client');
        }
    }

    /**
     * Update an existing recruitment client
     */
    static async updateClient(id: string, data: Partial<RecruitmentClient>): Promise<void> {
        try {
            await api.put(`${this.BASE_URL}/${id}`, data);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to update recruitment client');
        }
    }

    /**
     * Delete a recruitment client
     */
    static async deleteClient(id: string): Promise<void> {
        try {
            await api.delete(`${this.BASE_URL}/${id}`);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to delete recruitment client');
        }
    }

    static async addContact(clientId: string, data: any): Promise<any> {
        return await api.post(`${this.BASE_URL}/${clientId}/contacts`, data);
    }

    static async deleteContact(clientId: string, contactId: string): Promise<any> {
        return await api.delete(`${this.BASE_URL}/${clientId}/contacts/${contactId}`);
    }

    /**
     * Get assigned implementation partners for a client
     */
    static async getAssignedPartners(clientId: string): Promise<any[]> {
        try {
            const response = await api.get<any[]>(`${this.BASE_URL}/${clientId}/partners`);
            return response || [];
        } catch (error) {
            console.error('Fetch Assigned Partners error:', error);
            return [];
        }
    }

    /**
     * Get assigned vendors for a client
     */
    static async getAssignedVendors(clientId: string): Promise<any[]> {
        try {
            const response = await api.get<any[]>(`${this.BASE_URL}/${clientId}/vendors`);
            return response || [];
        } catch (error) {
            console.error('Fetch Assigned Vendors error:', error);
            return [];
        }
    }

    /**
     * Assign a partner to a client
     */
    static async assignPartner(clientId: string, partnerId: string): Promise<void> {
        await api.post(`${this.BASE_URL}/${clientId}/assign-partner`, { partnerId });
    }

    /**
     * Remove a partner from a client
     */
    static async removePartner(clientId: string, partnerId: string): Promise<void> {
        await api.post(`${this.BASE_URL}/${clientId}/remove-partner`, { partnerId });
    }

    /**
     * Assign a vendor to a client
     */
    static async assignVendor(clientId: string, vendorId: string): Promise<void> {
        await api.post(`${this.BASE_URL}/${clientId}/assign-vendor`, { vendorId });
    }

    /**
     * Remove a vendor from a client
     */
    static async removeVendor(clientId: string, vendorId: string): Promise<void> {
        await api.post(`${this.BASE_URL}/${clientId}/remove-vendor`, { vendorId });
    }
}
