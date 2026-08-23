import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface ImplementationContactPerson {
    id?: string;
    personName: string;
    designation?: string;
    email?: string;
    phone?: string;
    linkedInUrl?: string;
}

export interface ImplementationBusinessDetails {
    id?: string;
    registrationNumber?: string;
    taxId?: string;
    businessType?: string;
    yearEstabliliesh?: number;
    totalEmployees?: number;
}

export interface ImplementationRelations {
    id?: string;
    linkedVendor?: string;
    linkedClient?: string;
    supportsVisaSponsorship: boolean;
    visaTypesSupported?: string;
}

export interface ImplementationDocument {
    id?: string;
    documentType?: string;
    documentUrl?: string;
    base64?: string;
    fileName?: string;
}

export interface ImplementationPartner {
    id: string;
    companyName: string;
    industry?: string;
    website?: string;
    companyEmail?: string;
    companyPhone?: string;
    status: boolean;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    notes?: string;
    contactPersons: ImplementationContactPerson[];
    businessDetails: ImplementationBusinessDetails[];
    relations: ImplementationRelations[];
    documents: ImplementationDocument[];
    createdAt: string;
    updatedAt: string;
}

export interface ImplementationPartnerFilters {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
    status?: string;
}

export class ImplementationPartnerService {
    /**
     * Get all implementation partners with pagination and filters
     */
    static async getPartners(filters: ImplementationPartnerFilters = {}): Promise<PaginatedResponse<ImplementationPartner>> {
        try {
            return await apiUtils.getPaginated<ImplementationPartner>('/api/implementation-partner', filters);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to fetch implementation partners');
        }
    }

    /**
     * Get a single implementation partner by ID
     */
    static async getPartnerById(id: string): Promise<ImplementationPartner> {
        try {
            const response = await api.get<ImplementationPartner>(`/api/implementation-partner/${id}`);
            return response;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to fetch implementation partner');
        }
    }

    /**
     * Create a new implementation partner
     */
    static async createPartner(data: Partial<ImplementationPartner>): Promise<ImplementationPartner> {
        try {
            return await api.post<ImplementationPartner>('/api/implementation-partner/create', data);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to create implementation partner');
        }
    }

    /**
     * Update an existing implementation partner
     */
    static async updatePartner(id: string, data: Partial<ImplementationPartner>): Promise<void> {
        try {
            await api.put(`/api/implementation-partner/${id}`, data);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to update implementation partner');
        }
    }

    /**
     * Delete an implementation partner
     */
    static async deletePartner(id: string): Promise<void> {
        try {
            await api.delete(`/api/implementation-partner/${id}`);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to delete implementation partner');
        }
    }

    /**
     * Add a contact person
     */
    static async addContact(partnerId: string, data: Partial<ImplementationContactPerson>): Promise<ImplementationContactPerson> {
        try {
            const response = await api.post<ImplementationContactPerson>(`/api/implementation-partner/${partnerId}/contact`, data);
            return response;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to add contact');
        }
    }

    /**
     * Delete a contact person
     */
    static async deleteContact(contactId: string): Promise<void> {
        try {
            await api.delete(`/api/implementation-partner/contact/${contactId}`);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to delete contact');
        }
    }

    /**
     * Delete a document
     */
    static async deleteDocument(documentId: string): Promise<void> {
        try {
            await api.delete(`/api/implementation-partner/document/${documentId}`);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to delete document');
        }
    }

    /**
     * Add a document directly to a partner
     */
    static async addDocument(partnerId: string, data: { base64: string, fileName: string, documentType: string }): Promise<ImplementationDocument> {
        try {
            return await api.post<ImplementationDocument>(`/api/implementation-partner/${partnerId}/document`, data);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to add document');
        }
    }

    /**
     * Get assigned clients for a partner
     */
    static async getAssignedClients(partnerId: string): Promise<any[]> {
        try {
            const response = await api.get<any[]>(`/api/implementation-partner/${partnerId}/clients`);
            return response || [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to fetch assigned clients');
        }
    }

    /**
     * Assign a client to a partner
     */
    static async assignClient(partnerId: string, clientId: string): Promise<void> {
        try {
            await api.post(`/api/implementation-partner/${partnerId}/assign-client`, { clientId });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to assign client');
        }
    }

    /**
     * Remove a client from a partner
     */
    static async removeClient(partnerId: string, clientId: string): Promise<void> {
        try {
            await api.post(`/api/implementation-partner/${partnerId}/remove-client`, { clientId });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to remove client');
        }
    }

    /**
     * Get assigned vendors for a partner
     */
    static async getAssignedVendors(partnerId: string): Promise<any[]> {
        try {
            const response = await api.get<any[]>(`/api/implementation-partner/${partnerId}/vendors`);
            return response || [];
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to fetch assigned vendors');
        }
    }

    /**
     * Assign a vendor to a partner
     */
    static async assignVendor(partnerId: string, vendorId: string): Promise<void> {
        try {
            await api.post(`/api/implementation-partner/${partnerId}/assign-vendor`, { vendorId });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to assign vendor');
        }
    }

    /**
     * Remove a vendor from a partner
     */
    static async removeVendor(partnerId: string, vendorId: string): Promise<void> {
        try {
            await api.post(`/api/implementation-partner/${partnerId}/remove-vendor`, { vendorId });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error('Failed to remove vendor');
        }
    }
}
