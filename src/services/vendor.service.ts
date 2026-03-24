import { api, ApiError, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface VendorContactPerson {
    id?: string;
    personName: string;
    designation?: string;
    email?: string;
    phone?: string;
    linkedInUrl?: string;
}

export interface VendorBusinessDetails {
    id?: string;
    registrationNumber?: string;
    taxId?: string;
    businessType?: string;
    yearEstabliliesh?: number;
    totalEmployees?: number;
}

export interface VendorRelations {
    id?: string;
    linkedVendor?: string;
    linkedClient?: string;
    supportsVisaSponsorship: boolean;
    visaTypesSupported?: string;
}

export interface VendorDocument {
    id?: string;
    documentType?: string;
    documentUrl?: string;
    base64?: string;
    fileName?: string;
}

export interface Vendor {
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
    contactPersons: VendorContactPerson[];
    businessDetails: VendorBusinessDetails[];
    relations: VendorRelations[];
    documents: VendorDocument[];
    createdAt: string;
    updatedAt: string;
}

export interface VendorFilters {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
    status?: string;
}

export class VendorService {
    /**
     * Get all vendors with pagination and filters
     */
    static async getVendors(filters: VendorFilters = {}): Promise<PaginatedResponse<Vendor>> {
        try {
            return await apiUtils.getPaginated<Vendor>('/api/vendor', filters);
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(error.message);
            }
            throw new Error('Failed to fetch vendors');
        }
    }

    /**
     * Get a single vendor by ID
     */
    static async getVendorById(id: string): Promise<Vendor> {
        try {
            const response = await api.get<Vendor>(`/api/vendor/${id}`);
            return response;
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(error.message);
            }
            throw new Error('Failed to fetch vendor');
        }
    }

    /**
     * Create a new vendor
     */
    static async createVendor(data: Partial<Vendor>): Promise<Vendor> {
        try {
            return await api.post<Vendor>('/api/vendor/create', data);
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(error.message);
            }
            throw new Error('Failed to create vendor');
        }
    }

    /**
     * Update an existing vendor
     */
    static async updateVendor(id: string, data: Partial<Vendor>): Promise<void> {
        try {
            await api.put(`/api/vendor/${id}`, data);
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(error.message);
            }
            throw new Error('Failed to update vendor');
        }
    }

    /**
     * Delete a vendor
     */
    static async deleteVendor(id: string): Promise<void> {
        try {
            await api.delete(`/api/vendor/${id}`);
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(error.message);
            }
            throw new Error('Failed to delete vendor');
        }
    }

    /**
     * Add a contact person
     */
    static async addContact(vendorId: string, data: Partial<VendorContactPerson>): Promise<VendorContactPerson> {
        try {
            const response = await api.post<VendorContactPerson>(`/api/vendor/${vendorId}/contact`, data);
            return response;
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(error.message);
            }
            throw new Error('Failed to add contact');
        }
    }

    /**
     * Delete a contact person
     */
    static async deleteContact(contactId: string): Promise<void> {
        try {
            await api.delete(`/api/vendor/contact/${contactId}`);
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(error.message);
            }
            throw new Error('Failed to delete contact');
        }
    }

    /**
     * Delete a document
     */
    static async deleteDocument(documentId: string): Promise<void> {
        try {
            await api.delete(`/api/vendor/document/${documentId}`);
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(error.message);
            }
            throw new Error('Failed to delete document');
        }
    }

    /**
     * Add a document directly to a vendor
     */
    static async addDocument(vendorId: string, data: { base64: string, fileName: string, documentType: string }): Promise<VendorDocument> {
        try {
            return await api.post<VendorDocument>(`/api/vendor/${vendorId}/document`, data);
        } catch (error) {
            if (error instanceof ApiError) {
                throw new Error(error.message);
            }
            throw new Error('Failed to add document');
        }
    }

    /**
     * Get assigned clients for a vendor
     */
    static async getAssignedClients(vendorId: string): Promise<any[]> {
        try {
            const response = await api.get<any[]>(`/api/vendor/${vendorId}/clients`);
            return response || [];
        } catch (error) {
            console.error('Fetch Assigned Clients error:', error);
            return [];
        }
    }

    /**
     * Assign a client to a vendor
     */
    static async assignClient(vendorId: string, clientId: string): Promise<void> {
        await api.post(`/api/vendor/${vendorId}/assign-client`, { clientId });
    }

    /**
     * Remove a client from a vendor
     */
    static async removeClient(vendorId: string, clientId: string): Promise<void> {
        await api.post(`/api/vendor/${vendorId}/remove-client`, { clientId });
    }

    /**
     * Get assigned implementation partners for a vendor
     */
    static async getAssignedPartners(vendorId: string): Promise<any[]> {
        try {
            const response = await api.get<any[]>(`/api/vendor/${vendorId}/partners`);
            return response || [];
        } catch (error) {
            console.error('Fetch Assigned Partners error:', error);
            return [];
        }
    }

    /**
     * Assign a partner to a vendor
     */
    static async assignPartner(vendorId: string, partnerId: string): Promise<void> {
        await api.post(`/api/vendor/${vendorId}/assign-partner`, { partnerId });
    }

    /**
     * Remove a partner from a vendor
     */
    static async removePartner(vendorId: string, partnerId: string): Promise<void> {
        await api.post(`/api/vendor/${vendorId}/remove-partner`, { partnerId });
    }
}
