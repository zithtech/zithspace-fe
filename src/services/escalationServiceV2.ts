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
    static async getAllEscalations(): Promise<any[]> {
        const res: any = await api.get('/api/escalations-v2');
        return res || [];
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
}
