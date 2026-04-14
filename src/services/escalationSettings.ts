import { api } from '@/lib/axios';

export interface EscalationCategory {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    isActive: boolean;
}

export interface EscalationPriority {
    id: string;
    name: string;
    weight: number;
    color: string | null;
    isActive: boolean;
}

export interface EscalationStatus {
    id: string;
    name: string;
    weight?: number;
    color: string | null;
    isActive: boolean;
    isDefault: boolean;
    isFinal: boolean;
}

function mapToFrontend(item: any, type: 'category' | 'priority' | 'status'): any {
    return {
        id: item.id,
        name: item.displayname || item.displayName || item.name,
        description: item.description,
        weight: item.priorityweight !== undefined ? item.priorityweight : (item.priorityWeight !== undefined ? item.priorityWeight : item.weight),
        color: item.visualcolor || item.visualColor || item.color,
        isActive: item.status !== undefined ? item.status : item.isActive,
        isFinal: item.finalstate !== undefined ? item.finalstate : (item.isFinal !== undefined ? item.isFinal : false),
        isDefault: item.defaultstatus !== undefined ? item.defaultstatus : (item.isDefault !== undefined ? item.isDefault : false),
    };
}

export class EscalationSettingsService {
    // ----- Categories -----
    static async getCategories(): Promise<EscalationCategory[]> {
        const res: any = await api.get('/api/escalation-categories');
        const items = res.data?.data || res.data || res;
        if (Array.isArray(items)) {
            return items.map((item: any) => mapToFrontend(item, 'category'));
        }
        return [];
    }

    static async createCategory(data: Partial<EscalationCategory>): Promise<any> {
        return await api.post('/api/escalation-categories', {
            displayName: data.name,
            description: data.description,
            visualColor: data.color,
            status: data.isActive
        });
    }

    static async updateCategory(id: string, data: Partial<EscalationCategory>): Promise<any> {
        return await api.put(`/api/escalation-categories/${id}`, {
            displayName: data.name,
            description: data.description,
            visualColor: data.color,
            status: data.isActive
        });
    }

    static async deactivateCategory(id: string): Promise<any> {
        return await api.patch(`/api/escalation-categories/${id}/deactivate`);
    }

    static async deleteCategory(id: string): Promise<any> {
        return await api.delete(`/api/escalation-categories/${id}`);
    }

    // ----- Priorities -----
    static async getPriorities(): Promise<EscalationPriority[]> {
        const res: any = await api.get('/api/escalation-priorities');
        const items = res.data?.data || res.data || res;
        if (Array.isArray(items)) {
            return items.map((item: any) => mapToFrontend(item, 'priority'));
        }
        return [];
    }

    static async createPriority(data: Partial<EscalationPriority>): Promise<any> {
        return await api.post('/api/escalation-priorities', {
            displayName: data.name,
            priorityWeight: data.weight || 0,
            visualColor: data.color,
            status: data.isActive
        });
    }

    static async updatePriority(id: string, data: Partial<EscalationPriority>): Promise<any> {
        return await api.put(`/api/escalation-priorities/${id}`, {
            displayName: data.name,
            priorityWeight: data.weight,
            visualColor: data.color,
            status: data.isActive
        });
    }

    static async deactivatePriority(id: string): Promise<any> {
        return await api.patch(`/api/escalation-priorities/${id}/deactivate`);
    }

    static async deletePriority(id: string): Promise<any> {
        return await api.delete(`/api/escalation-priorities/${id}`);
    }

    // ----- Statuses -----
    static async getStatuses(): Promise<EscalationStatus[]> {
        const res: any = await api.get('/api/escalation-statuses');
        const items = res.data?.data || res.data || res;
        if (Array.isArray(items)) {
            return items.map((item: any) => mapToFrontend(item, 'status'));
        }
        return [];
    }

    static async createStatus(data: Partial<EscalationStatus>): Promise<any> {
        return await api.post('/api/escalation-statuses', {
            displayName: data.name,
            priorityWeight: data.weight || 0,
            visualColor: data.color,
            status: data.isActive,
            isFinal: data.isFinal || false,
            isDefault: data.isDefault || false
        });
    }

    static async updateStatus(id: string, data: Partial<EscalationStatus>): Promise<any> {
        return await api.put(`/api/escalation-statuses/${id}`, {
            displayName: data.name,
            priorityWeight: data.weight,
            visualColor: data.color,
            status: data.isActive,
            isFinal: data.isFinal,
            isDefault: data.isDefault
        });
    }

    static async deactivateStatus(id: string): Promise<any> {
        return await api.patch(`/api/escalation-statuses/${id}/deactivate`);
    }

    static async deleteStatus(id: string): Promise<any> {
        return await api.delete(`/api/escalation-statuses/${id}`);
    }
}
