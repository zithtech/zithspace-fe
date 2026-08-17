import { api } from '@/lib/axios';

export interface EscalationAttachment {
    fileName: string;
    fileBase64: string; 
}

export interface EscalationPayload {
    subject: string;
    description: string;
    categoryId: string;
    priorityId: string;
    projectId?: string;
    statusId: string;
    targetMemberIds: string[];
    ticketIds?: string[];
    attachments?: EscalationAttachment[];
    existingUrls?: string[];
}

export class EscalationServiceV2 {
    /**
     * Create Escalation (Full Payload including Base64 attachments)
     */
    static async createEscalation(payload: EscalationPayload): Promise<any> {
        return await api.post('/api/escalations-v2', payload);
    }

    /**
     * Get all Escalations
     */
    static async getAllEscalations(limit?: number, offset?: number): Promise<any> {
        const response = await api.request({
            method: 'GET',
            url: '/api/escalations-v2',
            params: { limit, offset }
        });
        return response.data;
    }

    /**
     * Get Escalation by ID
     */
    static async getEscalationById(id: string): Promise<any> {
        return await api.get(`/api/escalations-v2/${id}`);
    }

    /**
     * Update Escalation
     */
    static async updateEscalation(id: string, payload: Partial<EscalationPayload>): Promise<any> {
        return await api.put(`/api/escalations-v2/${id}`, payload);
    }

    /**
     * Delete Escalation
     */
    static async deleteEscalation(id: string): Promise<any> {
        return await api.delete(`/api/escalations-v2/${id}`);
    }

    /**
     * Get all trashed escalations
     */
    static async getTrashEscalations(limit?: number, offset?: number): Promise<any> {
        const response = await api.request({
            method: 'GET',
            url: '/api/escalations-v2/trash',
            params: { limit, offset }
        });
        return response.data;
    }

    /**
     * Restore an escalation from trash
     */
    static async restoreEscalation(id: string): Promise<any> {
        return await api.post(`/api/escalations-v2/${id}/restore`);
    }

    /**
     * Permanently delete an escalation
     */
    static async permanentDeleteEscalation(id: string): Promise<any> {
        return await api.delete(`/api/escalations-v2/${id}/permanent`);
    }

    /**
     * Empty escalation trash
     */
    static async emptyTrash(): Promise<any> {
        return await api.delete('/api/escalations-v2/trash/empty');
    }

    /**
     * Bulk restore escalations
     */
    static async bulkRestore(ids: string[]): Promise<any> {
        return await api.post('/api/escalations-v2/trash/bulk-restore', { ids });
    }

    /**
     * Bulk permanently delete escalations
     */
    static async bulkPermanentDelete(ids: string[]): Promise<any> {
        return await api.post('/api/escalations-v2/trash/bulk-permanent-delete', { ids });
    }
}
